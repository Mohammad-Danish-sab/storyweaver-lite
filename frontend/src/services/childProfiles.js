const STORAGE_KEY = "storyweaver-child-profiles";

export function getChildProfiles() {
  try {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(profiles)) return [];
    return profiles
      .filter((profile) =>
        profile &&
        typeof profile.id === "string" &&
        typeof profile.name === "string" &&
        typeof profile.ageBand === "string" &&
        typeof profile.avatar === "string",
      )
      .map((profile) => ({
        ...profile,
        userId: typeof profile.userId === "string" ? profile.userId : `reader-${profile.id.slice(0, 8)}`,
        likedStoryIds: Array.isArray(profile.likedStoryIds) ? profile.likedStoryIds : [],
        authoredStories: Array.isArray(profile.authoredStories) ? profile.authoredStories : [],
      }));
  } catch {
    return [];
  }
}

export function addChildProfile({ name, userId, ageBand, avatar }) {
  const normalizedUserId = userId.trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,20}$/.test(normalizedUserId)) {
    throw new Error("Use 3–20 letters, numbers, hyphens, or underscores for the user ID.");
  }
  const profiles = getChildProfiles();
  if (profiles.some((profile) => profile.userId.toLowerCase() === normalizedUserId)) {
    throw new Error("That user ID is already in use on this device. Choose another one.");
  }
  const profile = {
    id: crypto.randomUUID(),
    name: name.trim(),
    userId: normalizedUserId,
    ageBand,
    avatar,
    likedStoryIds: [],
    authoredStories: [],
    createdAt: new Date().toISOString(),
  };
  saveProfiles([...profiles, profile]);
  return profile;
}

function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  return profiles;
}

export function toggleChildStoryLike(profileId, storyId) {
  const profiles = getChildProfiles().map((profile) => {
    if (profile.id !== profileId) return profile;
    const likedStoryIds = profile.likedStoryIds.includes(storyId)
      ? profile.likedStoryIds.filter((id) => id !== storyId)
      : [...profile.likedStoryIds, storyId];
    return { ...profile, likedStoryIds };
  });
  return saveProfiles(profiles);
}

export function saveChildStory(profileId, { title, content }) {
  const currentProfiles = getChildProfiles();
  if (!currentProfiles.some((profile) => profile.id === profileId)) {
    throw new Error("This reader profile could not be found. Reopen the child profile and try again.");
  }
  const profiles = currentProfiles.map((profile) => profile.id === profileId
    ? {
      ...profile,
      authoredStories: [
        ...profile.authoredStories,
        { id: crypto.randomUUID(), title: title.trim(), content: content.trim(), createdAt: new Date().toISOString() },
      ],
    }
    : profile);
  return saveProfiles(profiles);
}

export function deleteChildStory(profileId, storyId) {
  const profiles = getChildProfiles().map((profile) => profile.id === profileId
    ? { ...profile, authoredStories: profile.authoredStories.filter((story) => story.id !== storyId) }
    : profile);
  return saveProfiles(profiles);
}
