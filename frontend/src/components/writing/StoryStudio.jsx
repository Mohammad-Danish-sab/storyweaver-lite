import { useEffect, useMemo, useState } from "react";

const prompts = [
  "A tiny seed discovers a secret garden.",
  "Two friends build something helpful for their village.",
  "A kite carries an important message across the sky.",
  "Write about an animal who learns a brave new skill.",
];

const draftKey = "storyweaver-story-studio-draft";

function getDraft() {
  try { return JSON.parse(localStorage.getItem(draftKey)) || {}; }
  catch { return {}; }
}

export default function StoryStudio({ language, onBack }) {
  const [title, setTitle] = useState(() => getDraft().title || "");
  const [content, setContent] = useState(() => getDraft().content || "");
  const [prompt, setPrompt] = useState(() => getDraft().prompt || prompts[0]);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ title, content, prompt }));
  }, [title, content, prompt]);

  const submit = async (event) => {
    event.preventDefault();
    if (title.trim().length < 2 || content.trim().length < 20) {
      setStatus("Add a title and at least a few sentences before sharing.");
      return;
    }
    setIsSaving(true); setStatus("");
    try {
      const response = await fetch("http://localhost:8000/api/v1/submissions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), language, prompt }),
      });
      if (!response.ok) throw new Error("Could not share story");
      localStorage.removeItem(draftKey);
      setTitle(""); setContent("");
      setStatus("Your story was shared for a librarian to review. Great work!");
    } catch {
      setStatus("Your draft is safely saved on this device. Connect to the library to share it.");
    } finally { setIsSaving(false); }
  };

  return <main className="studio-shell">
    <header className="studio-header"><button className="back-button" onClick={onBack}>← <span>Library</span></button><div><p className="eyebrow">Young authors</p><h1>Story studio</h1></div><span className="studio-language">{language === "kn" ? "ಕನ್ನಡ" : "English"}</span></header>
    <section className="studio-card">
      <div className="studio-intro"><span aria-hidden="true">✦</span><h2>Your ideas belong in stories.</h2><p>Write in your own words. Do not include your full name, address, school, or phone number.</p></div>
      <form onSubmit={submit} className="studio-form">
        <label htmlFor="story-prompt">A starting idea</label><select id="story-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)}>{prompts.map((item) => <option key={item}>{item}</option>)}</select>
        <label htmlFor="story-title">Story title</label><input id="story-title" value={title} maxLength="100" onChange={(event) => setTitle(event.target.value)} placeholder="Give your story a wonderful title" required />
        <div className="field-row"><label htmlFor="story-content">Your story</label><span>{wordCount} words</span></div><textarea id="story-content" value={content} maxLength="5000" onChange={(event) => setContent(event.target.value)} placeholder="Once upon a time…" required />
        <div className="studio-actions"><button className="secondary-action" type="button" onClick={() => { setTitle(""); setContent(""); setStatus("A fresh page is ready. Your old draft was cleared."); }}>Start over</button><button className="primary-action" disabled={isSaving} type="submit">{isSaving ? "Sharing…" : "Share with librarian"}</button></div>
        {status && <p className="studio-status" role="status">{status}</p>}
      </form>
    </section>
  </main>;
}
