import { openDB } from "idb";
import { API_BASE_URL } from "./api";

const TELEMETRY_DB = "storyweaver_telemetry_db";
const TELEMETRY_STORE = "pending_logs";
const READER_ID_KEY = "storyweaver-reader-id";

function getReaderId() {
  let readerId = localStorage.getItem(READER_ID_KEY);
  if (!readerId) {
    readerId = crypto.randomUUID();
    localStorage.setItem(READER_ID_KEY, readerId);
  }
  return readerId;
}

async function getTelemetryDB() {
  return openDB(TELEMETRY_DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(TELEMETRY_STORE)) {
        db.createObjectStore(TELEMETRY_STORE, { autoIncrement: true });
      }
    },
  });
}

// Queue metric event locally
export async function queueTelemetry(logData) {
  const db = await getTelemetryDB();
  await db.add(TELEMETRY_STORE, {
    ...logData,
    reader_id: getReaderId(),
    timestamp: new Date().toISOString(),
  });

  // Attempt sync immediately if online
  if (navigator.onLine) {
    await flushTelemetryQueue();
  }
}

// Flush stored metrics to FastAPI server
export async function flushTelemetryQueue() {
  const db = await getTelemetryDB();
  const tx = db.transaction(TELEMETRY_STORE, "readwrite");
  const store = tx.objectStore(TELEMETRY_STORE);
  const allLogs = await store.getAll();
  const keys = await store.getAllKeys();

  if (allLogs.length === 0) return;

  for (let i = 0; i < allLogs.length; i++) {
    try {
      const res = await fetch(`${API_BASE_URL}/telemetry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allLogs[i]),
      });

      if (res.ok) {
        // Delete synced item from IndexedDB
        const deleteTx = db.transaction(TELEMETRY_STORE, "readwrite");
        await deleteTx.objectStore(TELEMETRY_STORE).delete(keys[i]);
        await deleteTx.done;
      }
    } catch {
      console.warn("[Telemetry Sync] Connection offline. Retrying later...");
      break;
    }
  }
}

// Auto-sync trigger on reconnect
window.addEventListener("online", flushTelemetryQueue);
