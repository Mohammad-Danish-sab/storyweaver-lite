import { useEffect, useState } from "react";

const STORAGE_KEY = "storyweaver-accessibility";
const defaults = { textSize: 100, highContrast: false, readableFont: false };

function loadPreferences() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return defaults;
  }
}

export default function AccessibilityControls() {
  const [preferences, setPreferences] = useState(loadPreferences);

  useEffect(() => {
    document.documentElement.style.setProperty("--reading-scale", `${preferences.textSize}%`);
    document.documentElement.classList.toggle("high-contrast", preferences.highContrast);
    document.documentElement.classList.toggle("readable-font", preferences.readableFont);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  return (
    <details className="accessibility-menu">
      <summary aria-label="Accessibility options">Aa</summary>
      <div className="accessibility-options">
        <label htmlFor="reading-text-size">Text size</label>
        <input
          id="reading-text-size"
          type="range"
          min="90"
          max="150"
          step="10"
          value={preferences.textSize}
          onChange={(event) => setPreferences((current) => ({ ...current, textSize: Number(event.target.value) }))}
        />
        <span>{preferences.textSize}%</span>
        <label><input type="checkbox" checked={preferences.highContrast} onChange={(event) => setPreferences((current) => ({ ...current, highContrast: event.target.checked }))} /> High contrast</label>
        <label><input type="checkbox" checked={preferences.readableFont} onChange={(event) => setPreferences((current) => ({ ...current, readableFont: event.target.checked }))} /> Easy-reading font</label>
      </div>
    </details>
  );
}
