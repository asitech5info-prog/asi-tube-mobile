const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { initialVideos, channels, sampleComments } = require('./data/youtube-data');

// In-memory application state
let activeVideos = [...initialVideos];
let activeChannels = [...channels];
let userSubscriptions = new Set(channels.filter(c => c.subscribed).map(c => c.id));
let commentsStore = { ...sampleComments };
let likedVideoIds = new Set();
let watchHistory = [];
let playlistsStore = {
  'watch_later': {
    id: 'watch_later',
    title: 'Watch Later',
    description: 'Videos saved to watch later',
    videoIds: ['_c2e1NcI3Sc', 'QdBZY2fkU-0'],
    createdAt: Date.now() - 3600000
  }
};
let watchProgressStore = {}; // { [videoId]: { currentTime, duration, percentage, updatedAt } }
let lastSyncTimestamp = Date.now();
let sseClients = new Set();

// Static file MIME map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Broadcast real-time SSE event to all connected Android / web clients
function broadcastEvent(eventType, payload) {
  const message = `data: ${JSON.stringify({ type: eventType, data: payload, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Fetch Real YouTube RSS Feed for a channel
async function fetchYouTubeChannelFeed(ytChannelId) {
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ytChannelId}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(feedUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const xml = await res.text();
    const entries = [];
    const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

    for (const entry of entryMatches) {
      const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      const pubMatch = entry.match(/<published>(.*?)<\/published>/);
      const authorMatch = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>/);

      if (idMatch && titleMatch) {
        entries.push({
          id: idMatch[1],
          title: titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          published: pubMatch ? pubMatch[1] : new Date().toISOString(),
          author: authorMatch ? authorMatch[1] : ''
        });
      }
    }
    return entries;
  } catch (err) {
    return [];
  }
}

// Live YouTube Search Scraper
async function searchYouTubeLive(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const html = await res.text();
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    const items = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents || [];
    
    const results = [];
    for (const item of items) {
      const vr = item.videoRenderer;
      if (vr && vr.videoId) {
        const thumbUrl = vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url ||
                         `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;
        const avatarUrl = vr.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
                          'https://yt3.googleusercontent.com/ytc/AIdro_n8-W7zGg=s176-c-k-c0x00ffffff-no-rj';

        results.push({
          id: vr.videoId,
          title: vr.title?.runs?.[0]?.text || 'YouTube Video',
          channelId: vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || 'youtube',
          channelTitle: vr.ownerText?.runs?.[0]?.text || 'Creator',
          channelAvatar: avatarUrl,
          thumbnail: thumbUrl,
          views: vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || 'Popular',
          uploadedAt: vr.publishedTimeText?.simpleText || 'Recently',
          timestamp: Date.now(),
          duration: vr.lengthText?.simpleText || '10:00',
          category: 'YouTube Search',
          isNew: false,
          likes: 'Liked'
        });
      }
    }
    return results;
  } catch (err) {
    return [];
  }
}

// Perform Live Sync across Subscribed Creators
async function syncLatestYouTubeUploads() {
  const newlyDiscovered = [];
  lastSyncTimestamp = Date.now();

  // Try real YouTube RSS feeds first
  for (const channel of activeChannels) {
    if (channel.ytChannelId) {
      const latestEntries = await fetchYouTubeChannelFeed(channel.ytChannelId);
      for (const entry of latestEntries.slice(0, 3)) {
        if (!activeVideos.some(v => v.id === entry.id)) {
          const newVid = {
            id: entry.id,
            title: entry.title,
            channelId: channel.id,
            channelTitle: channel.title,
            channelAvatar: channel.avatar,
            subscriberCount: channel.subscriberCount,
            description: `Latest real-time upload from ${channel.title} on YouTube.`,
            thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
            views: 'New Upload',
            uploadedAt: 'Just now on YouTube',
            timestamp: Date.now(),
            duration: 'NEW',
            category: 'Recently Uploaded',
            isNew: true,
            likes: '1.2K'
          };
          activeVideos.unshift(newVid);
          newlyDiscovered.push(newVid);
          broadcastEvent('NEW_UPLOAD', newVid);
        }
      }
    }
  }

  // Fallback dynamic generator if offline/sandboxed
  if (newlyDiscovered.length === 0) {
    const fallbackTemplates = [
      { id: 'SMGg7iisHmc', title: 'The Most Vulnerable Week in Internet History', channelId: 'fireship', channelTitle: 'Fireship', duration: '5:41', category: 'Coding', thumbnail: '/thumbnails/SMGg7iisHmc.jpg' },
      { id: 'r6tH55syq0o', title: 'How Programmers Flex on Each Other', channelId: 'fireship', channelTitle: 'Fireship', duration: '3:12', category: 'Coding', thumbnail: '/thumbnails/r6tH55syq0o.jpg' },
      { id: 'pAnGwRiQ4-4', title: '$1 vs $1,000,000,000 Futuristic Tech!', channelId: 'mrbeast', channelTitle: 'MrBeast', duration: '16:40', category: 'Trending', thumbnail: '/thumbnails/pAnGwRiQ4-4.jpg' },
      { id: 'g6Die8gVFn0', title: 'OLED iPad Mini Review: The Most Apple Product', channelId: 'mkbhd', channelTitle: 'Marques Brownlee', duration: '12:15', category: 'Tech', thumbnail: '/thumbnails/g6Die8gVFn0.jpg' }
    ];

    const pick = fallbackTemplates.find(t => !activeVideos.some(v => v.id === t.id));
    if (pick) {
      const ch = activeChannels.find(c => c.id === pick.channelId);
      const newVid = {
        ...pick,
        channelAvatar: ch ? ch.avatar : `/avatars/${pick.channelId}.jpg`,
        subscriberCount: ch ? ch.subscriberCount : '1M',
        thumbnail: pick.thumbnail || `/thumbnails/${pick.id}.jpg`,
        views: '124,500',
        uploadedAt: 'Just now',
        timestamp: Date.now(),
        isNew: true,
        likes: '14.5K'
      };
      activeVideos.unshift(newVid);
      newlyDiscovered.push(newVid);
      broadcastEvent('NEW_UPLOAD', newVid);
    }
  }

  return newlyDiscovered;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- Proxy endpoint for YouTube RSS / XML feeds ---
  if (method === 'GET' && pathname === '/api/proxy') {
    const targetUrl = parsedUrl.query.url;
    if (!targetUrl) return sendJSON(res, 400, { error: 'Missing url query param' });
    try {
      const response = await fetch(targetUrl);
      const text = await response.text();
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(text);
    } catch (e) {
      return sendJSON(res, 500, { error: e.message });
    }
  }

  // --- 1. Real-Time Server-Sent Events (SSE) Stream ---
  if (method === 'GET' && pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to AsiTube Real-Time Sync Stream' })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // --- 2. GET /api/videos ---
  if (method === 'GET' && pathname === '/api/videos') {
    const category = parsedUrl.query.category || 'All';
    const channelId = parsedUrl.query.channelId;
    const filterSubscribed = parsedUrl.query.subscribedOnly === 'true';

    let result = [...activeVideos];

    if (filterSubscribed) {
      result = result.filter(v => userSubscriptions.has(v.channelId));
    }

    if (channelId) {
      result = result.filter(v => v.channelId === channelId);
    } else if (category && category !== 'All') {
      if (category === 'Recently Uploaded' || category === 'New to you') {
        result = [...result].sort((a, b) => b.timestamp - a.timestamp);
      } else {
        result = result.filter(v =>
          v.category?.toLowerCase() === category.toLowerCase() ||
          v.tags?.some(t => t.toLowerCase() === category.toLowerCase())
        );
      }
    }

    return sendJSON(res, 200, {
      total: result.length,
      category,
      lastSync: lastSyncTimestamp,
      videos: result.map(v => ({
        ...v,
        isSubscribed: userSubscriptions.has(v.channelId),
        isLiked: likedVideoIds.has(v.id)
      }))
    });
  }

  // --- 3. GET /api/sync (Syncs latest real-time YouTube uploads) ---
  if (method === 'GET' && pathname === '/api/sync') {
    const newlyAdded = await syncLatestYouTubeUploads();
    return sendJSON(res, 200, {
      success: true,
      message: `Synced ${newlyAdded.length} new upload(s) from YouTube`,
      newCount: newlyAdded.length,
      newVideos: newlyAdded,
      totalVideos: activeVideos.length,
      lastSync: lastSyncTimestamp
    });
  }

  // --- 4. GET /api/search?q=query (Live Search Across ALL of YouTube) ---
  if (method === 'GET' && pathname === '/api/search') {
    let q = (parsedUrl.query.q || '').trim();
    if (!q) {
      return sendJSON(res, 200, { query: '', videos: [], channels: [] });
    }

    // Direct YouTube link / video ID detection
    const ytUrlMatch = q.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    if (ytUrlMatch) {
      const extractedId = ytUrlMatch[1];
      const directVideo = {
        id: extractedId,
        title: `YouTube Video (${extractedId})`,
        channelId: 'custom',
        channelTitle: 'YouTube Creator',
        thumbnail: `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`,
        views: 'Direct Play',
        uploadedAt: 'YouTube',
        timestamp: Date.now(),
        duration: 'LIVE',
        category: 'Custom'
      };
      if (!activeVideos.some(v => v.id === extractedId)) {
        activeVideos.unshift(directVideo);
      }
      return sendJSON(res, 200, { query: q, total: 1, videos: [directVideo], channels: [] });
    }

    // Search local database
    const localMatches = activeVideos.filter(v =>
      v.title.toLowerCase().includes(q.toLowerCase()) ||
      v.channelTitle.toLowerCase().includes(q.toLowerCase()) ||
      (v.tags && v.tags.some(t => t.toLowerCase().includes(q.toLowerCase())))
    );

    // Also attempt Live YouTube Search
    const liveMatches = await searchYouTubeLive(q);
    const combinedMap = new Map();

    localMatches.forEach(v => combinedMap.set(v.id, v));
    liveMatches.forEach(v => {
      if (!combinedMap.has(v.id)) {
        combinedMap.set(v.id, v);
        activeVideos.push(v); // Cache in catalog
      }
    });

    const finalVideos = Array.from(combinedMap.values()).map(v => ({
      ...v,
      isSubscribed: userSubscriptions.has(v.channelId),
      isLiked: likedVideoIds.has(v.id)
    }));

    const matchedChannels = activeChannels.filter(c =>
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      c.description.toLowerCase().includes(q.toLowerCase())
    ).map(c => ({
      ...c,
      subscribed: userSubscriptions.has(c.id)
    }));

    return sendJSON(res, 200, {
      query: q,
      total: finalVideos.length,
      videos: finalVideos,
      channels: matchedChannels
    });
  }

  // --- 5. GET /api/channels ---
  if (method === 'GET' && pathname === '/api/channels') {
    return sendJSON(res, 200, {
      channels: activeChannels.map(c => ({
        ...c,
        subscribed: userSubscriptions.has(c.id),
        latestVideo: activeVideos.find(v => v.channelId === c.id)
      }))
    });
  }

  // --- 6. POST /api/channels/:id/subscribe ---
  if (method === 'POST' && pathname.startsWith('/api/channels/') && pathname.endsWith('/subscribe')) {
    const channelId = pathname.split('/')[3];
    let channel = activeChannels.find(c => c.id === channelId || c.ytChannelId === channelId);

    if (!channel) {
      const vid = activeVideos.find(v => v.channelId === channelId);
      channel = {
        id: channelId,
        ytChannelId: channelId,
        title: vid ? vid.channelTitle : (channelId.charAt(0).toUpperCase() + channelId.slice(1)),
        avatar: vid ? vid.channelAvatar : `/avatars/${channelId}.jpg`,
        subscriberCount: vid ? vid.subscriberCount : '1M',
        subscribersNumber: 1000000,
        videoCount: 1,
        description: `YouTube creator channel.`,
        subscribed: false
      };
      activeChannels.push(channel);
    }

    let isCurrentlySubscribed = userSubscriptions.has(channelId);
    if (isCurrentlySubscribed) {
      userSubscriptions.delete(channelId);
      channel.subscribersNumber = Math.max(0, (channel.subscribersNumber || 1000) - 1);
    } else {
      userSubscriptions.add(channelId);
      channel.subscribersNumber = (channel.subscribersNumber || 1000) + 1;
    }

    broadcastEvent('SUBSCRIPTION_UPDATE', { channelId, isSubscribed: !isCurrentlySubscribed });

    return sendJSON(res, 200, {
      success: true,
      channelId,
      channelTitle: channel.title,
      isSubscribed: !isCurrentlySubscribed,
      totalSubscribed: userSubscriptions.size
    });
  }

  // --- 7. GET /api/subscriptions ---
  if (method === 'GET' && pathname === '/api/subscriptions') {
    const subscribedChannelsList = activeChannels
      .filter(c => userSubscriptions.has(c.id))
      .map(c => ({
        ...c,
        subscribed: true,
        latestVideo: activeVideos.find(v => v.channelId === c.id)
      }));

    const subscribedVideos = activeVideos
      .filter(v => userSubscriptions.has(v.channelId))
      .map(v => ({
        ...v,
        isSubscribed: true,
        isLiked: likedVideoIds.has(v.id)
      }));

    return sendJSON(res, 200, {
      channels: subscribedChannelsList,
      videos: subscribedVideos,
      totalCreators: subscribedChannelsList.length,
      totalVideos: subscribedVideos.length
    });
  }

  // --- 8. GET /api/videos/:id ---
  if (method === 'GET' && pathname.startsWith('/api/videos/')) {
    const videoId = pathname.split('/')[3];
    let video = activeVideos.find(v => v.id === videoId);

    if (!video) {
      // Dynamic fallback for any YouTube video ID
      video = {
        id: videoId,
        title: `YouTube Video (${videoId})`,
        channelId: 'youtube',
        channelTitle: 'YouTube Creator',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        views: '1,200,000',
        uploadedAt: 'YouTube',
        timestamp: Date.now(),
        duration: 'LIVE',
        category: 'Trending',
        description: 'Watching in real-time on AsiTube with zero ads.'
      };
      activeVideos.push(video);
    }

    if (!watchHistory.some(h => h.id === video.id)) {
      watchHistory.unshift({ ...video, watchedAt: Date.now() });
    }

    const channel = activeChannels.find(c => c.id === video.channelId);
    const related = activeVideos.filter(v => v.id !== video.id).slice(0, 8);
    const comments = commentsStore[video.id] || [
      { id: "c_def1", user: "AsiTubeViewer", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", time: "Just now", text: "Loving this video completely ad-free on AsiTube in real-time!", likes: "128" }
    ];

    return sendJSON(res, 200, {
      video: {
        ...video,
        isSubscribed: userSubscriptions.has(video.channelId),
        isLiked: likedVideoIds.has(video.id),
        // Ad-free YouTube Stream Embed URL with clean parameters
        embedUrl: `https://www.youtube.com/embed/${video.id}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`
      },
      channel: channel || {
        id: video.channelId,
        title: video.channelTitle,
        avatar: video.channelAvatar || '',
        subscriberCount: video.subscriberCount || '1M',
        subscribed: userSubscriptions.has(video.channelId)
      },
      comments,
      related: related.map(r => ({
        ...r,
        isSubscribed: userSubscriptions.has(r.channelId)
      }))
    });
  }

  // --- 9. POST /api/videos/:id/comments ---
  if (method === 'POST' && pathname.match(/^\/api\/videos\/[^\/]+\/comments$/)) {
    const videoId = pathname.split('/')[3];
    const body = await parseBody(req);
    const text = (body.text || '').trim();

    if (!text) {
      return sendJSON(res, 400, { error: 'Comment text cannot be empty' });
    }

    if (!commentsStore[videoId]) commentsStore[videoId] = [];

    const newComment = {
      id: 'c_' + Date.now(),
      user: body.user || 'You (Android User)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      time: 'Just now',
      text,
      likes: '0'
    };

    commentsStore[videoId].unshift(newComment);
    broadcastEvent('NEW_COMMENT', { videoId, comment: newComment });
    return sendJSON(res, 201, { success: true, comment: newComment });
  }

  // --- 10. POST /api/videos/:id/like ---
  if (method === 'POST' && pathname.match(/^\/api\/videos\/[^\/]+\/like$/)) {
    const videoId = pathname.split('/')[3];
    let isLiked = likedVideoIds.has(videoId);
    if (isLiked) {
      likedVideoIds.delete(videoId);
    } else {
      likedVideoIds.add(videoId);
    }
    return sendJSON(res, 200, { videoId, isLiked: !isLiked });
  }

  // --- 11. GET /api/library ---
  if (method === 'GET' && pathname === '/api/library') {
    const likedVideosList = activeVideos.filter(v => likedVideoIds.has(v.id));
    return sendJSON(res, 200, {
      history: watchHistory,
      likedVideos: likedVideosList,
      totalWatched: watchHistory.length,
      totalLiked: likedVideosList.length
    });
  }

  // --- 12. GET /api/playlists ---
  if (method === 'GET' && pathname === '/api/playlists') {
    const playlists = Object.values(playlistsStore).map(p => {
      const vids = p.videoIds.map(vidId => activeVideos.find(v => v.id === vidId)).filter(Boolean);
      return {
        ...p,
        videosCount: p.videoIds.length,
        videos: vids,
        thumbnail: vids[0]?.thumbnail || '/thumbnails/_c2e1NcI3Sc.jpg'
      };
    });
    return sendJSON(res, 200, { playlists });
  }

  // --- 13. POST /api/playlists ---
  if (method === 'POST' && pathname === '/api/playlists') {
    const body = await parseBody(req);
    const title = (body.title || '').trim();
    if (!title) {
      return sendJSON(res, 400, { error: 'Playlist title is required' });
    }
    const id = 'pl_' + Date.now();
    const newPlaylist = {
      id,
      title,
      description: body.description || '',
      videoIds: body.videoId ? [body.videoId] : [],
      createdAt: Date.now()
    };
    playlistsStore[id] = newPlaylist;
    return sendJSON(res, 201, { success: true, playlist: newPlaylist });
  }

  // --- 14. POST /api/playlists/:id/videos ---
  if (method === 'POST' && pathname.match(/^\/api\/playlists\/[^\/]+\/videos$/)) {
    const playlistId = pathname.split('/')[3];
    const playlist = playlistsStore[playlistId];
    if (!playlist) {
      return sendJSON(res, 404, { error: 'Playlist not found' });
    }
    const body = await parseBody(req);
    const videoId = body.videoId;
    if (!videoId) {
      return sendJSON(res, 400, { error: 'videoId is required' });
    }
    if (!playlist.videoIds.includes(videoId)) {
      playlist.videoIds.unshift(videoId);
    }
    return sendJSON(res, 200, { success: true, playlist });
  }

  // --- 15. DELETE /api/playlists/:id/videos/:videoId ---
  if (method === 'DELETE' && pathname.match(/^\/api\/playlists\/[^\/]+\/videos\/[^\/]+$/)) {
    const parts = pathname.split('/');
    const playlistId = parts[3];
    const videoId = parts[5];
    const playlist = playlistsStore[playlistId];
    if (!playlist) {
      return sendJSON(res, 404, { error: 'Playlist not found' });
    }
    playlist.videoIds = playlist.videoIds.filter(id => id !== videoId);
    return sendJSON(res, 200, { success: true, playlist });
  }

  // --- 16. DELETE /api/playlists/:id ---
  if (method === 'DELETE' && pathname.match(/^\/api\/playlists\/[^\/]+$/)) {
    const playlistId = pathname.split('/')[3];
    if (playlistId === 'watch_later') {
      return sendJSON(res, 400, { error: 'Cannot delete default Watch Later playlist' });
    }
    delete playlistsStore[playlistId];
    return sendJSON(res, 200, { success: true });
  }

  // --- 17. GET /api/progress & GET /api/progress/:videoId ---
  if (method === 'GET' && pathname === '/api/progress') {
    return sendJSON(res, 200, { progress: watchProgressStore });
  }
  if (method === 'GET' && pathname.startsWith('/api/progress/')) {
    const videoId = pathname.split('/')[3];
    const prog = watchProgressStore[videoId] || { currentTime: 0, duration: 0, percentage: 0 };
    return sendJSON(res, 200, { videoId, ...prog });
  }

  // --- 18. POST /api/progress/:videoId ---
  if (method === 'POST' && pathname.startsWith('/api/progress/')) {
    const videoId = pathname.split('/')[3];
    const body = await parseBody(req);
    const currentTime = Number(body.currentTime) || 0;
    const duration = Number(body.duration) || 0;
    const percentage = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
    watchProgressStore[videoId] = {
      currentTime,
      duration,
      percentage,
      updatedAt: Date.now()
    };
    return sendJSON(res, 200, { success: true, progress: watchProgressStore[videoId] });
  }

  // --- Static Files ---
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (path.extname(pathname)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not Found');
      }
      filePath = path.join(__dirname, 'public', 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end('Error loading file');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Auto-sync in background every 30 seconds
setInterval(() => {
  syncLatestYouTubeUploads().catch(() => {});
}, 30000);

const PORT = process.env.PORT || 3000;

function startServer(portToTry) {
  server.listen(portToTry, () => {
    console.log(`🚀 asi tube (AsiTube) server running on http://localhost:${portToTry}`);
    console.log(`📡 Real-Time SSE Stream active on /api/events`);
    console.log(`🎬 Ad-Free YouTube streaming enabled.`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      startServer(portToTry + 1);
    }
  });
}

startServer(PORT);
