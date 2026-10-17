import { useEffect, useMemo, useState } from "react";
import StoryCard from "./components/discovery/StoryCard";
import ReaderPage from "./pages/ReaderPage";
import KioskLock from "./components/common/KioskLock";
import RdprDashboard from "./components/admin/RdprDashboard";
import StoryStudio from "./components/writing/StoryStudio";
import { cacheStories, getCachedStories } from "./services/indexedDB";
import { flushTelemetryQueue, queueTelemetry } from "./services/telemetrySync";
import { getSocialState, toggleStoryList } from "./services/socialStore";

const categories = [["all", "All stories"], ["trending", "Trending"], ["latest", "Latest"], ["saved", "Saved"], ["animals", "Animals"], ["folktales", "Folktales"], ["nature", "Nature"], ["science", "Science"], ["friendship", "Friendship"], ["community", "Community"]];

const isAdminPath = () => window.location.pathname.replace(/\/+$/, "") === "/admin";

export default function App() {
  const [stories, setStories] = useState([]);
  const [language, setLanguage] = useState("en");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [isLibrarianOpen, setIsLibrarianOpen] = useState(isAdminPath);
  const [view, setView] = useState(() => isAdminPath() ? "admin-gate" : "library");
  const [status, setStatus] = useState("loading");
  const [social, setSocial] = useState(getSocialState);

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

  useEffect(() => {
    const handlePopState = () => {
      if (isAdminPath()) {
        setIsLibrarianOpen(true);
        setView("admin-gate");
      } else {
        setIsLibrarianOpen(false);
        setView("library");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const filteredStories = useMemo(() => {
    const result = selectedCategory === "all" || selectedCategory === "trending" || selectedCategory === "latest"
      ? [...stories] : stories.filter((story) => story.category === selectedCategory);
    if (selectedCategory === "saved") return stories.filter((story) => social.savedIds.includes(story.id));
    if (selectedCategory === "trending") return result.sort((a, b) => b.trend_score - a.trend_score);
    if (selectedCategory === "latest") return result.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    return result;
  }, [stories, selectedCategory, social.savedIds]);

  const toggleSocial = (key, storyId) => setSocial((current) => toggleStoryList(current, key, storyId));

  const openAdminDashboard = () => {
    if (!isAdminPath()) window.history.pushState({}, "", "/admin");
    setIsLibrarianOpen(false);
    setView("admin");
  };

  const returnToLibrary = () => {
    if (isAdminPath()) window.history.replaceState({}, "", "/");
    setIsLibrarianOpen(false);
    setView("library");
  };

  const handleSelectStory = (id) => {
    setActiveStoryId(id);
    queueTelemetry({ story_id: id, library_id: "GP_LIB_KARNATAKA_01", language, completed: false, time_spent_seconds: 0 });
  };

  if (activeStoryId) return <ReaderPage storyId={activeStoryId} language={language} social={social} onToggleSocial={toggleSocial} onSocialChange={setSocial} onBack={() => setActiveStoryId(null)} onComplete={(timeSpent) => queueTelemetry({ story_id: activeStoryId, library_id: "GP_LIB_KARNATAKA_01", language, completed: true, time_spent_seconds: timeSpent })} />;
  if (view === "studio") return <StoryStudio language={language} onBack={() => setView("library")} />;
  if (view === "admin") return <RdprDashboard onBack={returnToLibrary} />;

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
          <div className="hero-copy"><p className="eyebrow">A little story time, every day</p><h1>{language === "en" ? "A whole library, ready to wander." : "ಕಥೆಗಳ ಲೋಕವನ್ನು ಅನ್ವೇಷಿಸಿ."}</h1><p>Pick a story, turn the pages, and enjoy reading together — online or offline.</p><div className="hero-stats"><span><b>{stories.length}</b> stories</span><span><b>2</b> languages</span><span><b>∞</b> imagination</span></div><button className="write-story-button" onClick={() => setView("studio")}>✦ Write your own story</button></div>
          <div className="hero-art" aria-hidden="true"><span className="sun">☀</span><span className="cloud cloud-one">☁</span><span className="cloud cloud-two">☁</span><div className="hill hill-back" /><div className="hill hill-front" /><div className="hero-book">✦<br /><small>READ</small></div></div>
        </section>
        <section className="browse-section" aria-labelledby="browse-title">
          <div className="section-heading"><div><p className="eyebrow">Explore</p><h2 id="browse-title">Choose your next adventure</h2></div><button className="refresh-button" onClick={loadStories} disabled={status === "loading"}>↻ Refresh library</button></div>
          <div className="category-list" role="tablist" aria-label="Story categories">{categories.map(([category, label]) => <button key={category} role="tab" aria-selected={selectedCategory === category} className={selectedCategory === category ? "category active" : "category"} onClick={() => setSelectedCategory(category)}>{category === "trending" ? "↗" : category === "latest" ? "✦" : category === "saved" ? "★" : category === "animals" ? "♧" : "◈"} {label}</button>)}</div>
          {status === "loading" && stories.length === 0 ? <div className="empty-state"><span className="spinner" />Finding stories for you…</div> : null}
          {status === "error" ? <div className="empty-state"><strong>Your library is not available yet.</strong><span>Connect to the library server, then try again.</span><button onClick={loadStories}>Try again</button></div> : null}
          {filteredStories.length > 0 ? <div className="story-grid">{filteredStories.map((story) => <StoryCard key={story.id} story={story} language={language} onSelect={handleSelectStory} isSaved={social.savedIds.includes(story.id)} isLiked={social.likedIds.includes(story.id)} onToggleSave={() => toggleSocial("savedIds", story.id)} onToggleLike={() => toggleSocial("likedIds", story.id)} />)}</div> : null}
          {status !== "loading" && status !== "error" && filteredStories.length === 0 ? <div className="empty-state"><strong>No saved stories yet.</strong><span>Tap the star on a story to keep it for later.</span></div> : null}
        </section>
      </main>
      <footer className="site-footer"><span>Made for shared reading</span><span>•</span><span>RDPR Karnataka Rural Libraries</span></footer>
      <KioskLock isOpen={isLibrarianOpen} onClose={() => {
        setIsLibrarianOpen(false);
        if (view === "admin-gate") returnToLibrary();
      }} onManualSync={loadStories} onOpenDashboard={openAdminDashboard} />
    </div>
  );
}
