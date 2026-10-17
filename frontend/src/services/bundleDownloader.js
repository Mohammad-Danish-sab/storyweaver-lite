export async function downloadFullStoryBundle(story) {
  if (!("caches" in window)) return false;

  const cache = await caches.open("storyweaver-media-v1");
  const urlsToCache = [];

  // Add cover image
  if (story.cover_image) urlsToCache.push(story.cover_image);

  // Add all page illustrations and audio tracks
  story.pages.forEach((page) => {
    if (page.image_url) urlsToCache.push(page.image_url);
    if (page.audio_url_kn) urlsToCache.push(page.audio_url_kn);
  });

  try {
    await cache.addAll(urlsToCache);
    console.log(`[Bundle Downloader] Successfully cached story: ${story.id}`);
    return true;
  } catch (err) {
    console.error(
      `[Bundle Downloader] Failed to cache assets for story ${story.id}:`,
      err,
    );
    return false;
  }
}
