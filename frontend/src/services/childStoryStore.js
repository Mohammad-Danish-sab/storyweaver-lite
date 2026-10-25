const STORAGE_KEY = "storyweaver-child-authored-stories";

function getAllChildStories() {
  try {
    const stories = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return stories && typeof stories === "object" && !Array.isArray(stories) ? stories : {};
  } catch {
    return {};
  }
}

export function getChildStories(childId) {
  const stories = getAllChildStories()[childId];
  if (!Array.isArray(stories)) return [];
  return stories.filter((story) =>
    story &&
    typeof story.id === "string" &&
    typeof story.title === "string" &&
    typeof story.content === "string" &&
    typeof story.createdAt === "string",
  );
}

export function saveChildStory(childId, { title, content }) {
  const allStories = getAllChildStories();
  const story = {
    id: crypto.randomUUID(),
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...allStories, [childId]: [story, ...(getChildStories(childId))] }),
  );
  return story;
}

export function deleteChildStory(childId, storyId) {
  const allStories = getAllChildStories();
  const stories = getChildStories(childId).filter((story) => story.id !== storyId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...allStories, [childId]: stories }));
}
