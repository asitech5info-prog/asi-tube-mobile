/**
 * ASI TUBE (AsiTube) - Frontend Application Logic
 * Ad-Free YouTube with Real-Time Sync, Subscriptions, Playlists & Playback Resume
 */

const state = {
  currentView: 'home',
  activeCategory: 'All',
  selectedCreatorId: null,
  currentVideo: null,
  videos: [],
  channels: [],
  subscriptions: new Set(),
  likedVideos: new Set(),
  playlists: [],
  currentPlaylist: null,
  watchProgress: {},
  searchQuery: '',
  isSyncing: false,
  lastSyncTime: Date.now(),
  notifications: [],
  activeSaveVideoId: null,
  watchTrackerInterval: null,
  currentWatchSeconds: 0
};

// DOM Elements
const dom = {
  homeView: document.getElementById('homeView'),
  subscriptionsView: document.getElementById('subscriptionsView'),
  trendingView: document.getElementById('trendingView'),
  libraryView: document.getElementById('libraryView'),
  playlistDetailView: document.getElementById('playlistDetailView'),
  
  videoGrid: document.getElementById('videoGrid'),
  subscriptionsVideoGrid: document.getElementById('subscriptionsVideoGrid'),
  trendingVideoGrid: document.getElementById('trendingVideoGrid'),
  historyVideoGrid: document.getElementById('historyVideoGrid'),
  likedVideoGrid: document.getElementById('likedVideoGrid'),
  playlistsGrid: document.getElementById('playlistsGrid'),
  creatorStoriesBar: document.getElementById('creatorStoriesBar'),
  sidebarSubscriptionsList: document.getElementById('sidebarSubscriptionsList'),
  
  categoryPills: document.getElementById('categoryPills'),
  syncBtn: document.getElementById('syncBtn'),
  syncIcon: document.getElementById('syncIcon'),
  syncDotMini: document.getElementById('syncDotMini'),
  videoCountBadge: document.getElementById('videoCountBadge'),
  sidebarSubCount: document.getElementById('sidebarSubCount'),
  bnavSubBadge: document.getElementById('bnavSubBadge'),
  
  notifBtn: document.getElementById('notifBtn'),
  notifBadge: document.getElementById('notifBadge'),
  notifDropdown: document.getElementById('notifDropdown'),
  notifDropdownList: document.getElementById('notifDropdownList'),
  notifClearBtn: document.getElementById('notifClearBtn'),
  
  searchInput: document.getElementById('searchInput'),
  searchSubmitBtn: document.getElementById('searchSubmitBtn'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  mobileSearchTrigger: document.getElementById('mobileSearchTrigger'),
  searchBackBtn: document.getElementById('searchBackBtn'),
  searchContainer: document.getElementById('searchContainer'),
  voiceSearchBtn: document.getElementById('voiceSearchBtn'),
  
  playerOverlay: document.getElementById('playerOverlay'),
  playerCloseBtn: document.getElementById('playerCloseBtn'),
  videoIframe: document.getElementById('videoIframe'),
  playerVideoTitle: document.getElementById('playerVideoTitle'),
  playerVideoViews: document.getElementById('playerVideoViews'),
  playerVideoUploaded: document.getElementById('playerVideoUploaded'),
  playerVideoCategory: document.getElementById('playerVideoCategory'),
  playerLikesCount: document.getElementById('playerLikesCount'),
  playerLikeBtn: document.getElementById('playerLikeBtn'),
  playerDislikeBtn: document.getElementById('playerDislikeBtn'),
  playerChannelAvatar: document.getElementById('playerChannelAvatar'),
  playerChannelName: document.getElementById('playerChannelName'),
  playerChannelSubs: document.getElementById('playerChannelSubs'),
  playerSubscribeBtn: document.getElementById('playerSubscribeBtn'),
  playerDescription: document.getElementById('playerDescription'),
  descToggleBtn: document.getElementById('descToggleBtn'),
  commentsCount: document.getElementById('commentsCount'),
  commentsList: document.getElementById('commentsList'),
  commentInput: document.getElementById('commentInput'),
  postCommentBtn: document.getElementById('postCommentBtn'),
  relatedVideosList: document.getElementById('relatedVideosList'),
  playerDownloadBtn: document.getElementById('playerDownloadBtn'),
  
  activeCreatorFilterBadge: document.getElementById('activeCreatorFilterBadge'),
  filterCreatorName: document.getElementById('filterCreatorName'),
  clearCreatorFilter: document.getElementById('clearCreatorFilter'),
  subsFeedTitle: document.getElementById('subsFeedTitle'),
  manageSubsBtn: document.getElementById('manageSubsBtn'),

  // Manage Subscriptions Modal
  manageSubsModal: document.getElementById('manageSubsModal'),
  closeManageSubsBtn: document.getElementById('closeManageSubsBtn'),
  doneManageSubsBtn: document.getElementById('doneManageSubsBtn'),
  manageSubsSearchInput: document.getElementById('manageSubsSearchInput'),
  manageSubsList: document.getElementById('manageSubsList'),
  modalSubCount: document.getElementById('modalSubCount'),

  // Playlist Modals & Detail
  playlistModal: document.getElementById('playlistModal'),
  closePlaylistModalBtn: document.getElementById('closePlaylistModalBtn'),
  playlistCheckboxList: document.getElementById('playlistCheckboxList'),
  newPlaylistInput: document.getElementById('newPlaylistInput'),
  createPlaylistSubmitBtn: document.getElementById('createPlaylistSubmitBtn'),
  newPlaylistBtn: document.getElementById('newPlaylistBtn'),
  
  playlistBackBtn: document.getElementById('playlistBackBtn'),
  playlistDetailCover: document.getElementById('playlistDetailCover'),
  playlistDetailTitle: document.getElementById('playlistDetailTitle'),
  playlistDetailDesc: document.getElementById('playlistDetailDesc'),
  playlistDetailCount: document.getElementById('playlistDetailCount'),
  playlistPlayAllBtn: document.getElementById('playlistPlayAllBtn'),
  playlistDeleteBtn: document.getElementById('playlistDeleteBtn'),
  playlistVideosGrid: document.getElementById('playlistVideosGrid'),

  // Resume toast
  resumeToast: document.getElementById('resumeToast'),
  resumeToastText: document.getElementById('resumeToastText'),
  resumeRestartBtn: document.getElementById('resumeRestartBtn'),

  brandHomeBtn: document.getElementById('brandHomeBtn')
};

// Helper: Channel Avatar & SVG Fallbacks
function getChannelAvatar(channelId, avatarUrl, channelTitle) {
  const localAvatars = {
    'mrbeast': 'avatars/mrbeast.jpg',
    'mkbhd': 'avatars/mkbhd.jpg',
    'fireship': 'avatars/fireship.jpg',
    'rockstargames': 'avatars/rockstargames.jpg',
    'veritasium': 'avatars/veritasium.jpg',
    'kurzgesagt': 'avatars/kurzgesagt.jpg',
    'lofigirl': 'avatars/lofigirl.jpg',
    'pewdiepie': 'avatars/pewdiepie.jpg'
  };
  if (channelId && localAvatars[channelId]) {
    return localAvatars[channelId];
  }
  if (avatarUrl && !avatarUrl.includes('AIdro_n8-W7zGg') && !avatarUrl.startsWith('data:image/svg') === false) {
    return avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl;
  }
  return getSvgAvatarDataUrl(channelTitle || channelId || 'YouTube');
}

function getThumbnailUrl(video) {
  if (!video) return 'thumbnails/_c2e1NcI3Sc.jpg';
  let t = video.thumbnail || `thumbnails/${video.id}.jpg`;
  if (typeof t === 'string' && t.startsWith('/thumbnails/')) {
    t = t.slice(1);
  }
  return t;
}

function getSvgAvatarDataUrl(name) {
  const initial = (name || 'Y').trim().charAt(0).toUpperCase();
  const colors = ['#e62117', '#065fd4', '#0f9d58', '#9c27b0', '#ff5722', '#009688', '#3f51b5', '#673ab7'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="68" height="68" viewBox="0 0 68 68"><circle cx="34" cy="34" r="34" fill="${color}"/><text x="50%" y="54%" font-family="Roboto, Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Convert MM:SS or seconds to formatted string
function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function parseDurationToSeconds(durationStr) {
  if (!durationStr || durationStr === 'LIVE' || durationStr === 'NEW') return 600;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 600;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initStorageState();
  initEventListeners();
  initRealTimeSSE();
  loadChannels();
  loadVideos();
  loadPlaylists();
});

// Load saved subscriptions, likes, history, playlists and watch progress from LocalStorage
function initStorageState() {
  try {
    const savedSubs = localStorage.getItem('asitube_subscriptions');
    if (savedSubs) {
      const arr = JSON.parse(savedSubs);
      state.subscriptions = new Set(arr);
    }
  } catch (e) {}

  try {
    const savedLikes = localStorage.getItem('asitube_liked_videos');
    if (savedLikes) {
      state.likedVideos = new Set(JSON.parse(savedLikes));
    }
  } catch (e) {}

  try {
    const savedHistory = localStorage.getItem('asitube_watch_history');
    if (savedHistory) {
      state.watchHistory = JSON.parse(savedHistory);
    } else {
      state.watchHistory = [];
    }
  } catch (e) {}

  try {
    const savedProgress = localStorage.getItem('asitube_watch_progress');
    if (savedProgress) {
      state.watchProgress = JSON.parse(savedProgress);
    }
  } catch (e) {}
}

function persistSubscriptions() {
  try {
    localStorage.setItem('asitube_subscriptions', JSON.stringify([...state.subscriptions]));
  } catch (e) {}
}

function persistLikes() {
  try {
    localStorage.setItem('asitube_liked_videos', JSON.stringify([...state.likedVideos]));
  } catch (e) {}
}

function persistHistory() {
  try {
    localStorage.setItem('asitube_watch_history', JSON.stringify(state.watchHistory));
  } catch (e) {}
}

function persistPlaylists() {
  try {
    localStorage.setItem('asitube_playlists', JSON.stringify(state.playlists));
  } catch (e) {}
}

function persistWatchProgress() {
  try {
    localStorage.setItem('asitube_watch_progress', JSON.stringify(state.watchProgress));
  } catch (e) {}
}

// Real-Time Server-Sent Events (SSE) Stream
function initRealTimeSSE() {
  try {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      if (dom.syncDotMini) {
        dom.syncDotMini.style.backgroundColor = 'var(--yt-green)';
        dom.syncDotMini.style.boxShadow = '0 0 6px var(--yt-green)';
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_UPLOAD' && payload.data) {
          handleIncomingLiveUpload(payload.data);
        } else if (payload.type === 'NEW_COMMENT' && payload.data) {
          handleIncomingLiveComment(payload.data);
        } else if (payload.type === 'SUBSCRIPTION_UPDATE' && payload.data) {
          if (payload.data.isSubscribed) {
            state.subscriptions.add(payload.data.channelId);
          } else {
            state.subscriptions.delete(payload.data.channelId);
          }
          persistSubscriptions();
          updateSubscriptionCounters();
        }
      } catch (e) {
        console.error('Error parsing SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      if (dom.syncDotMini) {
        dom.syncDotMini.style.backgroundColor = '#ffaa00';
        dom.syncDotMini.style.boxShadow = 'none';
      }
    };
  } catch (err) {
    console.error('SSE initialization error:', err);
  }
}

// Handle Real-Time incoming YouTube video upload
function handleIncomingLiveUpload(newVideo) {
  if (!state.videos.some(v => v.id === newVideo.id)) {
    state.videos.unshift(newVideo);
  }

  addNotification(newVideo);

  if (state.currentView === 'subscriptions') {
    loadSubscriptionsFeed();
  } else if (state.currentView === 'home') {
    renderVideoGrid(dom.videoGrid, state.videos);
  }
}

// Add notification to dropdown
function addNotification(video) {
  state.notifications.unshift(video);

  if (dom.notifBadge) {
    dom.notifBadge.style.display = 'block';
  }

  renderNotifications();
}

function renderNotifications() {
  if (!dom.notifDropdownList) return;

  if (state.notifications.length === 0) {
    dom.notifDropdownList.innerHTML = '<p class="notif-empty">No new notifications</p>';
    return;
  }

  dom.notifDropdownList.innerHTML = '';
  state.notifications.forEach(item => {
    const el = document.createElement('div');
    el.className = 'notif-item';
    const thumb = item.thumbnail || `/thumbnails/${item.id}.jpg` || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
    el.innerHTML = `
      <img src="${thumb}" class="notif-item-thumb" alt="${item.title}" onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${item.id}/hqdefault.jpg'">
      <div class="notif-item-body">
        <h5 class="notif-item-title">${item.title}</h5>
        <p class="notif-item-creator">${item.channelTitle} • Just now</p>
      </div>
    `;
    el.addEventListener('click', () => {
      if (dom.notifDropdown) dom.notifDropdown.style.display = 'none';
      openPlayer(item.id);
    });
    dom.notifDropdownList.appendChild(el);
  });
}

// Handle Real-Time incoming comment
function handleIncomingLiveComment({ videoId, comment }) {
  if (state.currentVideo && state.currentVideo.id === videoId && dom.commentsList) {
    const newCommentHTML = `
      <div class="comment-item" style="animation: fadeIn 0.3s ease;">
        <div class="account-pfp small">A</div>
        <div>
          <div class="comment-header">
            <span class="comment-author">${comment.user}</span>
            <span class="comment-time">${comment.time}</span>
          </div>
          <div class="comment-text">${comment.text}</div>
        </div>
      </div>
    `;
    dom.commentsList.insertAdjacentHTML('afterbegin', newCommentHTML);
    if (dom.commentsCount) {
      dom.commentsCount.textContent = `(${dom.commentsList.children.length})`;
    }
  }
}

// Event Listeners Initialization
function initEventListeners() {
  document.querySelectorAll('[data-view]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.preventDefault();
      const view = elem.getAttribute('data-view');
      switchView(view);
    });
  });

  if (dom.brandHomeBtn) {
    dom.brandHomeBtn.addEventListener('click', () => {
      state.searchQuery = '';
      if (dom.searchInput) dom.searchInput.value = '';
      switchView('home');
      loadVideos();
    });
  }

  // Category Filter Pills
  if (dom.categoryPills) {
    dom.categoryPills.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        dom.categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeCategory = pill.getAttribute('data-category');
        loadVideos();
      });
    });
  }

  // Small Sync Button in Header
  if (dom.syncBtn) dom.syncBtn.addEventListener('click', triggerSync);

  // Notification Button Toggle
  if (dom.notifBtn && dom.notifDropdown) {
    dom.notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dom.notifDropdown.style.display === 'block';
      dom.notifDropdown.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && dom.notifBadge) {
        dom.notifBadge.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!dom.notifDropdown.contains(e.target) && e.target !== dom.notifBtn) {
        dom.notifDropdown.style.display = 'none';
      }
    });
  }

  if (dom.notifClearBtn) {
    dom.notifClearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.notifications = [];
      renderNotifications();
      if (dom.notifBadge) dom.notifBadge.style.display = 'none';
    });
  }

  // Search
  if (dom.searchSubmitBtn && dom.searchInput) {
    dom.searchSubmitBtn.addEventListener('click', handleSearch);
    dom.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
    dom.searchInput.addEventListener('input', () => {
      if (dom.clearSearchBtn) {
        dom.clearSearchBtn.style.display = dom.searchInput.value ? 'flex' : 'none';
      }
    });
  }

  if (dom.clearSearchBtn) {
    dom.clearSearchBtn.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.clearSearchBtn.style.display = 'none';
      state.searchQuery = '';
      loadVideos();
    });
  }

  // Mobile Search trigger
  if (dom.mobileSearchTrigger && dom.searchContainer) {
    dom.mobileSearchTrigger.addEventListener('click', () => {
      dom.searchContainer.classList.add('mobile-active');
      if (dom.searchInput) dom.searchInput.focus();
    });
  }

  if (dom.searchBackBtn && dom.searchContainer) {
    dom.searchBackBtn.addEventListener('click', () => {
      dom.searchContainer.classList.remove('mobile-active');
      dom.searchInput.value = '';
      state.searchQuery = '';
      loadVideos();
    });
  }

  if (dom.voiceSearchBtn) {
    dom.voiceSearchBtn.addEventListener('click', () => {
      alert("🎙️ AsiTube Voice Search is listening... Speak any video title or creator name.");
    });
  }

  // Player controls
  if (dom.playerCloseBtn) dom.playerCloseBtn.addEventListener('click', closePlayer);
  if (dom.playerLikeBtn) dom.playerLikeBtn.addEventListener('click', handleLikeCurrentVideo);

  if (dom.playerSubscribeBtn) {
    dom.playerSubscribeBtn.addEventListener('click', () => {
      if (state.currentVideo) {
        toggleSubscription(state.currentVideo.channelId);
      }
    });
  }

  // Save to Playlist button in video player
  if (dom.playerDownloadBtn) {
    dom.playerDownloadBtn.addEventListener('click', () => {
      if (state.currentVideo) {
        openPlaylistModal(state.currentVideo.id);
      }
    });
  }

  if (dom.descToggleBtn && dom.playerDescription) {
    dom.descToggleBtn.addEventListener('click', () => {
      const isExpanded = dom.playerDescription.classList.toggle('expanded');
      dom.descToggleBtn.textContent = isExpanded ? 'Show less' : 'Show more';
    });
  }

  // Comment post
  if (dom.postCommentBtn && dom.commentInput) {
    dom.postCommentBtn.addEventListener('click', postComment);
    dom.commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') postComment();
    });
  }

  // Subscriptions & Manage Subscriptions
  if (dom.manageSubsBtn) {
    dom.manageSubsBtn.addEventListener('click', openManageSubsModal);
  }
  if (dom.closeManageSubsBtn) {
    dom.closeManageSubsBtn.addEventListener('click', closeManageSubsModal);
  }
  if (dom.doneManageSubsBtn) {
    dom.doneManageSubsBtn.addEventListener('click', closeManageSubsModal);
  }
  if (dom.manageSubsSearchInput) {
    dom.manageSubsSearchInput.addEventListener('input', () => {
      renderManageSubsList(dom.manageSubsSearchInput.value.trim().toLowerCase());
    });
  }

  // Clear creator filter in Subscriptions
  if (dom.clearCreatorFilter) {
    dom.clearCreatorFilter.addEventListener('click', () => {
      state.selectedCreatorId = null;
      dom.activeCreatorFilterBadge.style.display = 'none';
      dom.subsFeedTitle.textContent = 'Latest from All Subscribed Channels';
      renderCreatorStories();
      loadSubscriptionsFeed();
    });
  }

  // Playlist Modals & Handlers
  if (dom.newPlaylistBtn) {
    dom.newPlaylistBtn.addEventListener('click', () => {
      openPlaylistModal(null);
    });
  }
  if (dom.closePlaylistModalBtn) {
    dom.closePlaylistModalBtn.addEventListener('click', closePlaylistModal);
  }
  if (dom.createPlaylistSubmitBtn) {
    dom.createPlaylistSubmitBtn.addEventListener('click', handleCreatePlaylistSubmit);
  }
  if (dom.newPlaylistInput) {
    dom.newPlaylistInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCreatePlaylistSubmit();
    });
  }

  if (dom.playlistBackBtn) {
    dom.playlistBackBtn.addEventListener('click', () => {
      switchView('library');
    });
  }

  if (dom.playlistPlayAllBtn) {
    dom.playlistPlayAllBtn.addEventListener('click', () => {
      if (state.currentPlaylist && state.currentPlaylist.videoIds && state.currentPlaylist.videoIds.length > 0) {
        openPlayer(state.currentPlaylist.videoIds[0]);
      }
    });
  }

  if (dom.playlistDeleteBtn) {
    dom.playlistDeleteBtn.addEventListener('click', handleDeleteCurrentPlaylist);
  }

  // Resume restart button
  if (dom.resumeRestartBtn) {
    dom.resumeRestartBtn.addEventListener('click', () => {
      if (state.currentVideo) {
        saveWatchProgress(state.currentVideo.id, 0, parseDurationToSeconds(state.currentVideo.duration));
        if (dom.videoIframe) {
          dom.videoIframe.src = `https://www.youtube.com/embed/${state.currentVideo.id}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&start=0`;
        }
        if (dom.resumeToast) dom.resumeToast.style.display = 'none';
      }
    });
  }
}

// Switch between views
function switchView(viewName) {
  state.currentView = viewName;

  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  const targetView = document.getElementById(`${viewName}View`);
  if (targetView) targetView.classList.add('active');

  document.querySelectorAll('.bnav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === viewName);
  });
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === viewName);
  });

  if (viewName === 'subscriptions') {
    renderCreatorStories();
    loadSubscriptionsFeed();
  } else if (viewName === 'trending') {
    loadTrendingVideos();
  } else if (viewName === 'library') {
    loadLibrary();
  } else if (viewName === 'home') {
    loadVideos();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fetch channels & user subscriptions
async function loadChannels() {
  try {
    const res = await fetch('/api/channels');
    if (res.ok) {
      const data = await res.json();
      state.channels = data.channels || [];
    } else {
      throw new Error('Server not reachable');
    }
  } catch (err) {
    if (window.ASI_DATA && window.ASI_DATA.channels) {
      state.channels = JSON.parse(JSON.stringify(window.ASI_DATA.channels));
    }
  }
    
  // Merge channels with local storage subscriptions
  if (state.subscriptions.size === 0 && state.channels.length > 0) {
    state.subscriptions = new Set(state.channels.filter(c => c.subscribed).map(c => c.id));
    persistSubscriptions();
  } else {
    // Sync local subscriptions into channel objects
    state.channels.forEach(c => {
      c.subscribed = state.subscriptions.has(c.id);
    });
  }

  updateSubscriptionCounters();
  renderSidebarSubscriptions();
  renderCreatorStories();
}

function updateSubscriptionCounters() {
  const count = state.subscriptions.size;
  if (dom.sidebarSubCount) dom.sidebarSubCount.textContent = count;
  if (dom.bnavSubBadge) dom.bnavSubBadge.textContent = count;
  if (dom.modalSubCount) dom.modalSubCount.textContent = `${count} channels`;
}

// Render sidebar subscription list with real channel profile pictures
function renderSidebarSubscriptions() {
  if (!dom.sidebarSubscriptionsList) return;
  dom.sidebarSubscriptionsList.innerHTML = '';

  const subscribedList = state.channels.filter(c => state.subscriptions.has(c.id));
  if (subscribedList.length === 0) {
    dom.sidebarSubscriptionsList.innerHTML = '<p style="font-size: 11px; color: #717171; padding: 4px 12px;">No subscriptions yet</p>';
    return;
  }

  subscribedList.forEach(channel => {
    const item = document.createElement('div');
    item.className = 'sidebar-sub-item';
    const avatar = getChannelAvatar(channel.id, channel.avatar, channel.title);
    const svgFallback = getSvgAvatarDataUrl(channel.title);
    item.innerHTML = `
      <img src="${avatar}" class="sidebar-sub-avatar" alt="${channel.title}" onerror="this.onerror=null; this.src='${svgFallback}'">
      <span class="sidebar-sub-name">${channel.title}</span>
      <span class="sidebar-sub-dot"></span>
    `;
    item.addEventListener('click', () => {
      state.selectedCreatorId = channel.id;
      switchView('subscriptions');
    });
    dom.sidebarSubscriptionsList.appendChild(item);
  });
}

// Render Creator Stories with real channel profile pictures
function renderCreatorStories() {
  if (!dom.creatorStoriesBar) return;
  dom.creatorStoriesBar.innerHTML = '';

  const subscribedList = state.channels.filter(c => state.subscriptions.has(c.id));

  const allItem = document.createElement('div');
  allItem.className = `creator-story-item ${state.selectedCreatorId === null ? 'active' : ''}`;
  allItem.innerHTML = `
    <div class="creator-avatar-ring all-avatar">
      <div style="width: 100%; height: 100%; border-radius: 50%; background: #212121; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; color: #fff;">
        ALL
      </div>
    </div>
    <span class="creator-story-name">All</span>
  `;
  allItem.addEventListener('click', () => {
    state.selectedCreatorId = null;
    if (dom.activeCreatorFilterBadge) dom.activeCreatorFilterBadge.style.display = 'none';
    if (dom.subsFeedTitle) dom.subsFeedTitle.textContent = 'Latest from All Subscribed Channels';
    renderCreatorStories();
    loadSubscriptionsFeed();
  });
  dom.creatorStoriesBar.appendChild(allItem);

  subscribedList.forEach(channel => {
    const isSelected = state.selectedCreatorId === channel.id;
    const item = document.createElement('div');
    item.className = `creator-story-item ${isSelected ? 'active' : ''}`;
    const avatar = getChannelAvatar(channel.id, channel.avatar, channel.title);
    const svgFallback = getSvgAvatarDataUrl(channel.title);
    item.innerHTML = `
      <div class="creator-avatar-ring">
        <img src="${avatar}" class="creator-avatar-img" alt="${channel.title}" onerror="this.onerror=null; this.src='${svgFallback}'">
        <span class="story-unread-dot"></span>
      </div>
      <span class="creator-story-name">${channel.title}</span>
    `;
    item.addEventListener('click', () => {
      state.selectedCreatorId = channel.id;
      if (dom.activeCreatorFilterBadge) {
        dom.activeCreatorFilterBadge.style.display = 'inline-flex';
        dom.filterCreatorName.textContent = channel.title;
      }
      if (dom.subsFeedTitle) dom.subsFeedTitle.textContent = `Uploads by ${channel.title}`;
      renderCreatorStories();
      loadSubscriptionsFeed();
    });
    dom.creatorStoriesBar.appendChild(item);
  });
}

// Toggle Subscription
async function toggleSubscription(channelId) {
  if (!channelId) return;

  const isCurrentlySubscribed = state.subscriptions.has(channelId);
  const nextSubscribed = !isCurrentlySubscribed;

  // Immediate optimistic update
  if (nextSubscribed) {
    state.subscriptions.add(channelId);
  } else {
    state.subscriptions.delete(channelId);
    if (state.selectedCreatorId === channelId) {
      state.selectedCreatorId = null;
    }
  }

  persistSubscriptions();
  updateSubscriptionCounters();
  renderSidebarSubscriptions();
  renderCreatorStories();

  if (state.currentVideo && (state.currentVideo.channelId === channelId || state.currentVideo.channelTitle === channelId)) {
    updatePlayerSubscribeButton(nextSubscribed);
  }

  updateCardSubscribeButtons(channelId, nextSubscribed);

  if (dom.manageSubsModal && dom.manageSubsModal.style.display === 'flex') {
    renderManageSubsList(dom.manageSubsSearchInput?.value.trim().toLowerCase() || '');
  }

  if (state.currentView === 'subscriptions') {
    loadSubscriptionsFeed();
  }

  try {
    await fetch(`/api/channels/${encodeURIComponent(channelId)}/subscribe`, { method: 'POST' });
  } catch (err) {
    console.error('Error toggling subscription:', err);
  }
}

function updatePlayerSubscribeButton(isSubscribed) {
  if (!dom.playerSubscribeBtn) return;
  if (isSubscribed) {
    dom.playerSubscribeBtn.classList.add('subscribed');
    dom.playerSubscribeBtn.textContent = 'Subscribed';
  } else {
    dom.playerSubscribeBtn.classList.remove('subscribed');
    dom.playerSubscribeBtn.textContent = 'Subscribe';
  }
}

function updateCardSubscribeButtons(channelId, isSubscribed) {
  document.querySelectorAll(`.card-quick-sub[data-channel="${channelId}"]`).forEach(btn => {
    btn.classList.toggle('subscribed', isSubscribed);
    btn.textContent = isSubscribed ? 'Subscribed' : 'Subscribe';
  });
}

// Manage Subscriptions Modal
function openManageSubsModal() {
  if (!dom.manageSubsModal) return;
  dom.manageSubsModal.style.display = 'flex';
  if (dom.manageSubsSearchInput) dom.manageSubsSearchInput.value = '';
  renderManageSubsList('');
}

function closeManageSubsModal() {
  if (!dom.manageSubsModal) return;
  dom.manageSubsModal.style.display = 'none';
}

function renderManageSubsList(filterQuery = '') {
  if (!dom.manageSubsList) return;
  dom.manageSubsList.innerHTML = '';

  const allChannels = [...state.channels];
  // Add any channels currently subscribed that might not be in initial channels
  state.subscriptions.forEach(subId => {
    if (!allChannels.some(c => c.id === subId)) {
      allChannels.push({
        id: subId,
        title: subId.charAt(0).toUpperCase() + subId.slice(1),
        avatar: `/avatars/${subId}.jpg`,
        subscriberCount: '1M',
        subscribed: true
      });
    }
  });

  const filtered = allChannels.filter(c => {
    if (!filterQuery) return true;
    return (c.title || '').toLowerCase().includes(filterQuery);
  });

  if (filtered.length === 0) {
    dom.manageSubsList.innerHTML = '<p style="text-align: center; color: #888; padding: 24px;">No channels found.</p>';
    return;
  }

  filtered.forEach(channel => {
    const isSubscribed = state.subscriptions.has(channel.id);
    const row = document.createElement('div');
    row.className = 'manage-sub-row';
    const avatar = getChannelAvatar(channel.id, channel.avatar, channel.title);
    const svgFallback = getSvgAvatarDataUrl(channel.title);

    row.innerHTML = `
      <div class="manage-sub-info">
        <img src="${avatar}" class="manage-sub-avatar" alt="${channel.title}" onerror="this.onerror=null; this.src='${svgFallback}'">
        <div>
          <div class="manage-sub-name">${channel.title}</div>
          <div class="manage-sub-subs">${channel.subscriberCount || '1M'} subscribers</div>
        </div>
      </div>
      <button class="manage-sub-btn ${isSubscribed ? 'subscribed' : ''}" data-id="${channel.id}">
        ${isSubscribed ? 'Subscribed' : 'Subscribe'}
      </button>
    `;

    row.querySelector('.manage-sub-btn').addEventListener('click', () => {
      toggleSubscription(channel.id);
    });

    dom.manageSubsList.appendChild(row);
  });
}

// Watch Progress Tracker & Resume Playback
function getWatchProgress(videoId) {
  return state.watchProgress[videoId] || null;
}

function saveWatchProgress(videoId, currentTime, duration) {
  if (!videoId) return;
  const percentage = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
  state.watchProgress[videoId] = {
    currentTime: Math.floor(currentTime),
    duration: Math.floor(duration),
    percentage,
    updatedAt: Date.now()
  };
  persistWatchProgress();

  // Send to backend
  fetch(`/api/progress/${encodeURIComponent(videoId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentTime, duration, percentage })
  }).catch(() => {});

  // Update red progress bar on existing video cards
  document.querySelectorAll(`.video-card[data-id="${videoId}"] .watch-progress-fill`).forEach(bar => {
    bar.style.width = `${percentage}%`;
  });
}

// Start interval to track watch time while player is open
function startWatchTracker(videoId, durationSeconds) {
  stopWatchTracker();
  state.currentWatchSeconds = state.watchProgress[videoId]?.currentTime || 0;

  state.watchTrackerInterval = setInterval(() => {
    state.currentWatchSeconds += 2;
    if (state.currentWatchSeconds >= durationSeconds) {
      state.currentWatchSeconds = durationSeconds;
      stopWatchTracker();
    }
    saveWatchProgress(videoId, state.currentWatchSeconds, durationSeconds);
  }, 2000);
}

function stopWatchTracker() {
  if (state.watchTrackerInterval) {
    clearInterval(state.watchTrackerInterval);
    state.watchTrackerInterval = null;
  }
}

// Load Videos for Home Feed
async function loadVideos() {
  try {
    let url = `/api/videos?category=${encodeURIComponent(state.activeCategory)}`;
    if (state.searchQuery) {
      url = `/api/search?q=${encodeURIComponent(state.searchQuery)}`;
    }
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      state.videos = data.videos || [];
    } else {
      throw new Error('Offline fallback');
    }
  } catch (err) {
    if (window.ASI_DATA && window.ASI_DATA.initialVideos) {
      let vids = JSON.parse(JSON.stringify(window.ASI_DATA.initialVideos));
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        vids = vids.filter(v =>
          (v.title && v.title.toLowerCase().includes(q)) ||
          (v.channelTitle && v.channelTitle.toLowerCase().includes(q)) ||
          (v.tags && v.tags.some(t => t.toLowerCase().includes(q)))
        );
      } else if (state.activeCategory && state.activeCategory !== 'All') {
        if (state.activeCategory === 'Recently Uploaded') {
          vids = vids.sort((a, b) => b.timestamp - a.timestamp);
        } else {
          vids = vids.filter(v => v.category?.toLowerCase() === state.activeCategory.toLowerCase() || (v.tags && v.tags.some(t => t.toLowerCase() === state.activeCategory.toLowerCase())));
        }
      }
      state.videos = vids;
    }
  }

  if (dom.videoCountBadge) {
    dom.videoCountBadge.textContent = `${state.videos.length} videos`;
  }

  renderVideoGrid(dom.videoGrid, state.videos);
}

// Load Subscriptions Feed
async function loadSubscriptionsFeed() {
  if (!dom.subscriptionsVideoGrid) return;
  let subsVideos = [];
  try {
    let url = '/api/subscriptions';
    if (state.selectedCreatorId) {
      url = `/api/videos?channelId=${encodeURIComponent(state.selectedCreatorId)}`;
    }
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      subsVideos = data.videos || [];
    } else {
      throw new Error('Offline fallback');
    }
  } catch (err) {
    const all = state.videos.length > 0 ? state.videos : (window.ASI_DATA?.initialVideos || []);
    if (state.selectedCreatorId) {
      subsVideos = all.filter(v => v.channelId === state.selectedCreatorId);
    } else {
      subsVideos = all.filter(v => state.subscriptions.has(v.channelId));
    }
  }

  if (!state.selectedCreatorId && subsVideos.length > 0) {
    subsVideos = subsVideos.filter(v => state.subscriptions.has(v.channelId));
  }

  if (subsVideos.length === 0) {
    dom.subscriptionsVideoGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.03); border-radius: 14px;">
        <h3 style="margin-bottom: 8px;">No uploads found from subscribed channels</h3>
        <p style="color: #aaa; font-size: 14px; margin-bottom: 16px;">Subscribe to creators to see their newest videos here!</p>
        <button class="btn-primary-action" onclick="state.activeCategory='All'; switchView('home');">Explore Creators</button>
      </div>
    `;
    return;
  }

  renderVideoGrid(dom.subscriptionsVideoGrid, subsVideos);
}

// Load Trending Videos
async function loadTrendingVideos() {
  if (!dom.trendingVideoGrid) return;
  let trending = [];
  try {
    const res = await fetch('/api/videos?category=Trending');
    if (res.ok) {
      const data = await res.json();
      trending = data.videos || [];
    } else {
      throw new Error('Offline fallback');
    }
  } catch (err) {
    const all = state.videos.length > 0 ? state.videos : (window.ASI_DATA?.initialVideos || []);
    trending = all.filter(v => v.category === 'Trending' || (v.tags && v.tags.includes('Trending')));
  }
  renderVideoGrid(dom.trendingVideoGrid, trending);
}

// Load Library (History, Liked Videos, Playlists)
async function loadLibrary() {
  let historyList = [];
  let likedList = [];

  try {
    const res = await fetch('/api/library');
    if (res.ok) {
      const data = await res.json();
      historyList = data.history || [];
      likedList = data.likedVideos || [];
    } else {
      throw new Error('Offline fallback');
    }
  } catch (err) {
    const all = state.videos.length > 0 ? state.videos : (window.ASI_DATA?.initialVideos || []);
    historyList = (state.watchHistory || []).map(id => all.find(v => v.id === id)).filter(Boolean);
    likedList = [...state.likedVideos].map(id => all.find(v => v.id === id)).filter(Boolean);
  }

  if (dom.historyVideoGrid) {
    if (historyList && historyList.length > 0) {
      renderVideoGrid(dom.historyVideoGrid, historyList);
    } else {
      dom.historyVideoGrid.innerHTML = '<p class="empty-msg">No videos watched yet.</p>';
    }
  }

  if (dom.likedVideoGrid) {
    if (likedList && likedList.length > 0) {
      renderVideoGrid(dom.likedVideoGrid, likedList);
    } else {
      dom.likedVideoGrid.innerHTML = '<p class="empty-msg">No liked videos yet.</p>';
    }
  }

  renderPlaylistsGrid();
}

// Load Playlists from server / local storage
async function loadPlaylists() {
  try {
    const res = await fetch('/api/playlists');
    if (res.ok) {
      const data = await res.json();
      state.playlists = data.playlists || [];
    } else {
      throw new Error('Offline fallback');
    }
  } catch (err) {
    const saved = localStorage.getItem('asitube_playlists');
    if (saved) {
      state.playlists = JSON.parse(saved);
    } else {
      state.playlists = [
        {
          id: 'watch_later',
          title: 'Watch Later',
          description: 'Videos saved to watch later',
          videoIds: ['_c2e1NcI3Sc', 'QdBZY2fkU-0'],
          createdAt: Date.now() - 3600000
        }
      ];
      persistPlaylists();
    }
  }
  renderPlaylistsGrid();
}

// Render Playlists in Library View
function renderPlaylistsGrid() {
  if (!dom.playlistsGrid) return;
  dom.playlistsGrid.innerHTML = '';

  if (state.playlists.length === 0) {
    dom.playlistsGrid.innerHTML = '<p class="empty-msg">No playlists created yet.</p>';
    return;
  }

  state.playlists.forEach(pl => {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    const cover = pl.thumbnail || (pl.videos && pl.videos[0]?.thumbnail) || '/thumbnails/_c2e1NcI3Sc.jpg';
    const count = pl.videoIds ? pl.videoIds.length : (pl.videosCount || 0);

    card.innerHTML = `
      <div class="playlist-cover-box">
        <img class="playlist-cover-img" src="${cover}" alt="${pl.title}" onerror="this.onerror=null; this.src='/thumbnails/_c2e1NcI3Sc.jpg'">
        <div class="playlist-badge-sidebar">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h11v-2H2v2zm17 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/></svg>
          <span>${count}</span>
        </div>
      </div>
      <div class="playlist-card-meta">
        <h4 class="playlist-card-title">${pl.title}</h4>
        <div class="playlist-card-sub">${count} video${count === 1 ? '' : 's'}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      openPlaylistDetail(pl.id);
    });

    dom.playlistsGrid.appendChild(card);
  });
}

// Open Playlist Detail View
async function openPlaylistDetail(playlistId) {
  const pl = state.playlists.find(p => p.id === playlistId);
  if (!pl) return;
  state.currentPlaylist = pl;

  switchView('playlistDetail');

  if (dom.playlistDetailTitle) dom.playlistDetailTitle.textContent = pl.title;
  if (dom.playlistDetailDesc) dom.playlistDetailDesc.textContent = pl.description || 'Playlist videos';
  const count = pl.videoIds ? pl.videoIds.length : 0;
  if (dom.playlistDetailCount) dom.playlistDetailCount.textContent = `${count} videos`;
  
  const cover = pl.thumbnail || 'thumbnails/_c2e1NcI3Sc.jpg';
  if (dom.playlistDetailCover) dom.playlistDetailCover.src = cover;

  if (dom.playlistDeleteBtn) {
    dom.playlistDeleteBtn.style.display = pl.id === 'watch_later' ? 'none' : 'inline-flex';
  }

  // Find videos in this playlist
  const plVideos = (pl.videoIds || []).map(vidId => state.videos.find(v => v.id === vidId)).filter(Boolean);
  renderVideoGrid(dom.playlistVideosGrid, plVideos);
}

// Delete Playlist
async function handleDeleteCurrentPlaylist() {
  if (!state.currentPlaylist || state.currentPlaylist.id === 'watch_later') return;
  if (!confirm(`Are you sure you want to delete the playlist "${state.currentPlaylist.title}"?`)) return;

  const toDeleteId = state.currentPlaylist.id;
  state.playlists = state.playlists.filter(p => p.id !== toDeleteId);
  persistPlaylists();
  switchView('library');
  loadPlaylists();

  try {
    await fetch(`/api/playlists/${encodeURIComponent(toDeleteId)}`, { method: 'DELETE' });
  } catch (e) {}
}

// Save to Playlist Modal
function openPlaylistModal(videoId) {
  state.activeSaveVideoId = videoId || (state.currentVideo ? state.currentVideo.id : null);
  if (!dom.playlistModal) return;
  dom.playlistModal.style.display = 'flex';
  if (dom.newPlaylistInput) dom.newPlaylistInput.value = '';
  renderPlaylistCheckboxes();
}

function closePlaylistModal() {
  if (!dom.playlistModal) return;
  dom.playlistModal.style.display = 'none';
  state.activeSaveVideoId = null;
}

function renderPlaylistCheckboxes() {
  if (!dom.playlistCheckboxList) return;
  dom.playlistCheckboxList.innerHTML = '';

  const targetVid = state.activeSaveVideoId;

  state.playlists.forEach(pl => {
    const isChecked = targetVid && pl.videoIds && pl.videoIds.includes(targetVid);
    const item = document.createElement('label');
    item.className = 'playlist-checkbox-item';
    item.innerHTML = `
      <input type="checkbox" data-pl="${pl.id}" ${isChecked ? 'checked' : ''}>
      <span class="playlist-item-label">${pl.title}</span>
    `;

    item.querySelector('input').addEventListener('change', async (e) => {
      const checked = e.target.checked;
      await toggleVideoInPlaylist(pl.id, targetVid, checked);
    });

    dom.playlistCheckboxList.appendChild(item);
  });
}

async function toggleVideoInPlaylist(playlistId, videoId, add) {
  if (!playlistId || !videoId) return;
  const pl = state.playlists.find(p => p.id === playlistId);
  if (!pl) return;

  if (add) {
    if (!pl.videoIds.includes(videoId)) pl.videoIds.unshift(videoId);
  } else {
    pl.videoIds = pl.videoIds.filter(id => id !== videoId);
  }
  persistPlaylists();
  loadPlaylists();

  try {
    if (add) {
      await fetch(`/api/playlists/${playlistId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });
    } else {
      await fetch(`/api/playlists/${playlistId}/videos/${videoId}`, { method: 'DELETE' });
    }
  } catch (e) {}
}

async function handleCreatePlaylistSubmit() {
  if (!dom.newPlaylistInput) return;
  const title = dom.newPlaylistInput.value.trim();
  if (!title) return;

  const newPl = {
    id: 'pl_' + Date.now(),
    title,
    description: '',
    videoIds: state.activeSaveVideoId ? [state.activeSaveVideoId] : [],
    createdAt: Date.now()
  };
  state.playlists.push(newPl);
  persistPlaylists();
  dom.newPlaylistInput.value = '';
  loadPlaylists();
  renderPlaylistCheckboxes();

  try {
    await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        videoId: state.activeSaveVideoId
      })
    });
  } catch (e) {}
}

// Render Video Grid with REAL YouTube Thumbnails, Avatars, and Watch Progress
function renderVideoGrid(container, videos) {
  if (!container) return;
  container.innerHTML = '';

  if (videos.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
        <h3>No videos found</h3>
        <p style="color: #aaa; margin-top: 8px;">Try searching for another topic or click sync.</p>
      </div>
    `;
    return;
  }

  videos.forEach(video => {
    const isSubscribed = state.subscriptions.has(video.channelId);
    const card = document.createElement('div');
    card.className = 'video-card';
    card.setAttribute('data-id', video.id);

    const thumbUrl = video.thumbnail || `/thumbnails/${video.id}.jpg` || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    const avatarUrl = getChannelAvatar(video.channelId, video.channelAvatar, video.channelTitle);
    const svgFallback = getSvgAvatarDataUrl(video.channelTitle);
    const prog = getWatchProgress(video.id);
    const progressWidth = prog && prog.percentage ? prog.percentage : 0;

    card.innerHTML = `
      <div class="thumbnail-wrapper">
        <img class="thumbnail-img" src="${thumbUrl}" alt="${video.title}" loading="lazy" onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${video.id}/hqdefault.jpg'">
        <span class="duration-badge">${video.duration || '10:00'}</span>
        ${video.isNew ? '<span class="new-badge">NEW</span>' : ''}
        <button class="card-quick-save" title="Save to playlist" data-id="${video.id}">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>
        </button>
        <button class="card-quick-sub ${isSubscribed ? 'subscribed' : ''}" data-channel="${video.channelId}">
          ${isSubscribed ? 'Subscribed' : 'Subscribe'}
        </button>
        <div class="watch-progress-bar">
          <div class="watch-progress-fill" style="width: ${progressWidth}%;"></div>
        </div>
      </div>
      <div class="video-info-row">
        <img class="card-channel-avatar" src="${avatarUrl}" alt="${video.channelTitle}" onerror="this.onerror=null; this.src='${svgFallback}'">
        <div class="video-meta">
          <h3 class="video-card-title">${video.title}</h3>
          <div class="card-channel-name">
            <span>${video.channelTitle}</span>
            <svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </div>
          <div class="card-details">
            <span>${video.views}</span> • <span>${video.uploadedAt}</span>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.thumbnail-wrapper').addEventListener('click', (e) => {
      if (e.target.closest('.card-quick-sub') || e.target.closest('.card-quick-save')) return;
      openPlayer(video.id);
    });

    card.querySelector('.video-meta').addEventListener('click', () => openPlayer(video.id));

    const quickSubBtn = card.querySelector('.card-quick-sub');
    if (quickSubBtn) {
      quickSubBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSubscription(video.channelId);
      });
    }

    const quickSaveBtn = card.querySelector('.card-quick-save');
    if (quickSaveBtn) {
      quickSaveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlaylistModal(video.id);
      });
    }

    container.appendChild(card);
  });
}

// Open REAL Ad-Free YouTube Video Player with Playback Resume
async function openPlayer(videoId) {
  let video = null;
  let channel = null;
  let comments = [];
  let related = [];

  try {
    const res = await fetch(`/api/videos/${videoId}`);
    if (res.ok) {
      const data = await res.json();
      video = data.video;
      channel = data.channel;
      comments = data.comments || [];
      related = data.related || [];
    } else {
      throw new Error('Offline fallback');
    }
  } catch (err) {
    const all = state.videos.length > 0 ? state.videos : (window.ASI_DATA?.initialVideos || []);
    video = all.find(v => v.id === videoId) || {
      id: videoId,
      title: `YouTube Video (${videoId})`,
      channelId: 'youtube',
      channelTitle: 'YouTube Creator',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      views: 'Popular',
      uploadedAt: 'YouTube',
      duration: '10:00',
      category: 'General',
      description: 'Enjoy uninterrupted viewing on AsiTube ad-free.'
    };
    channel = state.channels.find(c => c.id === video.channelId);
    
    const savedComments = JSON.parse(localStorage.getItem('asitube_comments_' + videoId) || '[]');
    const seedComments = (window.ASI_DATA?.sampleComments && window.ASI_DATA.sampleComments[videoId]) || [
      { id: "c_def1", user: "AsiTube Viewer", avatar: "avatars/mrbeast.jpg", time: "Just now", text: "Loving this video completely ad-free on AsiTube!", likes: "142" }
    ];
    comments = [...savedComments, ...seedComments];
    related = all.filter(v => v.id !== videoId).slice(0, 8);
  }

  if (!video.embedUrl) {
    video.embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`;
  }

  state.currentVideo = video;

  // Save to watch history
  if (!state.watchHistory) state.watchHistory = [];
  if (!state.watchHistory.includes(video.id)) {
    state.watchHistory.unshift(video.id);
    persistHistory();
  }

  const durationSec = parseDurationToSeconds(video.duration);
  const progress = getWatchProgress(videoId);
  let startParam = '';

  // Check if video was previously watched
  if (progress && progress.currentTime > 5 && (durationSec === 0 || progress.currentTime < durationSec - 5)) {
    startParam = `&start=${Math.floor(progress.currentTime)}`;
    
    // Show resume notification toast
    if (dom.resumeToast && dom.resumeToastText) {
      dom.resumeToastText.textContent = `Resumed from ${formatSeconds(progress.currentTime)}`;
      dom.resumeToast.style.display = 'block';
      setTimeout(() => {
        if (dom.resumeToast) dom.resumeToast.style.display = 'none';
      }, 4000);
    }
  } else {
    if (dom.resumeToast) dom.resumeToast.style.display = 'none';
  }

  if (dom.videoIframe) {
    dom.videoIframe.src = `${video.embedUrl}${startParam}`;
  }

  startWatchTracker(videoId, durationSec);

  if (dom.playerVideoTitle) dom.playerVideoTitle.textContent = video.title;
  if (dom.playerVideoViews) dom.playerVideoViews.textContent = `${video.views} views`;
  if (dom.playerVideoUploaded) dom.playerVideoUploaded.textContent = video.uploadedAt;
  if (dom.playerVideoCategory) dom.playerVideoCategory.textContent = video.category || 'General';
  if (dom.playerLikesCount) dom.playerLikesCount.textContent = video.likes || 'Like';
  
  // Channel avatar & name
  if (dom.playerChannelAvatar) {
    const pAvatar = getChannelAvatar(video.channelId, channel?.avatar || video.channelAvatar, video.channelTitle);
    dom.playerChannelAvatar.src = pAvatar;
    dom.playerChannelAvatar.onerror = function() {
      this.onerror = null;
      this.src = getSvgAvatarDataUrl(video.channelTitle);
    };
  }
  if (dom.playerChannelName) dom.playerChannelName.textContent = video.channelTitle;
  if (dom.playerChannelSubs) dom.playerChannelSubs.textContent = `${video.subscriberCount || '1M'} subscribers`;
  
  const isSubscribed = state.subscriptions.has(video.channelId);
  updatePlayerSubscribeButton(isSubscribed);

  const isLiked = state.likedVideos.has(video.id) || video.isLiked;
  if (dom.playerLikeBtn) dom.playerLikeBtn.classList.toggle('active', isLiked);

  if (dom.playerDescription) {
    dom.playerDescription.textContent = video.description || 'Enjoy uninterrupted viewing on AsiTube.';
  }

  renderComments(comments);
  renderRelatedVideos(related);

  if (dom.playerOverlay) {
    dom.playerOverlay.style.display = 'block';
    dom.playerOverlay.scrollTop = 0;
  }
}

// Close Video Player
function closePlayer() {
  stopWatchTracker();
  if (dom.playerOverlay) {
    dom.playerOverlay.style.display = 'none';
  }
  if (dom.videoIframe) {
    dom.videoIframe.src = '';
  }
  if (dom.resumeToast) {
    dom.resumeToast.style.display = 'none';
  }
  state.currentVideo = null;
}

// Like Video Action
async function handleLikeCurrentVideo() {
  if (!state.currentVideo) return;
  const vidId = state.currentVideo.id;
  const currentlyLiked = state.likedVideos.has(vidId);
  if (currentlyLiked) {
    state.likedVideos.delete(vidId);
    if (dom.playerLikeBtn) dom.playerLikeBtn.classList.remove('active');
  } else {
    state.likedVideos.add(vidId);
    if (dom.playerLikeBtn) dom.playerLikeBtn.classList.add('active');
  }
  persistLikes();
  try {
    await fetch(`/api/videos/${vidId}/like`, { method: 'POST' });
  } catch (err) {}
}

// Render comments
function renderComments(comments) {
  if (!dom.commentsList) return;
  dom.commentsList.innerHTML = '';
  if (dom.commentsCount) dom.commentsCount.textContent = `(${comments.length})`;

  comments.forEach(c => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    const avatar = c.avatar || 'avatars/mrbeast.jpg';
    item.innerHTML = `
      <img src="${avatar}" class="card-channel-avatar" style="width:32px; height:32px;" alt="${c.user}" onerror="this.onerror=null; this.src='avatars/mkbhd.jpg'">
      <div>
        <div class="comment-header">
          <span class="comment-author">${c.user}</span>
          <span class="comment-time">${c.time}</span>
        </div>
        <div class="comment-text">${c.text}</div>
      </div>
    `;
    dom.commentsList.appendChild(item);
  });
}

// Post comment
async function postComment() {
  if (!state.currentVideo || !dom.commentInput) return;
  const text = dom.commentInput.value.trim();
  if (!text) return;

  const newComment = {
    id: 'c_' + Date.now(),
    user: 'You (Mobile User)',
    time: 'Just now',
    text,
    avatar: 'avatars/mrbeast.jpg'
  };

  const saved = JSON.parse(localStorage.getItem('asitube_comments_' + state.currentVideo.id) || '[]');
  saved.unshift(newComment);
  localStorage.setItem('asitube_comments_' + state.currentVideo.id, JSON.stringify(saved));

  const item = document.createElement('div');
  item.className = 'comment-item';
  item.innerHTML = `
    <div class="account-pfp small">A</div>
    <div>
      <div class="comment-header">
        <span class="comment-author">${newComment.user}</span>
        <span class="comment-time">${newComment.time}</span>
      </div>
      <div class="comment-text">${newComment.text}</div>
    </div>
  `;
  if (dom.commentsList) dom.commentsList.prepend(item);
  dom.commentInput.value = '';

  try {
    await fetch(`/api/videos/${state.currentVideo.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, user: 'You (Mobile User)' })
    });
  } catch (err) {}
}

// Render Related / Up Next Videos with real thumbnails
function renderRelatedVideos(related) {
  if (!dom.relatedVideosList) return;
  dom.relatedVideosList.innerHTML = '';

  related.forEach(video => {
    const item = document.createElement('div');
    item.className = 'related-card';
    const thumbUrl = video.thumbnail || `/thumbnails/${video.id}.jpg` || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    item.innerHTML = `
      <div class="related-thumb">
        <img src="${thumbUrl}" alt="${video.title}" loading="lazy" onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${video.id}/hqdefault.jpg'">
        <span class="duration-badge">${video.duration || '10:00'}</span>
      </div>
      <div class="related-meta">
        <h4 class="related-card-title">${video.title}</h4>
        <div class="related-channel">${video.channelTitle}</div>
        <div class="related-views">${video.views}</div>
      </div>
    `;
    item.addEventListener('click', () => {
      openPlayer(video.id);
    });
    dom.relatedVideosList.appendChild(item);
  });
}

// Trigger Live Sync with YouTube (Small button)
async function triggerSync() {
  if (state.isSyncing) return;
  state.isSyncing = true;

  if (dom.syncIcon) dom.syncIcon.classList.add('spinning');

  try {
    const res = await fetch('/api/sync');
    const data = await res.json();
    state.lastSyncTime = Date.now();

    if (data.newVideos && data.newVideos.length > 0) {
      data.newVideos.forEach(v => addNotification(v));
    }

    if (state.currentView === 'subscriptions') {
      loadSubscriptionsFeed();
    } else {
      loadVideos();
    }
  } catch (err) {
    console.error('Error during YouTube sync:', err);
  } finally {
    setTimeout(() => {
      if (dom.syncIcon) dom.syncIcon.classList.remove('spinning');
      state.isSyncing = false;
    }, 700);
  }
}

// Handle Real-Time Search
async function handleSearch() {
  if (!dom.searchInput) return;
  const q = dom.searchInput.value.trim();
  state.searchQuery = q;

  if (dom.searchContainer) {
    dom.searchContainer.classList.remove('mobile-active');
  }

  const ytMatch = q.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    openPlayer(ytMatch[1]);
    return;
  }

  switchView('home');
  loadVideos();
}
