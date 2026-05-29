/**
 * Normalizes Invidious API response to standard schema
 */
function normalizeInvidiousVideo(video, index) {
  return {
    rank: index + 1,
    videoId: video.videoId,
    title: video.title,
    channel: video.author,
    channelId: video.authorId,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    viewCount: video.viewCount,
    publishedAt: video.published, // unix timestamp in seconds
    publishedText: video.publishedText,
    duration: video.lengthSeconds,
    youtubeUrl: `https://youtube.com/watch?v=${video.videoId}`,
    isLive: video.liveNow || false,
    isVerified: video.authorVerified || false
  };
}

/**
 * Normalizes Piped API response to standard schema
 */
function normalizePipedVideo(video, index) {
  // Try to parse duration string (e.g. "1:23:45" to seconds)
  let lengthSeconds = 0;
  if (video.duration) {
    const parts = video.duration.toString().split(':').map(Number);
    if (parts.length === 3) lengthSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) lengthSeconds = parts[0] * 60 + parts[1];
    else lengthSeconds = parts[0];
  }

  // Parse view count text if number not available
  let viewCount = video.views;
  if (typeof viewCount === 'string') {
     viewCount = parseInt(viewCount.replace(/[^0-9]/g, ''), 10) || 0;
  }

  // Fallback for published time if missing
  const publishedAt = Math.floor(Date.now() / 1000); // Piped might not provide exact unix timestamp reliably in all endpoints, fallback to now if not available easily. Usually it provides uploadedDate string.

  return {
    rank: index + 1,
    videoId: video.url.split('?v=')[1] || video.url.split('/').pop(),
    title: video.title,
    channel: video.uploaderName,
    channelId: video.uploaderUrl ? video.uploaderUrl.split('/channel/')[1] || '' : '',
    thumbnailUrl: video.url.split('?v=')[1] ? `https://i.ytimg.com/vi/${video.url.split('?v=')[1]}/hqdefault.jpg` : video.thumbnail,
    viewCount: viewCount,
    publishedAt: publishedAt,
    publishedText: video.uploadedDate || '',
    duration: lengthSeconds,
    youtubeUrl: video.url.startsWith('http') ? video.url : `https://youtube.com${video.url}`,
    isLive: false, // Piped trending doesn't reliably indicate live status
    isVerified: video.uploaderVerified || false
  };
}

/**
 * Normalizes YouTube Scraped Data to standard schema
 */
function normalizeYouTubeVideo(video, index) {
  // Parse duration text (e.g., "10:30")
  let lengthSeconds = 0;
  if (video.duration) {
    const parts = video.duration.split(':').map(Number);
    if (parts.length === 3) lengthSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) lengthSeconds = parts[0] * 60 + parts[1];
    else lengthSeconds = parts[0];
  }
  
  // Parse views (e.g., "1,234,567 views")
  let viewCount = 0;
  if (video.views) {
    viewCount = parseInt(video.views.replace(/[^0-9]/g, ''), 10) || 0;
  }

  return {
    rank: index + 1,
    videoId: video.videoId,
    title: video.title,
    channel: video.channel,
    channelId: video.channelId,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`, // use direct ytimg for consistency
    viewCount: viewCount,
    publishedAt: Math.floor(Date.now() / 1000), // Hard to get exact unix time from text, frontend will fallback to publishedText
    publishedText: video.published,
    duration: lengthSeconds,
    youtubeUrl: `https://youtube.com/watch?v=${video.videoId}`,
    isLive: video.views && video.views.includes('watching'),
    isVerified: false // Scrape data usually doesn't explicitly flag this easily in standard feed
  };
}

module.exports = {
  normalizeInvidiousVideo,
  normalizePipedVideo,
  normalizeYouTubeVideo
};
