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
}) {
  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState("6-8");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [formError, setFormError] = useState("");

  const submitProfile = (event) => {
    event.preventDefault();
    const nickname = name.trim();
    if (nickname.length < 2 || nickname.length > 24) {
      setFormError("Choose a nickname between 2 and 24 characters.");
      return;
    }
    try {
      onRegister({ name: nickname, ageBand, avatar });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The profile could not be saved on this device.");
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
            <fieldset className="avatar-picker"><legend>Choose an avatar</legend><div>{avatars.map((option) => <button key={option} type="button" className={avatar === option ? "avatar-choice selected" : "avatar-choice"} aria-label={`Choose ${option}`} aria-pressed={avatar === option} onClick={() => setAvatar(option)}>{option}</button>)}</div></fieldset>
            <label className="kid-field-label" htmlFor="kid-age">Age group</label>
            <select id="kid-age" value={ageBand} onChange={(event) => setAgeBand(event.target.value)}><option value="under-6">Under 6</option><option value="6-8">6–8 years</option><option value="9-12">9–12 years</option></select>
            <p className="kid-privacy-note">Use a nickname, not a full name. This profile stays in this browser on this device and is not sent to the library.</p>
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
          <div><p className="eyebrow">Your reading space</p><h1>Hi, {activeProfile.name}!</h1><p>What story shall we explore today?</p></div>
          <button className="kid-add-button" onClick={onOpenRegistration}>＋ Add a reader</button>
        </section>
        <section className="kid-library">
          <div className="kid-library-heading"><div><p className="eyebrow">The story shelf</p><h2>Choose an adventure</h2></div><span>{stories.length} stories</span></div>
          {status === "loading" && stories.length === 0 ? <div className="kid-empty">Finding stories for you…</div> : null}
          {status === "error" && stories.length === 0 ? <div className="kid-empty">The library is not available right now. Please try again later.</div> : null}
          {stories.length > 0 ? <div className="story-grid">{stories.map((story) => <StoryCard key={story.id} story={story} language={language} onSelect={onSelectStory} isSaved={social.savedIds.includes(story.id)} isLiked={social.likedIds.includes(story.id)} onToggleSave={() => onToggleSocial("savedIds", story.id)} onToggleLike={() => onToggleSocial("likedIds", story.id)} />)}</div> : null}
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
          {profiles.map((profile) => <button className="kid-profile-card" key={profile.id} onClick={() => onSelectProfile(profile)}><span className="kid-profile-avatar" aria-hidden="true">{profile.avatar}</span><strong>{profile.name}</strong><small>{profile.ageBand === "under-6" ? "Under 6" : `${profile.ageBand} years`}</small><span className="kid-profile-open">Open reading space →</span></button>)}
          <button className="kid-profile-card kid-profile-create" onClick={onOpenRegistration}><span className="kid-profile-avatar" aria-hidden="true">＋</span><strong>Create a profile</strong><small>Make a new reading space</small><span className="kid-profile-open">Get started →</span></button>
        </div>
        {profiles.length === 0 ? <p className="kid-profile-hint">Profiles are saved only on this device. A nickname is all you need.</p> : null}
      </section>
    </main>
  );
}
