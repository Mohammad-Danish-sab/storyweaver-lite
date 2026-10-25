import { useEffect, useMemo, useState } from "react";
import StoryCard from "./components/discovery/StoryCard";
import ReaderPage from "./pages/ReaderPage";
import KioskLock from "./components/common/KioskLock";
import RdprDashboard from "./components/admin/RdprDashboard";
import StoryStudio from "./components/writing/StoryStudio";
import ChildProfiles from "./pages/ChildProfiles";
import AccountPage from "./pages/AccountPage";
import { cacheStories, getCachedStories } from "./services/indexedDB";
import { flushTelemetryQueue, queueTelemetry } from "./services/telemetrySync";
import { getSocialState, toggleStoryList } from "./services/socialStore";
import { API_BASE_URL } from "./services/api";
import { deleteChildStory, getChildStories, saveChildStory } from "./services/childStoryStore";
import {
  createChildProfile as createChildProfileRequest,
  getChildProfiles,
  getCurrentAccount,
  logoutAccount,
  toggleChildLike as toggleChildLikeRequest,
} from "./services/accountApi";

const categories = [["all", "All stories"], ["trending", "Trending"], ["latest", "Latest"], ["saved", "Saved"], ["animals", "Animals"], ["folktales", "Folktales"], ["nature", "Nature"], ["science", "Science"], ["friendship", "Friendship"], ["community", "Community"]];

const isAdminPath = () => window.location.pathname.replace(/\/+$/, "") === "/admin";

export default function App() {
  const [stories, setStories] = useState([]);
  const [language, setLanguage] = useState("en");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [isLibrarianOpen, setIsLibrarianOpen] = useState(isAdminPath);
  const [view, setView] = useState(() => isAdminPath() ? "admin-gate" : window.location.search.includes("reset_token=") ? "auth" : "library");
  const [adminPin, setAdminPin] = useState("");
  const [status, setStatus] = useState("loading");
  const [social, setSocial] = useState(getSocialState);
  const [account, setAccount] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authIntent, setAuthIntent] = useState("library");
  const [authError, setAuthError] = useState("");
  const [actionError, setActionError] = useState("");
  const [childProfiles, setChildProfiles] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const resetToken = new URLSearchParams(window.location.search).get("reset_token") || "";
  const loadFamilyProfiles = async () => (await getChildProfiles()).map((profile) => ({
    ...profile,
    authoredStories: getChildStories(profile.id),
  }));

  const loadStories = async () => {
    setStatus("loading");
    try {
      const response = await fetch(`${API_BASE_URL}/stories`);
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

  useEffect(() => {
    loadStories();
    flushTelemetryQueue();
    let active = true;
    const restoreAccount = async () => {
      try {
        const restoredAccount = await getCurrentAccount();
        const profiles = await loadFamilyProfiles();
        if (!active) return;
        setAccount(restoredAccount);
        setChildProfiles(profiles);
      } catch (error) {
        if (!active) return;
        if (error.status !== 401) setAuthError(error.message);
      } finally {
        if (active) setAuthLoading(false);
      }
    };
    restoreAccount();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setAdminPin("");
      if (isAdminPath()) {
        setIsLibrarianOpen(true);
        setView("admin-gate");
      } else {
        setIsLibrarianOpen(false);
        setView("library");
        setActiveChildId(null);
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
  const openAdminDashboard = (pin) => {
    if (!isAdminPath()) window.history.pushState({}, "", "/admin");
    setAdminPin(pin);
    setIsLibrarianOpen(false);
    setView("admin");
  };

  const returnToLibrary = () => {
    if (isAdminPath()) window.history.replaceState({}, "", "/");
    setAdminPin("");
    setIsLibrarianOpen(false);
    setActiveChildId(null);
    setView("library");
  };

  const openKids = () => {
    if (authLoading) return;
    setActionError("");
    if (!account) {
      setAuthIntent("kids");
      setView("auth");
      return;
    }
    setActiveChildId(null);
    setView("kids");
  };

  const openChildRegistration = () => {
    setView("kid-register");
  };

  const selectChildProfile = (profile) => {
    setActiveChildId(profile.id);
    setView("kid-home");
  };

  const registerChildProfile = async (profileData) => {
    const remoteProfile = await createChildProfileRequest({
      user_id: profileData.userId,
      name: profileData.name,
      age_band: profileData.ageBand,
      avatar: profileData.avatar,
    });
    const profile = { ...remoteProfile, authoredStories: getChildStories(remoteProfile.id) };
    setChildProfiles((current) => [...current, profile]);
    selectChildProfile(profile);
  };

  const handleAuthenticated = async (authenticatedAccount) => {
    const profiles = await loadFamilyProfiles();
    setAccount(authenticatedAccount);
    setChildProfiles(profiles);
    setAuthError("");
    setView(authIntent === "kids" ? "kids" : "library");
  };

  const openAccount = () => {
    setAuthIntent("library");
    setView("auth");
  };

  const signOut = async () => {
    try {
      await logoutAccount();
      setAccount(null);
      setChildProfiles([]);
      setActiveChildId(null);
      setView("library");
      setAuthError("");
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const toggleChildLike = async (profileId, storyId) => {
    setActionError("");
    try {
      const result = await toggleChildLikeRequest(profileId, storyId);
      setChildProfiles((current) => current.map((profile) => {
        if (profile.id !== profileId) return profile;
        const likedStoryIds = result.liked
          ? [...profile.likedStoryIds, storyId]
          : profile.likedStoryIds.filter((id) => id !== storyId);
        return { ...profile, likedStoryIds };
      }));
    } catch (error) {
      setActionError(error.message);
    }
  };

  const saveChildProfileStory = async (profileId, story) => {
    const savedStory = saveChildStory(profileId, story);
    setChildProfiles((current) => current.map((profile) => profile.id === profileId
      ? { ...profile, authoredStories: [savedStory, ...profile.authoredStories] }
      : profile));
  };

  const deleteChildProfileStory = async (profileId, storyId) => {
    deleteChildStory(profileId, storyId);
    setChildProfiles((current) => current.map((profile) => profile.id === profileId
      ? { ...profile, authoredStories: profile.authoredStories.filter((story) => story.id !== storyId) }
      : profile));
  };

  const handleSelectStory = (id) => {
    setActiveStoryId(id);
    queueTelemetry({ story_id: id, library_id: "GP_LIB_KARNATAKA_01", language, completed: false, time_spent_seconds: 0 });
  };

  const activeChild = childProfiles.find((profile) => profile.id === activeChildId) || null;
  const readerSocial = activeChild ? { ...social, likedIds: activeChild.likedStoryIds } : social;
  const toggleActiveSocial = (key, storyId) => {
    if (key === "likedIds" && activeChild) {
      toggleChildLike(activeChild.id, storyId);
      return;
    }
    toggleSocial(key, storyId);
  };

  if (view === "auth") {
    return <AccountPage
      resetToken={resetToken}
      initialError={authError}
      onBack={() => {
        if (resetToken) window.history.replaceState({}, "", window.location.pathname);
        setView("library");
      }}
      onAuthenticated={handleAuthenticated}
      onPasswordReset={() => window.history.replaceState({}, "", window.location.pathname)}
    />;
  }
  if (activeStoryId) return <ReaderPage storyId={activeStoryId} language={language} social={readerSocial} onToggleSocial={toggleActiveSocial} onSocialChange={setSocial} onBack={() => setActiveStoryId(null)} onComplete={(timeSpent) => queueTelemetry({ story_id: activeStoryId, library_id: "GP_LIB_KARNATAKA_01", language, completed: true, time_spent_seconds: timeSpent })} />;
  if (view === "studio") return <StoryStudio language={language} onBack={() => setView("library")} />;
  if (view === "admin") return <RdprDashboard adminPin={adminPin} onBack={returnToLibrary} />;
  if (view === "kids" || view === "kid-register" || view === "kid-home") {
    return <ChildProfiles
      key={activeChild?.id || view}
      view={view}
      profiles={childProfiles}
      activeProfile={activeChild}
      stories={stories}
      status={status}
      language={language}
      social={social}
      onBack={returnToLibrary}
      onRegister={registerChildProfile}
      onSelectProfile={selectChildProfile}
      onOpenRegistration={openChildRegistration}
      onSwitchProfiles={openKids}
      onSelectStory={handleSelectStory}
      onToggleSocial={(key, storyId) => {
        if (key === "likedIds" && activeChild) toggleChildLike(activeChild.id, storyId);
        else toggleSocial(key, storyId);
      }}
      onSaveStory={saveChildProfileStory}
      onDeleteStory={deleteChildProfileStory}
      actionError={actionError}
    />;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => setIsLibrarianOpen(true)} aria-label="Open librarian controls"><span className="brand-mark" aria-hidden="true">S</span><span><strong>StoryWeaver</strong><small>Rural library, open stories</small></span></button>
        <div className="header-actions">
          <span className={`connection connection--${status}`}><i />{status === "online" ? "Library synced" : status === "offline" ? "Offline library" : "Loading library"}</span>
          <button className="kids-entry-button" onClick={openKids} disabled={authLoading}>👧 Child profiles</button>
          {authLoading ? <span className="account-loading">Checking account…</span> : account
            ? <><span className="account-email-nav" title={account.email}>{account.email}</span><button className="account-nav-button" onClick={signOut}>Sign out</button></>
            : <button className="account-nav-button" onClick={openAccount}>Sign in</button>}
          <button className="language-toggle" onClick={() => setLanguage((value) => value === "en" ? "kn" : "en")}><span aria-hidden="true">◎</span> {language === "en" ? "ಕನ್ನಡ" : "English"}</button>
        </div>
      </header>
      {authError ? <div className="account-global-error" role="alert">{authError} <button onClick={openAccount}>Sign in again</button></div> : null}
      <main className="library-home">
        <section className="hero">
          <div className="hero-copy"><p className="eyebrow">A little story time, every day</p><h1>{language === "en" ? "A whole library, ready to wander." : "ಕಥೆಗಳ ಲೋಕವನ್ನು ಅನ್ವೇಷಿಸಿ."}</h1><p>Pick a story, turn the pages, and enjoy reading together — online or offline.</p><div className="hero-stats"><span><b>{stories.length}</b> stories</span><span><b>2</b> languages</span><span><b>∞</b> imagination</span></div><button className="write-story-button" onClick={() => setView("studio")}>✦ Write your own story</button><button className="kids-hero-link" onClick={openKids} disabled={authLoading}>Create a reading space for a child →</button></div>
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
