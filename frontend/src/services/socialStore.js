const STORAGE_KEY = "storyweaver-library-social";

const emptyState = { likedIds: [], savedIds: [], comments: {} };

export function getSocialState() {
  try {
    return { ...emptyState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return emptyState;
  }
}

export function saveSocialState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function toggleStoryList(state, key, storyId) {
  const values = state[key].includes(storyId)
    ? state[key].filter((id) => id !== storyId)
    : [...state[key], storyId];
  const next = { ...state, [key]: values };
  saveSocialState(next);
  return next;
}

export function addComment(state, storyId, text) {
  const comment = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() };
  const next = { ...state, comments: { ...state.comments, [storyId]: [...(state.comments[storyId] || []), comment] } };
  saveSocialState(next);
  return next;
}
