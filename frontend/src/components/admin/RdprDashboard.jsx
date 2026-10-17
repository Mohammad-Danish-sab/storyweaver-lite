import { useCallback, useEffect, useState } from "react";

const libraries = [["GP_LIB_KARNATAKA_01", "Gram Panchayat Library #01 (Mysuru)"], ["GP_LIB_KARNATAKA_02", "Gram Panchayat Library #02 (Belagavi)"], ["GP_LIB_KARNATAKA_03", "Gram Panchayat Library #03 (Kalaburagi)"]];

export default function RdprDashboard({ onBack }) {
  const [libraryId, setLibraryId] = useState(libraries[0][0]);
  const [summary, setSummary] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    try {
      const [summaryResponse, submissionResponse] = await Promise.all([fetch(`http://localhost:8000/api/v1/telemetry/summary?library_id=${encodeURIComponent(libraryId)}`), fetch("http://localhost:8000/api/v1/submissions?status_filter=pending")]);
      if (!summaryResponse.ok || !submissionResponse.ok) throw new Error();
      setSummary(await summaryResponse.json()); setSubmissions(await submissionResponse.json());
    } catch { setMessage("The admin service is unavailable. Check that the library server is running."); }
    finally { setLoading(false); }
  }, [libraryId]);
  useEffect(() => { load(); }, [load]);
  const updateSubmission = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/submissions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error();
      setSubmissions((items) => items.filter((item) => item.id !== id));
      setMessage(status === "published" ? "Story approved for the community collection." : "Story returned for more work.");
    } catch { setMessage("That update could not be saved. Please try again."); }
  };
  return <main className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">Staff area</p><h1>Library dashboard</h1><p>Reading activity and young-author submissions.</p></div><button className="secondary-action admin-back" onClick={onBack}>← Back to library</button></header>
    <section className="admin-toolbar"><label htmlFor="library-select">Library terminal</label><select id="library-select" value={libraryId} onChange={(event) => setLibraryId(event.target.value)}>{libraries.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><button className="refresh-button" onClick={load} disabled={loading}>↻ Refresh data</button></section>
    {message && <p className="admin-message" role="status">{message}</p>}
    {loading ? <div className="empty-state">Loading staff data…</div> : <>
      <section className="metric-grid" aria-label="Reading statistics"><Metric label="Reading sessions" value={summary?.total_sessions ?? 0} /><Metric label="Stories finished" value={summary?.completed_stories ?? 0} /><Metric label="Completion rate" value={summary?.completion_rate ?? "0%"} /><Metric label="Preferred language" value={(summary?.preferred_language ?? "kn").toUpperCase()} /></section>
      <section className="review-section"><div className="review-heading"><div><p className="eyebrow">Young authors</p><h2>Stories waiting for review</h2></div><span>{submissions.length} pending</span></div>{submissions.length ? <div className="submission-list">{submissions.map((submission) => <article className="submission-card" key={submission.id}><div><span className="submission-meta">{submission.language === "kn" ? "Kannada" : "English"} · {new Date(submission.created_at).toLocaleDateString()}</span><h3>{submission.title}</h3><p className="submission-prompt">Prompt: {submission.prompt || "Free writing"}</p><p>{submission.content}</p></div><div className="review-actions"><button onClick={() => updateSubmission(submission.id, "returned")} className="secondary-action">Return</button><button onClick={() => updateSubmission(submission.id, "published")} className="primary-action">Approve</button></div></article>)}</div> : <div className="empty-state"><strong>All caught up.</strong><span>New child-authored stories will appear here for review.</span></div>}</section>
    </>}
  </main>;
}
function Metric({ label, value }) { return <article className="metric-card"><p>{label}</p><strong>{value}</strong></article>; }
