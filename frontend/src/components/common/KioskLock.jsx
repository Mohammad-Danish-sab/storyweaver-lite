import React, { useState } from "react";

export default function KioskLock({ isOpen, onClose, onManualSync }) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");

  const DEFAULT_PIN = "1234"; // Default PIN for rural library staff

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === DEFAULT_PIN) {
      setIsAuthenticated(true);
      setPin("");
    } else {
      alert("Incorrect PIN / ತಪ್ಪು ಪಿನ್ ಸಂಖ್ಯೆ");
      setPin("");
    }
  };

  const handleSync = async () => {
    setSyncStatus("Syncing stories from server...");
    try {
      await onManualSync();
      setSyncStatus("✅ Sync Complete! Updated offline library.");
    } catch (err) {
      setSyncStatus("❌ Sync Failed. Check internet connection.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-emerald-600">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            🔒 Librarian Panel / ಗ್ರಂಥಪಾಲಕರ ವಿಭಾಗ
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter 4-digit Librarian PIN to access system controls:
            </p>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN (Default: 1234)"
              className="w-full text-center text-3xl tracking-widest p-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition"
            >
              Verify PIN
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800">
                Device Status: Connected (GP Library Terminal #04)
              </p>
            </div>

            <button
              onClick={handleSync}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center space-x-2"
            >
              <span>🔄 Sync Latest Stories</span>
            </button>

            {syncStatus && (
              <p className="text-xs text-center font-bold text-gray-700 mt-2">
                {syncStatus}
              </p>
            )}

            <button
              onClick={() => {
                setIsAuthenticated(false);
                onClose();
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-xl transition"
            >
              Lock Kiosk Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
