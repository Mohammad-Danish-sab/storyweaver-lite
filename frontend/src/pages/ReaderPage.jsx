import { useEffect, useRef, useState } from "react";
import { getCachedStoryById } from "../services/indexedDB";

export default function ReaderPage({ storyId, language, onBack, onComplete }) {
  const [story, setStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const startedAt = useRef(null);

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
    return () => { active = false; window.speechSynthesis?.cancel(); };
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

  const nextPage = () => {
    window.speechSynthesis?.cancel();
    setIsReading(false);
    if (isLastPage) { onComplete(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))); onBack(); return; }
    setCurrentPage((value) => value + 1);
  };

  if (!story || !page) return <main className="reader-loading"><span className="spinner" />Opening your story…</main>;

  return <main className="reader-shell">
    <header className="reader-header"><button className="back-button" onClick={onBack}>← <span>Library</span></button><div className="reader-title"><span>{story.title_en}</span><small>Page {currentPage + 1} of {story.pages.length}</small></div><button className="reader-language" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Aa</button></header>
    <div className="reading-progress" aria-label={`Page ${currentPage + 1} of ${story.pages.length}`}><i style={{ width: `${((currentPage + 1) / story.pages.length) * 100}%` }} /></div>
    <section className="reader-card">
      <div className="reader-image-wrap"><img src={page.image_url} alt="Story illustration" className="reader-image" /><span className="page-chip">{String(currentPage + 1).padStart(2, "0")}</span></div>
      <div className="reader-copy"><p className="eyebrow">{story.category} · Level {story.level}</p><h1>{text}</h1><button className={isReading ? "listen-button active" : "listen-button"} onClick={speak}>{isReading ? "■ Stop listening" : "▶ Listen to this page"}</button><p className="listen-note">Read aloud mode uses your device voice.</p></div>
    </section>
    <nav className="reader-nav" aria-label="Page navigation"><button className="previous-button" onClick={() => { window.speechSynthesis?.cancel(); setCurrentPage((value) => value - 1); }} disabled={isFirstPage}>← Previous</button><span>{currentPage + 1} / {story.pages.length}</span><button className="next-button" onClick={nextPage}>{isLastPage ? "Finish story ✦" : "Next page →"}</button></nav>
  </main>;
}
