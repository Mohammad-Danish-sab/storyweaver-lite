import React, { useState, useEffect } from "react";

export default function RdprDashboard({ onBack }) {
  const [summary, setSummary] = useState(null);
  const [libraryId, setLibraryId] = useState("GP_LIB_KARNATAKA_01");
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (libId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/telemetry/summary?library_id=${libId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.warn("Failed to fetch telemetry summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(libraryId);
  }, [libraryId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900 font-sans select-none">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">📊</span>
          <div>
            <h1 className="text-2xl font-bold">
              RDPR Karnataka Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Rural Public Library Reading Telemetry
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="bg-gray-200 hover:bg-gray-300 font-bold px-5 py-2.5 rounded-2xl text-lg transition"
        >
          ⬅ Back to Library View
        </button>
      </div>

      {/* Library Selector */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 flex items-center justify-between">
        <label className="text-lg font-bold text-gray-700">
          Select Library Terminal:
        </label>
        <select
          value={libraryId}
          onChange={(e) => setLibraryId(e.target.value)}
          className="p-3 border-2 border-emerald-500 rounded-2xl text-lg font-bold bg-emerald-50 outline-none"
        >
          <option value="GP_LIB_KARNATAKA_01">
            Gram Panchayat Library #01 (Mysuru)
          </option>
          <option value="GP_LIB_KARNATAKA_02">
            Gram Panchayat Library #02 (Belagavi)
          </option>
          <option value="GP_LIB_KARNATAKA_03">
            Gram Panchayat Library #03 (Kalaburagi)
          </option>
        </select>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="text-center py-20 text-xl font-bold text-gray-500">
          Loading Analytics Data...
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-md border-t-8 border-emerald-500">
            <p className="text-gray-500 font-bold">Total Reading Sessions</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-2">
              {summary.total_sessions}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-md border-t-8 border-amber-500">
            <p className="text-gray-500 font-bold">Completed Stories</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-2">
              {summary.completed_stories}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-md border-t-8 border-blue-500">
            <p className="text-gray-500 font-bold">Completion Rate</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-2">
              {summary.completion_rate}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-md border-t-8 border-purple-500">
            <p className="text-gray-500 font-bold">Preferred Language</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-2 uppercase">
              {summary.preferred_language}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-red-500 font-bold">
          No telemetry records found for this terminal.
        </div>
      )}
    </div>
  );
}
