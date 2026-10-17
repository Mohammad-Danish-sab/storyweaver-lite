import { useEffect, useRef, useState } from "react";
import { getCachedStoryById } from "../services/indexedDB";
import { addComment } from "../services/socialStore";

export default function ReaderPage({ storyId, language, social, onToggleSocial, onSocialChange, onBack, onComplete }) {
  const [story, setStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [mode, setMode] = useState("read");
  const [writing, setWriting] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");
  const [commentText, setCommentText] = useState("");
  const startedAt = useRef(null);
  const recognition = useRef(null);

  useEffect(() => {
    startedAt.current = Date.now();
    let active = true;
    async function loadStory() {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/stories/${storyId}`);
        if (!response.ok) throw new Error("Story unavailable");
        const data = await response.json();
        if (active) setStory(data);
      } catch {
        const data = await getCachedStoryById(storyId);
        if (active) setStory(data || null);
      }
    }
    loadStory();
    return () => { active = false; window.speechSynthesis?.cancel(); recognition.current?.stop(); };
  }, [storyId]);

  const page = story?.pages[currentPage];
  const isFirstPage = currentPage === 0;
  const isLastPage = story && currentPage === story.pages.length - 1;
  const text = language === "kn" ? page?.text_kn : page?.text_en;

  const speak = () => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "kn" ? "kn-IN" : "en-IN";
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  };

  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechMessage("Voice writing works in Chrome or another browser that supports speech recognition.");
      return;
    }
    recognition.current?.stop();
    const instance = new SpeechRecognition();
    instance.lang = language === "kn" ? "kn-IN" : "en-IN";
    instance.continuous = false;
    instance.interimResults = true;
    instance.onstart = () => { setIsRecording(true); setSpeechMessage("Listening… speak your answer now."); };
    instance.onresult = (event) => {
      const words = Array.from(event.results).map((result) => result[0].transcript).join(" ");
      setWriting((current) => `${current}${current ? " " : ""}${words}`.trim());
    };
    instance.onerror = () => setSpeechMessage("I could not hear that. Please try again.");
    instance.onend = () => { setIsRecording(false); setSpeechMessage("Your spoken words were added to the page."); };
    recognition.current = instance;
    instance.start();
  };

  const nextPage = () => {
    window.speechSynthesis?.cancel();
    setIsReading(false);
    if (isLastPage) { onComplete(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))); onBack(); return; }
    setCurrentPage((value) => value + 1);
  };

  const submitComment = (event) => {
    event.preventDefault();
    const textToSave = commentText.trim();
    if (!textToSave) return;
    onSocialChange((current) => addComment(current, storyId, textToSave));
    setCommentText("");
  };

  if (!story || !page) return <main className="reader-loading"><span className="spinner" />Opening your story…</main>;

  return <main className="reader-shell">
    <header className="reader-header"><button className="back-button" onClick={onBack}>← <span>Library</span></button><div className="reader-title"><span>{story.title_en}</span><small>Page {currentPage + 1} of {story.pages.length}</small></div><button className="reader-language" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Aa</button></header>
    <div className="reading-progress" aria-label={`Page ${currentPage + 1} of ${story.pages.length}`}><i style={{ width: `${((currentPage + 1) / story.pages.length) * 100}%` }} /></div>
    <section className="reader-card">
      <div className="reader-image-wrap"><img src={page.image_url} alt="Story illustration" className="reader-image" /><span className="page-chip">{String(currentPage + 1).padStart(2, "0")}</span></div>
      <div className="reader-copy"><p className="eyebrow">{story.category} · Level {story.level}</p><div className="mode-picker" role="tablist" aria-label="Story activity"><button role="tab" aria-selected={mode === "read"} className={mode === "read" ? "active" : ""} onClick={() => setMode("read")}>Read</button><button role="tab" aria-selected={mode === "listen"} className={mode === "listen" ? "active" : ""} onClick={() => setMode("listen")}>Listen</button><button role="tab" aria-selected={mode === "write"} className={mode === "write" ? "active" : ""} onClick={() => setMode("write")}>Write</button></div>{mode === "read" ? <><h1>{text}</h1><p className="activity-note">Read at your own pace. Use Next page when you are ready.</p></> : null}{mode === "listen" ? <div className="activity-panel"><h2>Hear this page</h2><p>{text}</p><button className={isReading ? "listen-button active" : "listen-button"} onClick={speak}>{isReading ? "■ Stop listening" : "▶ Listen to this page"}</button><p className="listen-note">Read aloud uses your device voice.</p></div> : null}{mode === "write" ? <div className="activity-panel writing-panel"><h2>Write or say your thought</h2><p>What did you notice, feel, or learn from this page?</p><textarea value={writing} maxLength="800" onChange={(event) => setWriting(event.target.value)} placeholder="Start writing here, or use the microphone…" aria-label="Your response to this story page" /><div className="dictation-row"><button className={isRecording ? "dictation-button recording" : "dictation-button"} onClick={isRecording ? () => recognition.current?.stop() : startDictation}>{isRecording ? "■ Stop microphone" : "● Speak to write"}</button><span>{speechMessage || "Your words stay on this device."}</span></div></div> : null}<div className="story-social"><button className={social.likedIds.includes(storyId) ? "social-button liked" : "social-button"} onClick={() => onToggleSocial("likedIds", storyId)}>♥ {social.likedIds.includes(storyId) ? "Liked" : "Like"}</button><button className={social.savedIds.includes(storyId) ? "social-button saved" : "social-button"} onClick={() => onToggleSocial("savedIds", storyId)}>☆ {social.savedIds.includes(storyId) ? "Saved" : "Save for later"}</button></div></div>
    </section>
    <nav className="reader-nav" aria-label="Page navigation"><button className="previous-button" onClick={() => { window.speechSynthesis?.cancel(); setCurrentPage((value) => value - 1); }} disabled={isFirstPage}>← Previous</button><span>{currentPage + 1} / {story.pages.length}</span><button className="next-button" onClick={nextPage}>{isLastPage ? "Finish story ✦" : "Next page →"}</button></nav>
    <section className="comments-section" aria-labelledby="comments-title"><div><p className="eyebrow">Reader circle</p><h2 id="comments-title">What did you think?</h2></div><form onSubmit={submitComment}><label htmlFor="story-comment">Leave a kind comment</label><div><input id="story-comment" value={commentText} maxLength="280" onChange={(event) => setCommentText(event.target.value)} placeholder="Share your favourite part…" /><button type="submit">Post</button></div></form><div className="comment-list">{(social.comments[storyId] || []).length ? social.comments[storyId].slice().reverse().map((comment) => <article key={comment.id} className="comment"><span>Reader</span><p>{comment.text}</p></article>) : <p className="no-comments">Be the first reader to share a thought.</p>}</div></section>
  </main>;
}
