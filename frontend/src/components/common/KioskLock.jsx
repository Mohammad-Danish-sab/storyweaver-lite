import { useState } from "react";

export default function KioskLock({ isOpen, onClose, onManualSync, onOpenDashboard }) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  if (!isOpen) return null;
  const handleSubmit = (event) => {
    event.preventDefault();
    if (pin === "9934") { setIsAuthenticated(true); setPin(""); }
    else { setSyncStatus("That PIN is not correct. Please try again."); setPin(""); }
  };
  const sync = async () => { setSyncStatus("Syncing your library…"); await onManualSync(); setSyncStatus("Library is up to date."); };
  return <div className="modal-backdrop" role="presentation"><section className="librarian-modal" role="dialog" aria-modal="true" aria-labelledby="librarian-title"><button className="modal-close" onClick={onClose} aria-label="Close">×</button><p className="eyebrow">Device controls</p><h2 id="librarian-title">Librarian panel</h2>{!isAuthenticated ? <form onSubmit={handleSubmit}><p>Enter the four-digit staff PIN to manage this reading station.</p><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength="4" placeholder="• • • •" aria-label="Librarian PIN" autoFocus /><button className="primary-action" type="submit">Unlock controls</button>{syncStatus && <small className="form-message">{syncStatus}</small>}<small className="pin-hint">Staff PIN required</small></form> : <div className="control-stack"><div className="device-status"><i /> This kiosk is ready for readers</div><button className="primary-action" onClick={sync}>↻ Sync story library</button><button className="secondary-action" onClick={onOpenDashboard}>Open staff dashboard</button>{syncStatus && <small className="form-message">{syncStatus}</small>}<button className="secondary-action" onClick={() => { setIsAuthenticated(false); onClose(); }}>Lock controls</button></div>}</section></div>;
}
