const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Resolve a YouTube handle or channel URL to channel info
 */
export async function resolveChannel(handle, apiKey) {
  // Try forHandle first (works for @handle format)
  let url = `${YT_API_BASE}/channels?forHandle=${handle}&part=snippet,contentDetails,statistics&key=${apiKey}`;
  let res = await fetch(url);
  let data = await res.json();

  if (data.error) {
    throw new Error(`YouTube API Error: ${data.error.message}`);
  }

  // If forHandle didn't work, try search
  if (!data.items || data.items.length === 0) {
    url = `${YT_API_BASE}/search?q=${encodeURIComponent(handle)}&type=channel&part=snippet&maxResults=1&key=${apiKey}`;
    res = await fetch(url);
    data = await res.json();

    if (data.error) {
      throw new Error(`YouTube API Error: ${data.error.message}`);
    }

    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Get full channel info
    const channelId = data.items[0].snippet.channelId || data.items[0].id.channelId;
    url = `${YT_API_BASE}/channels?id=${channelId}&part=snippet,contentDetails,statistics&key=${apiKey}`;
    res = await fetch(url);
    data = await res.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }
  }

  const ch = data.items[0];
  return {
    id: ch.id,
    title: ch.snippet.title,
    description: ch.snippet.description,
    thumbnail: ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url,
    subscriberCount: parseInt(ch.statistics?.subscriberCount || '0'),
    videoCount: parseInt(ch.statistics?.videoCount || '0'),
    viewCount: parseInt(ch.statistics?.viewCount || '0'),
    uploadsPlaylistId: ch.contentDetails?.relatedPlaylists?.uploads
  };
}

/**
 * Get all videos from a channel's uploads playlist
 */
export async function getChannelVideos(uploadsPlaylistId, apiKey) {
  if (!uploadsPlaylistId) {
    throw new Error('No uploads playlist found for this channel');
  }

  const allVideoIds = [];
  let nextPageToken = null;

  // Step 1: Get all video IDs from playlist (paginated)
  do {
    let url = `${YT_API_BASE}/playlistItems?playlistId=${uploadsPlaylistId}&part=contentDetails&maxResults=50&key=${apiKey}`;
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      throw new Error(`YouTube API Error: ${data.error.message}`);
    }

    if (data.items) {
      for (const item of data.items) {
        allVideoIds.push(item.contentDetails.videoId);
      }
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  // Step 2: Get video details in batches of 50
  const allVideos = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batch = allVideoIds.slice(i, i + 50);
    const url = `${YT_API_BASE}/videos?id=${batch.join(',')}&part=snippet,statistics,contentDetails&key=${apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      throw new Error(`YouTube API Error: ${data.error.message}`);
    }

    if (data.items) {
      for (const v of data.items) {
        allVideos.push({
          id: v.id,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt,
          thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
          duration: v.contentDetails?.duration || '',
          views: parseInt(v.statistics?.viewCount || '0'),
          likes: parseInt(v.statistics?.likeCount || '0'),
          comments: parseInt(v.statistics?.commentCount || '0')
        });
      }
    }
  }

  return allVideos;
}
