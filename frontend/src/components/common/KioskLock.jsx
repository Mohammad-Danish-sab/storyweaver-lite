import { useState } from "react";
import { API_BASE_URL } from "../../services/api";

export default function KioskLock({ isOpen, onClose, onManualSync, onOpenDashboard }) {
  const [pin, setPin] = useState("");
  const [verifiedPin, setVerifiedPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsVerifying(true);
    setSyncStatus("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (response.status === 401) throw new Error("That PIN is not correct. Please try again.");
      if (response.status === 503) throw new Error("Set ADMIN_PIN in the root .env file, then restart the backend.");
      if (!response.ok) throw new Error("The PIN could not be verified. Please try again.");
      setVerifiedPin(pin);
      setIsAuthenticated(true);
      setPin("");
    } catch (error) {
      setSyncStatus(error.message || "The PIN could not be verified. Please try again.");
      setPin("");
    } finally {
      setIsVerifying(false);
    }
  };
  const sync = async () => { setSyncStatus("Syncing your library…"); await onManualSync(); setSyncStatus("Library is up to date."); };
  return <div className="modal-backdrop" role="presentation"><section className="librarian-modal" role="dialog" aria-modal="true" aria-labelledby="librarian-title"><button className="modal-close" onClick={onClose} aria-label="Close">×</button><p className="eyebrow">Device controls</p><h2 id="librarian-title">Librarian panel</h2>{!isAuthenticated ? <form onSubmit={handleSubmit}><p>Enter the staff PIN to manage this reading station.</p><input value={pin} onChange={(event) => setPin(event.target.value)} maxLength="100" placeholder="Staff PIN" aria-label="Librarian PIN" autoFocus required /><button className="primary-action" type="submit" disabled={isVerifying}>{isVerifying ? "Checking…" : "Unlock controls"}</button>{syncStatus && <small className="form-message" role="alert">{syncStatus}</small>}</form> : <div className="control-stack"><div className="device-status"><i /> This kiosk is ready for readers</div><button className="primary-action" onClick={sync}>↻ Sync story library</button><button className="secondary-action" onClick={() => onOpenDashboard(verifiedPin)}>Open staff dashboard</button>{syncStatus && <small className="form-message">{syncStatus}</small>}<button className="secondary-action" onClick={() => { setIsAuthenticated(false); onClose(); }}>Lock controls</button></div>}</section></div>;
}
