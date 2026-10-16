import { useEffect, useMemo, useState } from "react";
import StoryCard from "./components/discovery/StoryCard";
import ReaderPage from "./pages/ReaderPage";
import KioskLock from "./components/common/KioskLock";
import { cacheStories, getCachedStories } from "./services/indexedDB";
import { flushTelemetryQueue, queueTelemetry } from "./services/telemetrySync";

const categories = [["all", "All stories"], ["animals", "Animals"], ["folktales", "Folktales"]];

export default function App() {
  const [stories, setStories] = useState([]);
  const [language, setLanguage] = useState("en");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [isLibrarianOpen, setIsLibrarianOpen] = useState(false);
  const [status, setStatus] = useState("loading");

  const loadStories = async () => {
    setStatus("loading");
    try {
      const response = await fetch("http://localhost:8000/api/v1/stories");
      if (!response.ok) throw new Error("Stories could not be loaded");
      const data = await response.json();
      setStories(data);
      await cacheStories(data);
      setStatus("online");
      return data;
    } catch (error) {
      console.warn("Loading saved stories instead.", error);
      const cached = await getCachedStories();
      setStories(cached || []);
      setStatus(cached?.length ? "offline" : "error");
      return cached || [];
    }
  };

  useEffect(() => { loadStories(); flushTelemetryQueue(); }, []);

  const filteredStories = useMemo(() => stories.filter((story) => selectedCategory === "all" || story.category === selectedCategory), [stories, selectedCategory]);

  const handleSelectStory = (id) => {
    setActiveStoryId(id);
    queueTelemetry({ story_id: id, library_id: "GP_LIB_KARNATAKA_01", language, completed: false, time_spent_seconds: 0 });
  };

  if (activeStoryId) return <ReaderPage storyId={activeStoryId} language={language} onBack={() => setActiveStoryId(null)} onComplete={(timeSpent) => queueTelemetry({ story_id: activeStoryId, library_id: "GP_LIB_KARNATAKA_01", language, completed: true, time_spent_seconds: timeSpent })} />;

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => setIsLibrarianOpen(true)} aria-label="Open librarian controls"><span className="brand-mark" aria-hidden="true">S</span><span><strong>StoryWeaver</strong><small>Rural library, open stories</small></span></button>
        <div className="header-actions">
          <span className={`connection connection--${status}`}><i />{status === "online" ? "Library synced" : status === "offline" ? "Offline library" : "Loading library"}</span>
          <button className="language-toggle" onClick={() => setLanguage((value) => value === "en" ? "kn" : "en")}><span aria-hidden="true">◎</span> {language === "en" ? "ಕನ್ನಡ" : "English"}</button>
        </div>
      </header>
      <main className="library-home">
        <section className="hero">
          <div className="hero-copy"><p className="eyebrow">A little story time, every day</p><h1>{language === "en" ? "A whole library, ready to wander." : "ಕಥೆಗಳ ಲೋಕವನ್ನು ಅನ್ವೇಷಿಸಿ."}</h1><p>Pick a story, turn the pages, and enjoy reading together — online or offline.</p><div className="hero-stats"><span><b>{stories.length}</b> stories</span><span><b>2</b> languages</span><span><b>∞</b> imagination</span></div></div>
          <div className="hero-art" aria-hidden="true"><span className="sun">☀</span><span className="cloud cloud-one">☁</span><span className="cloud cloud-two">☁</span><div className="hill hill-back" /><div className="hill hill-front" /><div className="hero-book">✦<br /><small>READ</small></div></div>
        </section>
        <section className="browse-section" aria-labelledby="browse-title">
          <div className="section-heading"><div><p className="eyebrow">Explore</p><h2 id="browse-title">Choose your next adventure</h2></div><button className="refresh-button" onClick={loadStories} disabled={status === "loading"}>↻ Refresh library</button></div>
          <div className="category-list" role="tablist" aria-label="Story categories">{categories.map(([category, label]) => <button key={category} role="tab" aria-selected={selectedCategory === category} className={selectedCategory === category ? "category active" : "category"} onClick={() => setSelectedCategory(category)}>{category === "all" ? "✦" : category === "animals" ? "♧" : "◈"} {label}</button>)}</div>
          {status === "loading" && stories.length === 0 ? <div className="empty-state"><span className="spinner" />Finding stories for you…</div> : null}
          {status === "error" ? <div className="empty-state"><strong>Your library is not available yet.</strong><span>Connect to the library server, then try again.</span><button onClick={loadStories}>Try again</button></div> : null}
          {filteredStories.length > 0 ? <div className="story-grid">{filteredStories.map((story) => <StoryCard key={story.id} story={story} language={language} onSelect={handleSelectStory} />)}</div> : null}
        </section>
      </main>
      <footer className="site-footer"><span>Made for shared reading</span><span>•</span><span>RDPR Karnataka Rural Libraries</span></footer>
      <KioskLock isOpen={isLibrarianOpen} onClose={() => setIsLibrarianOpen(false)} onManualSync={loadStories} />
    </div>
  );
}
