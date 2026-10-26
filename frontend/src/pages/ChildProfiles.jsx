import { useState } from "react";
import StoryCard from "../components/discovery/StoryCard";
import AccessibilityControls from "../components/common/AccessibilityControls";
import "./ChildProfiles.css";

const avatars = ["🦊", "🐼", "🐸", "🦋", "🐯", "🐢", "🐰", "🐳"];

export default function ChildProfiles({
  view,
  profiles,
  activeProfile,
  stories,
  status,
  language,
  onBack,
  onRegister,
  onSelectProfile,
  onOpenRegistration,
  onSwitchProfiles,
  onSelectStory,
  onToggleSocial,
  onSaveStory,
  onDeleteStory,
  actionError,
  onChangeReadingLevel,
  onToggleSavedStory,
}) {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [ageBand, setAgeBand] = useState("6-8");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [formError, setFormError] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [storyError, setStoryError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleStories = stories.filter((story) => (
    story.level <= (activeProfile?.maxReadingLevel ?? 5)
    && [story.title_en, story.title_kn, story.category, "English", "Kannada", `level ${story.level}`]
      .some((value) => String(value).toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()))
  ));

  const submitProfile = async (event) => {
    event.preventDefault();
    const nickname = name.trim();
    if (nickname.length < 2 || nickname.length > 24) {
      setFormError("Choose a nickname between 2 and 24 characters.");
      return;
    }
    try {
      await onRegister({ name: nickname, userId, ageBand, avatar });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The profile could not be saved to your family account.");
    }
  };

  const submitChildStory = async (event) => {
    event.preventDefault();
    const title = storyTitle.trim();
    const content = storyContent.trim();
    if (title.length < 2 || content.length < 20) {
      setStoryError("Add a title and at least 20 characters to save your story.");
      return;
    }
    try {
      await onSaveStory(activeProfile.id, { title, content });
      setStoryTitle("");
      setStoryContent("");
      setStoryError("");
    } catch (error) {
      setStoryError(error instanceof Error ? error.message : "Your story could not be saved on this device.");
    }
  };

  const removeChildStory = async (storyId) => {
    try {
      await onDeleteStory(activeProfile.id, storyId);
      setStoryError("");
    } catch (error) {
      setStoryError(error instanceof Error ? error.message : "Your story could not be deleted.");
    }
  };

  if (view === "kid-register") {
    return (
      <main className="kids-shell">
        <header className="kids-header">
          <button className="kids-back" onClick={onBack}>← Library</button>
          <span className="kids-brand">StoryWeaver <span>· Kids</span></span><AccessibilityControls />
        </header>
        <section className="kid-form-card">
          <div className="kid-form-intro"><span className="kid-form-illustration" aria-hidden="true">🌱</span><p className="eyebrow">A space of your own</p><h1>Create a reader profile</h1><p>Pick a nickname and an avatar to make your own reading space.</p></div>
          <form onSubmit={submitProfile}>
            <label className="kid-field-label" htmlFor="kid-nickname">Your nickname</label>
            <input id="kid-nickname" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={24} autoComplete="nickname" placeholder="e.g. Sunny" required />
            <label className="kid-field-label" htmlFor="kid-user-id">Choose your user ID</label>
            <input id="kid-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} minLength={3} maxLength={20} autoCapitalize="none" autoCorrect="off" aria-describedby="kid-user-id-hint" placeholder="e.g. sunny_reader7" required />
            <span id="kid-user-id-hint" className="kid-id-hint">3–20 letters, numbers, hyphens, or underscores. IDs must be unique across StoryWeaver.</span>
            <fieldset className="avatar-picker"><legend>Choose an avatar</legend><div>{avatars.map((option) => <button key={option} type="button" className={avatar === option ? "avatar-choice selected" : "avatar-choice"} aria-label={`Choose ${option}`} aria-pressed={avatar === option} onClick={() => setAvatar(option)}>{option}</button>)}</div></fieldset>
            <label className="kid-field-label" htmlFor="kid-age">Age group</label>
            <select id="kid-age" value={ageBand} onChange={(event) => setAgeBand(event.target.value)}><option value="under-6">Under 6</option><option value="6-8">6–8 years</option><option value="9-12">9–12 years</option></select>
            <p className="kid-privacy-note">Use a nickname, not a full name. Your profile is stored in your family account and is not visible to the librarian.</p>
            {formError ? <p className="kid-form-error" role="alert">{formError}</p> : null}
            <button className="kid-primary-button" type="submit">Create my reading space <span aria-hidden="true">→</span></button>
          </form>
          <button className="kid-text-button" onClick={onSwitchProfiles}>Back to profiles</button>
        </section>
      </main>
    );
  }

  if (view === "kid-home" && activeProfile) {
    return (
      <main className="kids-shell">
        <header className="kids-header">
          <button className="kids-back" onClick={onBack}>← Library</button>
          <span className="kids-brand">StoryWeaver <span>· Kids</span></span>
          <button className="kids-switch-button" onClick={onSwitchProfiles}>Switch reader</button>
        </header>
        <section className="kid-welcome">
          <div className="kid-welcome-avatar" aria-hidden="true">{activeProfile.avatar}</div>
          <div><p className="eyebrow">Your reading space</p><h1>Hi, {activeProfile.name}!</h1><p>What story shall we explore today?</p><span className="kid-user-id">User ID: <strong>{activeProfile.userId}</strong></span></div>
          <button className="kid-add-button" onClick={onOpenRegistration}>＋ Add a reader</button>
        </section>
        <section className="kid-library">
          <div className="kid-library-heading"><div><p className="eyebrow">The story shelf</p><h2>Choose an adventure</h2></div><span>{visibleStories.length} stories</span></div>
          <label className="kid-search">Find a story<input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search title, topic, or level" /></label>
          {actionError ? <p className="kid-form-error" role="alert">{actionError}</p> : null}
          {status === "loading" && stories.length === 0 ? <div className="kid-empty">Finding stories for you…</div> : null}
          {status === "error" && stories.length === 0 ? <div className="kid-empty">The library is not available right now. Please try again later.</div> : null}
          {visibleStories.length > 0 ? <div className="story-grid">{visibleStories.map((story) => {
            const progress = activeProfile.readingProgress.find((item) => item.storyId === story.id);
            return <div key={story.id}><StoryCard story={story} language={language} onSelect={onSelectStory} isSaved={activeProfile.savedStoryIds.includes(story.id)} isLiked={activeProfile.likedStoryIds.includes(story.id)} onToggleSave={() => onToggleSavedStory(activeProfile.id, story.id)} onToggleLike={() => onToggleSocial("likedIds", story.id)} />{progress && !progress.completed ? <p className="kid-progress-note">Continue from page {progress.lastPage + 1} of this story.</p> : progress?.completed ? <p className="kid-progress-note">Finished story ✓</p> : null}</div>;
          })}</div> : stories.length ? <div className="kid-empty">No stories match your search or reading level.</div> : null}
        </section>
        <section className="kid-library kid-liked-section">
          <div className="kid-library-heading"><div><p className="eyebrow">Your favourites</p><h2>Stories you like</h2></div><span>{activeProfile.likedStoryIds.length} liked</span></div>
          {visibleStories.filter((story) => activeProfile.likedStoryIds.includes(story.id)).length > 0
            ? <div className="story-grid">{visibleStories.filter((story) => activeProfile.likedStoryIds.includes(story.id)).map((story) => <StoryCard key={story.id} story={story} language={language} onSelect={onSelectStory} isSaved={activeProfile.savedStoryIds.includes(story.id)} isLiked onToggleSave={() => onToggleSavedStory(activeProfile.id, story.id)} onToggleLike={() => onToggleSocial("likedIds", story.id)} />)}</div>
            : <div className="kid-empty">Tap the heart on a story to add it to your favourites.</div>}
        </section>
        <section className="kid-library kid-writing-section">
          <div className="kid-library-heading"><div><p className="eyebrow">Young author corner</p><h2>My stories</h2></div><span>{activeProfile.authoredStories.length} saved</span></div>
          <p className="kid-writing-intro">Write your own stories and keep them on this device in your private reading space.</p>
          <form className="kid-story-form" onSubmit={submitChildStory}>
            <label htmlFor="child-story-title">Story title</label>
            <input id="child-story-title" value={storyTitle} onChange={(event) => setStoryTitle(event.target.value)} maxLength={100} placeholder="Give your story a title" required />
            <label htmlFor="child-story-content">Your story</label>
            <textarea id="child-story-content" value={storyContent} onChange={(event) => setStoryContent(event.target.value)} maxLength={5000} minLength={20} placeholder="Once upon a time…" required />
            <p className="kid-privacy-note">Your writing stays in this browser on this device. It is not sent to your account or shared with the librarian.</p>
            {storyError ? <p className="kid-form-error" role="alert">{storyError}</p> : null}
            <button className="kid-primary-button" type="submit">Save to My stories <span aria-hidden="true">✦</span></button>
          </form>
          {activeProfile.authoredStories.length ? <div className="kid-authored-list">{activeProfile.authoredStories.slice().reverse().map((story) => <article className="kid-authored-story" key={story.id}><div><h3>{story.title}</h3><time dateTime={story.createdAt}>{new Date(story.createdAt).toLocaleDateString()}</time></div><p>{story.content}</p><button type="button" onClick={() => removeChildStory(story.id)}>Delete story</button></article>)}</div> : <div className="kid-empty kid-writing-empty">Your saved stories will appear here after you write one.</div>}
          {storyError ? <p className="kid-form-error" role="alert">{storyError}</p> : null}
        </section>
        <footer className="kids-footer"><span>Keep exploring, one story at a time.</span><button onClick={onSwitchProfiles}>Choose another reader</button></footer>
      </main>
    );
  }

  return (
    <main className="kids-shell">
      <header className="kids-header"><button className="kids-back" onClick={onBack}>← Library</button><span className="kids-brand">StoryWeaver <span>· Kids</span></span><AccessibilityControls /></header>
      <section className="kid-profiles">
        <p className="eyebrow">A place for every young reader</p>
        <h1>Who’s reading today?</h1>
        <p className="kid-profiles-copy">Choose your profile or create a new one to get a reading space of your own.</p>
        {actionError ? <p className="kid-form-error" role="alert">{actionError}</p> : null}
        <div className="kid-profile-list">
          {profiles.map((profile) => {
            const completedCount = profile.readingProgress.filter((item) => item.completed).length;
            const inProgressCount = profile.readingProgress.filter((item) => !item.completed).length;
            return <article className="kid-profile-card" key={profile.id}><button className="kid-profile-open-button" onClick={() => onSelectProfile(profile)}><span className="kid-profile-avatar" aria-hidden="true">{profile.avatar}</span><strong>{profile.name}</strong><small>ID: {profile.userId}</small><small>{profile.ageBand === "under-6" ? "Under 6" : `${profile.ageBand} years`}</small><small>{completedCount} finished · {inProgressCount} in progress</small><span className="kid-profile-open">Open reading space →</span></button><label className="parent-reading-control">Maximum reading level<select aria-label={`Maximum reading level for ${profile.name}`} value={profile.maxReadingLevel} onChange={(event) => onChangeReadingLevel(profile.id, event.target.value)}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Level {level}</option>)}</select></label></article>;
          })}
          <button className="kid-profile-card kid-profile-create" onClick={onOpenRegistration}><span className="kid-profile-avatar" aria-hidden="true">＋</span><strong>Create a profile</strong><small>Make a new reading space</small><span className="kid-profile-open">Get started →</span></button>
        </div>
        {profiles.length === 0 ? <p className="kid-profile-hint">Create a child profile in your family account to begin. Use a nickname instead of a full name.</p> : null}
      </section>
    </main>
  );
}
