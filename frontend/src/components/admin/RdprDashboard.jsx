import { useCallback, useEffect, useMemo, useState } from "react";
import "./RdprDashboard.css";

const API_URL = "http://localhost:8000/api/v1";
const libraries = [["GP_LIB_KARNATAKA_01", "Gram Panchayat Library #01 (Mysuru)"], ["GP_LIB_KARNATAKA_02", "Gram Panchayat Library #02 (Belagavi)"], ["GP_LIB_KARNATAKA_03", "Gram Panchayat Library #03 (Kalaburagi)"]];
const categories = ["animals", "folktales", "nature", "science", "friendship", "community"];
const emptyDraft = {
  title_en: "",
  title_kn: "",
  category: "animals",
  level: "1",
  cover_image: "",
  pages_en: "",
  pages_kn: "",
};

export default function RdprDashboard({ adminPin, onBack }) {
  const [libraryId, setLibraryId] = useState(libraries[0][0]);
  const [summary, setSummary] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stories, setStories] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const adminHeaders = useMemo(() => ({ "X-Admin-Pin": adminPin }), [adminPin]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [summaryResponse, submissionResponse, storiesResponse] = await Promise.all([
        fetch(`${API_URL}/telemetry/summary?library_id=${encodeURIComponent(libraryId)}`, { headers: adminHeaders }),
        fetch(`${API_URL}/submissions?status_filter=pending`, { headers: adminHeaders }),
        fetch(`${API_URL}/stories`),
      ]);
      if (!summaryResponse.ok || !submissionResponse.ok || !storiesResponse.ok) {
        throw new Error("The admin service returned an error.");
      }
      const [nextSummary, nextSubmissions, nextStories] = await Promise.all([
        summaryResponse.json(),
        submissionResponse.json(),
        storiesResponse.json(),
      ]);
      setSummary(nextSummary);
      setSubmissions(nextSubmissions);
      setStories(nextStories);
    } catch (error) {
      console.error("Could not load admin data.", error);
      setMessage("The admin service is unavailable. Check that the library server is running.");
    } finally {
      setLoading(false);
    }
  }, [adminHeaders, libraryId]);

  useEffect(() => { load(); }, [load]);

  const updateSubmission = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/submissions/${id}`, {
        method: "PATCH",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Could not update the submission.");
      setSubmissions((items) => items.filter((item) => item.id !== id));
      setMessage(status === "published" ? "Story approved for the community collection." : "Story returned for more work.");
    } catch (error) {
      console.error("Could not update submission.", error);
      setMessage("That update could not be saved. Please try again.");
    }
  };

  const uploadStory = async (event) => {
    event.preventDefault();
    const englishPages = draft.pages_en.split(/\r?\n/).map((page) => page.trim()).filter(Boolean);
    const kannadaPages = draft.pages_kn.split(/\r?\n/).map((page) => page.trim()).filter(Boolean);
    if (!englishPages.length || englishPages.length !== kannadaPages.length) {
      setMessage("Add the same number of non-empty page lines in English and Kannada.");
      return;
    }

    setIsUploading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/stories`, {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title_en: draft.title_en.trim(),
          title_kn: draft.title_kn.trim(),
          category: draft.category,
          level: Number(draft.level),
          cover_image: draft.cover_image.trim(),
          pages: englishPages.map((text_en, index) => ({
            page_number: index + 1,
            text_en,
            text_kn: kannadaPages[index],
            image_url: draft.cover_image.trim(),
          })),
        }),
      });
      if (!response.ok) throw new Error("The story could not be uploaded.");
      const story = await response.json();
      setStories((items) => [...items, story]);
      setDraft(emptyDraft);
      setMessage("Story uploaded and added to the library.");
    } catch (error) {
      console.error("Could not upload story.", error);
      setMessage("The story could not be uploaded. Check the fields and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteStory = async (story) => {
    if (!window.confirm(`Delete “${story.title_en}” from the library?`)) return;
    try {
      const response = await fetch(`${API_URL}/stories/${encodeURIComponent(story.id)}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      if (!response.ok) throw new Error("The story could not be deleted.");
      setStories((items) => items.filter((item) => item.id !== story.id));
      setMessage(`“${story.title_en}” was deleted.`);
    } catch (error) {
      console.error("Could not delete story.", error);
      setMessage("The story could not be deleted. Please try again.");
    }
  };

  const trendingStories = [...stories]
    .sort((first, second) => second.trend_score - first.trend_score)
    .slice(0, 5);

  return <main className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">Staff area</p><h1>Library dashboard</h1><p>Reading activity and young-author submissions.</p></div><button className="secondary-action admin-back" onClick={onBack}>← Back to library</button></header>
    <section className="admin-toolbar"><label htmlFor="library-select">Library terminal</label><select id="library-select" value={libraryId} onChange={(event) => setLibraryId(event.target.value)}>{libraries.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><button className="refresh-button" onClick={load} disabled={loading}>↻ Refresh data</button></section>
    {message && <p className="admin-message" role="status">{message}</p>}
    {loading ? <div className="empty-state">Loading staff data…</div> : <>
      <section className="metric-grid" aria-label="Reading statistics">
        <Metric label="Reading sessions" value={summary?.total_sessions ?? 0} />
        <Metric label="Unique readers (devices)" value={summary?.unique_reader_devices ?? 0} />
        <Metric label="Stories finished" value={summary?.completed_stories ?? 0} />
        <Metric label="Completion rate" value={summary?.completion_rate ?? "0%"} />
        <Metric label="Preferred language" value={(summary?.preferred_language ?? "kn").toUpperCase()} />
      </section>
      <p className="reader-count-note">Reader count is based on anonymous browser devices, not verified individual people.</p>

      <section className="review-section story-management">
        <div className="review-heading"><div><p className="eyebrow">Story catalogue</p><h2>Trending stories</h2></div><span>Top {trendingStories.length}</span></div>
        {trendingStories.length ? <ol className="trending-list">{trendingStories.map((story) => <li key={story.id}><span><strong>{story.title_en}</strong><small>{story.category}</small></span><b>{story.trend_score} trend score</b></li>)}</ol> : <div className="empty-state">No stories to show yet.</div>}

        <div className="review-heading catalog-heading"><div><p className="eyebrow">Library content</p><h2>Manage stories</h2></div><span>{stories.length} stories</span></div>
        <div className="admin-story-list">
          {stories.map((story) => <article className="admin-story-row" key={story.id}>
            <img src={story.cover_image} alt="" />
            <div><strong>{story.title_en}</strong><small>{story.category} · Level {story.level} · {story.trend_score} trend score</small></div>
            <button className="secondary-action story-delete" type="button" onClick={() => deleteStory(story)}>Delete</button>
          </article>)}
        </div>

        <div className="review-heading catalog-heading"><div><p className="eyebrow">New content</p><h2>Upload a story</h2></div></div>
        <form className="story-upload-form" onSubmit={uploadStory}>
          <label>English title<input required minLength="2" maxLength="160" value={draft.title_en} onChange={(event) => setDraft({ ...draft, title_en: event.target.value })} /></label>
          <label>Kannada title<input required minLength="2" maxLength="160" value={draft.title_kn} onChange={(event) => setDraft({ ...draft, title_kn: event.target.value })} /></label>
          <label>Category<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label>Reading level<select value={draft.level} onChange={(event) => setDraft({ ...draft, level: event.target.value })}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Level {level}</option>)}</select></label>
          <label className="upload-wide">Cover image URL<input required type="url" value={draft.cover_image} onChange={(event) => setDraft({ ...draft, cover_image: event.target.value })} placeholder="https://example.com/cover.jpg" /></label>
          <label>English pages<textarea required value={draft.pages_en} onChange={(event) => setDraft({ ...draft, pages_en: event.target.value })} placeholder={"One page per line.\nWrite each page as a single line."} rows={6} /></label>
          <label>Kannada pages<textarea required value={draft.pages_kn} onChange={(event) => setDraft({ ...draft, pages_kn: event.target.value })} placeholder={"ಒಂದು ಸಾಲಿಗೆ ಒಂದು ಪುಟ.\nಪ್ರತಿ ಪುಟವನ್ನು ಒಂದೇ ಸಾಲಿನಲ್ಲಿ ಬರೆಯಿರಿ."} rows={6} /></label>
          <button className="primary-action upload-wide" type="submit" disabled={isUploading}>{isUploading ? "Uploading…" : "Upload story"}</button>
        </form>
      </section>

      <section className="review-section submission-review">
        <div className="review-heading"><div><p className="eyebrow">Young authors</p><h2>Stories waiting for review</h2></div><span>{submissions.length} pending</span></div>
        {submissions.length ? <div className="submission-list">{submissions.map((submission) => <article className="submission-card" key={submission.id}><div><span className="submission-meta">{submission.language === "kn" ? "Kannada" : "English"} · {new Date(submission.created_at).toLocaleDateString()}</span><h3>{submission.title}</h3><p className="submission-prompt">Prompt: {submission.prompt || "Free writing"}</p><p>{submission.content}</p></div><div className="review-actions"><button onClick={() => updateSubmission(submission.id, "returned")} className="secondary-action">Return</button><button onClick={() => updateSubmission(submission.id, "published")} className="primary-action">Approve</button></div></article>)}</div> : <div className="empty-state"><strong>All caught up.</strong><span>New child-authored stories will appear here for review.</span></div>}
      </section>
    </>}
  </main>;
}

function Metric({ label, value }) {
  return <article className="metric-card"><p>{label}</p><strong>{value}</strong></article>;
}
