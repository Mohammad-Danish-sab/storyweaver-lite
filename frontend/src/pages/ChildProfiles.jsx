import { useState } from "react";
import StoryCard from "../components/discovery/StoryCard";
import "./ChildProfiles.css";

const avatars = ["🦊", "🐼", "🐸", "🦋", "🐯", "🐢", "🐰", "🐳"];

export default function ChildProfiles({
  view,
  profiles,
  activeProfile,
  stories,
  status,
  language,
  social,
  onBack,
  onRegister,
  onSelectProfile,
  onOpenRegistration,
  onSwitchProfiles,
  onSelectStory,
  onToggleSocial,
  onSaveStory,
  onDeleteStory,
}) {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [ageBand, setAgeBand] = useState("6-8");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [formError, setFormError] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [storyError, setStoryError] = useState("");

  const submitProfile = (event) => {
    event.preventDefault();
    const nickname = name.trim();
    if (nickname.length < 2 || nickname.length > 24) {
      setFormError("Choose a nickname between 2 and 24 characters.");
      return;
    }
    try {
      onRegister({ name: nickname, userId, ageBand, avatar });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The profile could not be saved on this device.");
    }
  };

  const submitChildStory = (event) => {
    event.preventDefault();
    const title = storyTitle.trim();
    const content = storyContent.trim();
    if (title.length < 2 || content.length < 20) {
      setStoryError("Add a title and at least 20 characters to save your story.");
      return;
    }
    try {
      onSaveStory(activeProfile.id, { title, content });
      setStoryTitle("");
      setStoryContent("");
      setStoryError("");
    } catch (error) {
      setStoryError(error instanceof Error ? error.message : "Your story could not be saved on this device.");
    }
  };

  if (view === "kid-register") {
    return (
      <main className="kids-shell">
        <header className="kids-header">
          <button className="kids-back" onClick={onBack}>← Library</button>
          <span className="kids-brand">StoryWeaver <span>· Kids</span></span>
        </header>
        <section className="kid-form-card">
          <div className="kid-form-intro"><span className="kid-form-illustration" aria-hidden="true">🌱</span><p className="eyebrow">A space of your own</p><h1>Create a reader profile</h1><p>Pick a nickname and an avatar to make your own reading space.</p></div>
          <form onSubmit={submitProfile}>
            <label className="kid-field-label" htmlFor="kid-nickname">Your nickname</label>
            <input id="kid-nickname" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={24} autoComplete="nickname" placeholder="e.g. Sunny" required />
            <label className="kid-field-label" htmlFor="kid-user-id">Choose your user ID</label>
            <input id="kid-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} minLength={3} maxLength={20} autoCapitalize="none" autoCorrect="off" aria-describedby="kid-user-id-hint" placeholder="e.g. sunny_reader7" required />
            <span id="kid-user-id-hint" className="kid-id-hint">3–20 letters, numbers, hyphens, or underscores. IDs must be unique on this device.</span>
            <fieldset className="avatar-picker"><legend>Choose an avatar</legend><div>{avatars.map((option) => <button key={option} type="button" className={avatar === option ? "avatar-choice selected" : "avatar-choice"} aria-label={`Choose ${option}`} aria-pressed={avatar === option} onClick={() => setAvatar(option)}>{option}</button>)}</div></fieldset>
            <label className="kid-field-label" htmlFor="kid-age">Age group</label>
            <select id="kid-age" value={ageBand} onChange={(event) => setAgeBand(event.target.value)}><option value="under-6">Under 6</option><option value="6-8">6–8 years</option><option value="9-12">9–12 years</option></select>
            <p className="kid-privacy-note">Use a nickname, not a full name. This profile and user ID stay in this browser on this device and are not sent to the library.</p>
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
          <div className="kid-library-heading"><div><p className="eyebrow">The story shelf</p><h2>Choose an adventure</h2></div><span>{stories.length} stories</span></div>
          {status === "loading" && stories.length === 0 ? <div className="kid-empty">Finding stories for you…</div> : null}
          {status === "error" && stories.length === 0 ? <div className="kid-empty">The library is not available right now. Please try again later.</div> : null}
          {stories.length > 0 ? <div className="story-grid">{stories.map((story) => <StoryCard key={story.id} story={story} language={language} onSelect={onSelectStory} isSaved={social.savedIds.includes(story.id)} isLiked={activeProfile.likedStoryIds.includes(story.id)} onToggleSave={() => onToggleSocial("savedIds", story.id)} onToggleLike={() => onToggleSocial("likedIds", story.id)} />)}</div> : null}
        </section>
        <section className="kid-library kid-liked-section">
          <div className="kid-library-heading"><div><p className="eyebrow">Your favourites</p><h2>Stories you like</h2></div><span>{activeProfile.likedStoryIds.length} liked</span></div>
          {stories.filter((story) => activeProfile.likedStoryIds.includes(story.id)).length > 0
            ? <div className="story-grid">{stories.filter((story) => activeProfile.likedStoryIds.includes(story.id)).map((story) => <StoryCard key={story.id} story={story} language={language} onSelect={onSelectStory} isSaved={social.savedIds.includes(story.id)} isLiked onToggleSave={() => onToggleSocial("savedIds", story.id)} onToggleLike={() => onToggleSocial("likedIds", story.id)} />)}</div>
            : <div className="kid-empty">Tap the heart on a story to add it to your favourites.</div>}
        </section>
        <section className="kid-library kid-writing-section">
          <div className="kid-library-heading"><div><p className="eyebrow">Young author corner</p><h2>My stories</h2></div><span>{activeProfile.authoredStories.length} saved</span></div>
          <p className="kid-writing-intro">Write your own stories and keep them here in your private reading space.</p>
          <form className="kid-story-form" onSubmit={submitChildStory}>
            <label htmlFor="child-story-title">Story title</label>
            <input id="child-story-title" value={storyTitle} onChange={(event) => setStoryTitle(event.target.value)} maxLength={100} placeholder="Give your story a title" required />
            <label htmlFor="child-story-content">Your story</label>
            <textarea id="child-story-content" value={storyContent} onChange={(event) => setStoryContent(event.target.value)} maxLength={5000} minLength={20} placeholder="Once upon a time…" required />
            <p className="kid-privacy-note">Your writing is saved only on this device for this profile; it is not shared with the librarian or sent to the server.</p>
            {storyError ? <p className="kid-form-error" role="alert">{storyError}</p> : null}
            <button className="kid-primary-button" type="submit">Save to My stories <span aria-hidden="true">✦</span></button>
          </form>
          {activeProfile.authoredStories.length ? <div className="kid-authored-list">{activeProfile.authoredStories.slice().reverse().map((story) => <article className="kid-authored-story" key={story.id}><div><h3>{story.title}</h3><time dateTime={story.createdAt}>{new Date(story.createdAt).toLocaleDateString()}</time></div><p>{story.content}</p><button type="button" onClick={() => onDeleteStory(activeProfile.id, story.id)}>Delete story</button></article>)}</div> : <div className="kid-empty kid-writing-empty">Your saved stories will appear here after you write one.</div>}
        </section>
        <footer className="kids-footer"><span>Keep exploring, one story at a time.</span><button onClick={onSwitchProfiles}>Choose another reader</button></footer>
      </main>
    );
  }

  return (
    <main className="kids-shell">
      <header className="kids-header"><button className="kids-back" onClick={onBack}>← Library</button><span className="kids-brand">StoryWeaver <span>· Kids</span></span></header>
      <section className="kid-profiles">
        <p className="eyebrow">A place for every young reader</p>
        <h1>Who’s reading today?</h1>
        <p className="kid-profiles-copy">Choose your profile or create a new one to get a reading space of your own.</p>
        <div className="kid-profile-list">
          {profiles.map((profile) => <button className="kid-profile-card" key={profile.id} onClick={() => onSelectProfile(profile)}><span className="kid-profile-avatar" aria-hidden="true">{profile.avatar}</span><strong>{profile.name}</strong><small>ID: {profile.userId}</small><small>{profile.ageBand === "under-6" ? "Under 6" : `${profile.ageBand} years`}</small><span className="kid-profile-open">Open reading space →</span></button>)}
          <button className="kid-profile-card kid-profile-create" onClick={onOpenRegistration}><span className="kid-profile-avatar" aria-hidden="true">＋</span><strong>Create a profile</strong><small>Make a new reading space</small><span className="kid-profile-open">Get started →</span></button>
        </div>
        {profiles.length === 0 ? <p className="kid-profile-hint">Profiles are saved only on this device. A nickname is all you need.</p> : null}
      </section>
    </main>
  );
}
