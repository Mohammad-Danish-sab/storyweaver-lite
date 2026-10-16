export default function StoryCard({ story, language, onSelect }) {
  const title = language === "kn" ? story.title_kn : story.title_en;
  return <article className="story-card"><div className="card-image-wrap"><img src={story.cover_image} alt="" className="card-image" /><span className="level-badge">Level {story.level}</span></div><div className="card-content"><p className="card-category">{story.category}</p><h3>{title}</h3><p className="card-meta">{story.pages.length} {story.pages.length === 1 ? "page" : "pages"} · Read together</p><button className="read-button" onClick={() => onSelect(story.id)}>Read story <span aria-hidden="true">→</span></button></div></article>;
}
