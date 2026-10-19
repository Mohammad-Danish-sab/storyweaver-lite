const STORAGE_KEY = "storyweaver-child-profiles";

export function getChildProfiles() {
  try {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(profiles)) return [];
    return profiles.filter((profile) =>
      profile &&
      typeof profile.id === "string" &&
      typeof profile.name === "string" &&
      typeof profile.ageBand === "string" &&
      typeof profile.avatar === "string",
    );
  } catch {
    return [];
  }
}

export function addChildProfile({ name, ageBand, avatar }) {
  const profile = {
    id: crypto.randomUUID(),
    name: name.trim(),
    ageBand,
    avatar,
    createdAt: new Date().toISOString(),
  };
  const profiles = [...getChildProfiles(), profile];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  return profile;
}
