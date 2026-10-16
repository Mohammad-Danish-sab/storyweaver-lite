import { openDB } from "idb";

const DB_NAME = "storyweaver_lite_db";
const STORE_NAME = "cached_stories";

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export async function cacheStories(stories) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  for (const story of stories) {
    await tx.store.put(story);
  }
  await tx.done;
}

export async function getCachedStories() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function getCachedStoryById(id) {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}
