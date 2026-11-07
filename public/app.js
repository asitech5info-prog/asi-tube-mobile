/**
 * ASI TUBE (AsiTube) - Frontend Application Logic
 * Ad-Free YouTube with Real-Time Sync, Subscriptions, Playlists, Themes & Background Play
 */

// Google Cloud YouTube Data API v3 Key
const YT_API_KEY = 'AIzaSyD60ySfeyrTBGFrhUN9J4FgDsVRPQNoXW0';

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
  currentWatchSeconds: 0,
  cachedSubVideos: []
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
  playerRotateBtn: document.getElementById('playerRotateBtn'),
  playerPipBtn: document.getElementById('playerPipBtn'),
  videoFrameWrapper: document.getElementById('videoFrameWrapper'),
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

  // Mobile Drawer Navigation
  menuToggleBtn: document.getElementById('menuToggleBtn'),
  appSidebar: document.getElementById('appSidebar'),
  sidebarBackdrop: document.getElementById('sidebarBackdrop'),
  closeSidebarBtn: document.getElementById('closeSidebarBtn'),

  // AMOLED Settings Modal & Themes
  settingsBtn: document.getElementById('settingsBtn'),
  userProfileBtn: document.getElementById('userProfileBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
  themeAmoledBtn: document.getElementById('themeAmoledBtn'),
  themeDarkBtn: document.getElementById('themeDarkBtn'),
  themeLightBtn: document.getElementById('themeLightBtn'),
  bgPlayToggle: document.getElementById('bgPlayToggle'),
  pipToggle: document.getElementById('pipToggle'),

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
  if (durationStr.startsWith('PT')) {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const h = parseInt(match[1] || '0', 10);
      const m = parseInt(match[2] || '0', 10);
      const s = parseInt(match[3] || '0', 10);
      return h * 3600 + m * 60 + s;
    }
  }
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 600;
}

// Parse ISO 8601 duration (e.g. PT15M33S, PT1H2M)
function parseISO8601Duration(durationStr) {
  if (!durationStr) return '0:00';
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return durationStr;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function formatViewCount(num) {
  if (!num) return 'Popular';
  const n = parseInt(num, 10);
  if (isNaN(n)) return num;
  if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function formatTimeAgo(time) {
  if (!time) return 'Recently';
  const date = new Date(time);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (isNaN(seconds) || seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

// Switch between AMOLED, Dark and Light themes
function applyTheme(themeName) {
  if (!themeName) themeName = 'amoled';
  document.body.classList.remove('theme-amoled', 'theme-dark', 'theme-light', 'dark-theme');
  document.body.classList.add(`theme-${themeName}`);
  try {
    localStorage.setItem('asitube_theme', themeName);
  } catch (e) {}

  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.getAttribute('data-theme') === themeName);
  });

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    if (themeName === 'light') meta.content = '#ffffff';
    else if (themeName === 'amoled') meta.content = '#000000';
    else meta.content = '#0f0f0f';
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initStorageState();
  initEventListeners();
  initRealTimeSSE();
  loadChannels();
  loadVideos();
  loadPlaylists();

  // Automatic live YouTube sync on startup
  setTimeout(() => {
    syncLatestYouTubeUploads(false);
  }, 1200);

  // Periodic YouTube sync every 60s
  setInterval(() => {
    syncLatestYouTubeUploads(false);
  }, 60000);
});

// Load saved subscriptions, likes, history, playlists and watch progress from LocalStorage
function initStorageState() {
  try {
    const savedVideos = localStorage.getItem('asitube_cached_videos');
    if (savedVideos) {
      const parsed = JSON.parse(savedVideos);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.videos = parsed;
      }
    }
  } catch (e) {}

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

  // Restore Theme
  try {
    const savedTheme = localStorage.getItem('asitube_theme') || 'amoled';
    applyTheme(savedTheme);
  } catch (e) {}

  // Restore Background Play & PiP settings
  try {
    const bgPlay = localStorage.getItem('asitube_bg_play') !== 'false';
    if (dom.bgPlayToggle) dom.bgPlayToggle.checked = bgPlay;
    if (window.AndroidBridge && window.AndroidBridge.setBackgroundPlayEnabled) {
      window.AndroidBridge.setBackgroundPlayEnabled(bgPlay);
    }
  } catch (e) {}

  try {
    const pipPlay = localStorage.getItem('asitube_pip') !== 'false';
    if (dom.pipToggle) dom.pipToggle.checked = pipPlay;
    if (window.AndroidBridge && window.AndroidBridge.setPipEnabled) {
      window.AndroidBridge.setPipEnabled(pipPlay);
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
  if (dom.playerRotateBtn) dom.playerRotateBtn.addEventListener('click', toggleLandscapeMode);
  if (dom.playerLikeBtn) dom.playerLikeBtn.addEventListener('click', handleLikeCurrentVideo);

  // Fullscreen change listener for auto landscape rotation
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

  // Android hardware back button handler
  window.handleAndroidBack = function() {
    if (dom.appSidebar && dom.appSidebar.classList.contains('mobile-open')) {
      closeSidebarDrawer();
      return true;
    }
    if (dom.settingsModal && dom.settingsModal.style.display === 'flex') {
      dom.settingsModal.style.display = 'none';
      return true;
    }
    if (dom.playerOverlay && dom.playerOverlay.classList.contains('landscape-mode')) {
      toggleLandscapeMode();
      return true;
    }
    if (dom.playerOverlay && dom.playerOverlay.style.display !== 'none') {
      closePlayer();
      return true;
    }
    if (dom.manageSubsModal && dom.manageSubsModal.style.display !== 'none') {
      dom.manageSubsModal.style.display = 'none';
      return true;
    }
    if (dom.playlistModal && dom.playlistModal.style.display !== 'none') {
      dom.playlistModal.style.display = 'none';
      return true;
    }
    if (state.currentView !== 'home') {
      switchView('home');
      return true;
    }
    return false;
  };

  // Mobile Hamburger Drawer
  if (dom.menuToggleBtn) {
    dom.menuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSidebarDrawer();
    });
  }
  if (dom.closeSidebarBtn) {
    dom.closeSidebarBtn.addEventListener('click', closeSidebarDrawer);
  }
  if (dom.sidebarBackdrop) {
    dom.sidebarBackdrop.addEventListener('click', closeSidebarDrawer);
  }
  if (dom.appSidebar) {
    dom.appSidebar.querySelectorAll('[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          closeSidebarDrawer();
        }
      });
    });
  }

  // AMOLED Settings Modal & Themes
  if (dom.settingsBtn) {
    dom.settingsBtn.addEventListener('click', () => {
      if (dom.settingsModal) dom.settingsModal.style.display = 'flex';
    });
  }
  if (dom.userProfileBtn) {
    dom.userProfileBtn.addEventListener('click', () => {
      if (dom.settingsModal) dom.settingsModal.style.display = 'flex';
    });
  }
  if (dom.closeSettingsModalBtn) {
    dom.closeSettingsModalBtn.addEventListener('click', () => {
      if (dom.settingsModal) dom.settingsModal.style.display = 'none';
    });
  }
  if (dom.settingsModal) {
    dom.settingsModal.addEventListener('click', (e) => {
      if (e.target === dom.settingsModal) {
        dom.settingsModal.style.display = 'none';
      }
    });
  }

  // Theme Card Click Handlers
  if (dom.themeAmoledBtn) {
    dom.themeAmoledBtn.addEventListener('click', () => {
      applyTheme('amoled');
      showToast('AMOLED Black theme applied');
    });
  }
  if (dom.themeDarkBtn) {
    dom.themeDarkBtn.addEventListener('click', () => {
      applyTheme('dark');
      showToast('Dark theme applied');
    });
  }
  if (dom.themeLightBtn) {
    dom.themeLightBtn.addEventListener('click', () => {
      applyTheme('light');
      showToast('Light theme applied');
    });
  }

  // Background Audio Playback switch
  if (dom.bgPlayToggle) {
    dom.bgPlayToggle.addEventListener('change', () => {
      const isEnabled = dom.bgPlayToggle.checked;
      try {
        localStorage.setItem('asitube_bg_play', isEnabled);
      } catch (e) {}
      if (window.AndroidBridge && window.AndroidBridge.setBackgroundPlayEnabled) {
        window.AndroidBridge.setBackgroundPlayEnabled(isEnabled);
      }
      showToast(isEnabled ? 'Background audio play enabled' : 'Background play disabled');
    });
  }

  // Picture-in-Picture (PiP) switch
  if (dom.pipToggle) {
    dom.pipToggle.addEventListener('change', () => {
      const isEnabled = dom.pipToggle.checked;
      try {
        localStorage.setItem('asitube_pip', isEnabled);
      } catch (e) {}
      if (window.AndroidBridge && window.AndroidBridge.setPipEnabled) {
        window.AndroidBridge.setPipEnabled(isEnabled);
      }
      showToast(isEnabled ? 'Picture-in-Picture enabled' : 'PiP disabled');
    });
  }

  // Picture-in-Picture Button on Video Player
  if (dom.playerPipBtn) {
    dom.playerPipBtn.addEventListener('click', () => {
      if (window.AndroidBridge && window.AndroidBridge.enterPiP) {
        window.AndroidBridge.enterPiP();
      } else {
        showToast('PiP active (Native Android)');
      }
    });
  }

  // Window PiP mode change callback from Android
  window.onPipModeChanged = function(isInPip) {
    if (dom.playerOverlay) {
      if (isInPip) {
        dom.playerOverlay.classList.add('pip-active');
      } else {
        dom.playerOverlay.classList.remove('pip-active');
      }
    }
  };

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

// Mobile Sidebar Drawer Controls
function openSidebarDrawer() {
  if (dom.appSidebar) dom.appSidebar.classList.add('mobile-open');
  if (dom.sidebarBackdrop) dom.sidebarBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebarDrawer() {
  if (dom.appSidebar) dom.appSidebar.classList.remove('mobile-open');
  if (dom.sidebarBackdrop) dom.sidebarBackdrop.classList.remove('active');
  document.body.style.overflow = '';
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

  state.subscriptions.forEach(subId => {
    if (!state.channels.some(c => c.id === subId || c.ytChannelId === subId)) {
      state.channels.push({
        id: subId,
        ytChannelId: subId,
        title: subId.startsWith('UC') ? 'YouTube Creator' : (subId.charAt(0).toUpperCase() + subId.slice(1)),
        avatar: '',
        subscriberCount: 'YouTube Creator',
        subscribed: true
      });
    }
  });

  const subscribedList = state.channels.filter(c => state.subscriptions.has(c.id) || state.subscriptions.has(c.ytChannelId));
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
      if (window.innerWidth <= 900) closeSidebarDrawer();
      switchView('subscriptions');
    });
    dom.sidebarSubscriptionsList.appendChild(item);
  });
}

// Render Creator Stories with real channel profile pictures
function renderCreatorStories() {
  if (!dom.creatorStoriesBar) return;
  dom.creatorStoriesBar.innerHTML = '';

  const subscribedList = state.channels.filter(c => state.subscriptions.has(c.id) || state.subscriptions.has(c.ytChannelId));

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
    const isSelected = state.selectedCreatorId === channel.id || state.selectedCreatorId === channel.ytChannelId;
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
    if (!state.channels.some(c => c.id === channelId || c.ytChannelId === channelId)) {
      const title = state.currentVideo?.channelTitle || (channelId.startsWith('UC') ? 'YouTube Creator' : channelId);
      const avatar = state.currentVideo?.channelAvatar || '';
      state.channels.push({
        id: channelId,
        ytChannelId: channelId,
        title: title,
        avatar: avatar,
        subscriberCount: '1M+ subscribers',
        subscribed: true
      });
      try {
        localStorage.setItem('asitube_channels', JSON.stringify(state.channels));
      } catch (e) {}
    }
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

// Fetch YouTube Most Popular Feed via Google Cloud YouTube Data API v3
async function fetchYouTubePopularFeed() {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=US&maxResults=30&key=${YT_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.items || data.items.length === 0) throw new Error('No items');
    
    return data.items.map(item => ({
      id: item.id,
      title: item.snippet.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      channelAvatar: item.snippet.thumbnails?.default?.url || '',
      thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
      views: formatViewCount(item.statistics?.viewCount),
      uploadedAt: formatTimeAgo(item.snippet.publishedAt),
      timestamp: new Date(item.snippet.publishedAt).getTime(),
      duration: parseISO8601Duration(item.contentDetails?.duration),
      category: 'Popular',
      description: item.snippet.description,
      likes: formatViewCount(item.statistics?.likeCount),
      embedUrl: `https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&fs=1`
    }));
  } catch (e) {
    console.warn('YouTube popular feed error:', e);
    return null;
  }
}

// Fetch Category Videos via YouTube API Search
async function fetchYouTubeCategoryVideos(category) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(category)}&type=video&key=${YT_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;

    const ids = data.items.map(i => i.id.videoId).filter(Boolean);
    let detailsMap = {};
    if (ids.length > 0) {
      try {
        const dRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids.join(',')}&key=${YT_API_KEY}`);
        if (dRes.ok) {
          const dData = await dRes.json();
          (dData.items || []).forEach(d => {
            detailsMap[d.id] = {
              duration: parseISO8601Duration(d.contentDetails?.duration),
              views: formatViewCount(d.statistics?.viewCount),
              likes: formatViewCount(d.statistics?.likeCount)
            };
          });
        }
      } catch (err) {}
    }

    return data.items.map(item => {
      const vidId = item.id.videoId;
      const details = detailsMap[vidId] || {};
      return {
        id: vidId,
        title: item.snippet.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        channelAvatar: '',
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
        views: details.views || 'Popular',
        uploadedAt: formatTimeAgo(item.snippet.publishedAt),
        timestamp: new Date(item.snippet.publishedAt).getTime(),
        duration: details.duration || 'Video',
        category: category,
        description: item.snippet.description,
        likes: details.likes || 'Like',
        embedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&fs=1`
      };
    });
  } catch (e) {
    console.warn(`Category fetch error for ${category}:`, e);
    return null;
  }
}

// Fetch Latest Channel Videos for Subscriptions Feed
async function fetchChannelLatestVideos(channelId) {
  try {
    let ytChannelId = channelId;
    const ch = state.channels.find(c => c.id === channelId || c.ytChannelId === channelId);
    if (ch && ch.ytChannelId) ytChannelId = ch.ytChannelId;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ytChannelId}&order=date&type=video&maxResults=10&key=${YT_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.items) return [];

    return data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      channelId: channelId,
      channelTitle: item.snippet.channelTitle,
      channelAvatar: ch?.avatar || item.snippet.thumbnails?.default?.url || '',
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
      views: 'New Upload',
      uploadedAt: formatTimeAgo(item.snippet.publishedAt),
      timestamp: new Date(item.snippet.publishedAt).getTime(),
      duration: 'NEW',
      category: 'Subscriptions',
      description: item.snippet.description,
      isNew: true,
      likes: 'Like',
      embedUrl: `https://www.youtube-nocookie.com/embed/${item.id.videoId}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&fs=1`
    }));
  } catch (e) {
    console.warn(`Error fetching channel videos for ${channelId}:`, e);
    return [];
  }
}

// Load Videos for Home Feed
async function loadVideos() {
  if (state.searchQuery) {
    await performUniversalYouTubeSearch(state.searchQuery);
    return;
  }

  let vids = [];

  // 1. Live Google Cloud YouTube Data API v3
  if (state.activeCategory === 'All') {
    vids = await fetchYouTubePopularFeed();
  } else if (state.activeCategory === 'Recently Uploaded') {
    const pop = await fetchYouTubePopularFeed();
    if (pop) vids = pop.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } else if (state.activeCategory === 'Trending') {
    vids = await fetchYouTubePopularFeed();
  } else {
    vids = await fetchYouTubeCategoryVideos(state.activeCategory);
  }

  // 2. Node backend if available
  if (!vids || vids.length === 0) {
    try {
      const res = await fetch(`/api/videos?category=${encodeURIComponent(state.activeCategory)}`);
      if (res.ok) {
        const data = await res.json();
        vids = data.videos || [];
      }
    } catch (err) {}
  }

  // 3. Fallback to cached or initial videos
  if (!vids || vids.length === 0) {
    const baseList = (state.videos && state.videos.length > 0)
      ? state.videos
      : (window.ASI_DATA?.initialVideos || []);
    vids = JSON.parse(JSON.stringify(baseList));

    if (state.activeCategory && state.activeCategory !== 'All') {
      if (state.activeCategory === 'Recently Uploaded') {
        vids = vids.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } else {
        vids = vids.filter(v =>
          (v.category && v.category.toLowerCase() === state.activeCategory.toLowerCase()) ||
          (v.tags && v.tags.some(t => t.toLowerCase() === state.activeCategory.toLowerCase()))
        );
      }
    }
  }

  state.videos = vids;
  try {
    localStorage.setItem('asitube_cached_videos', JSON.stringify(state.videos));
  } catch (e) {}

  if (dom.videoCountBadge) {
    dom.videoCountBadge.textContent = `${state.videos.length} videos`;
  }

  renderVideoGrid(dom.videoGrid, state.videos);
}

// Load Subscriptions Feed (Sequential, Chronological, Newest on Top like YouTube)
async function loadSubscriptionsFeed() {
  if (!dom.subscriptionsVideoGrid) return;

  if (state.subscriptions.size === 0) {
    dom.subscriptionsVideoGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.03); border-radius: 14px;">
        <h3 style="margin-bottom: 8px;">No subscribed channels yet</h3>
        <p style="color: #aaa; font-size: 14px; margin-bottom: 16px;">Subscribe to creators to see their newest videos here in chronological sequence!</p>
        <button class="btn-primary-action" onclick="state.activeCategory='All'; switchView('home');">Explore Creators</button>
      </div>
    `;
    return;
  }

  dom.subscriptionsVideoGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px;">
      <div class="sync-icon spinning" style="font-size: 28px; margin-bottom: 12px; display: inline-block;">⚡</div>
      <h3 style="color: #fff; font-size: 16px;">Loading latest creator uploads...</h3>
      <p style="color: #888; font-size: 13px; margin-top: 4px;">Syncing subscribed videos chronologically</p>
    </div>
  `;

  let subsVideos = [];

  // 1. Fetch latest videos from YouTube Data API for all subscribed channels in parallel
  const subIds = [...state.subscriptions];
  const promises = subIds.map(subId => fetchChannelLatestVideos(subId));
  const results = await Promise.allSettled(promises);

  results.forEach(res => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      subsVideos.push(...res.value);
    }
  });

  // 2. Also check backend if running
  if (subsVideos.length === 0) {
    try {
      let url = '/api/subscriptions';
      if (state.selectedCreatorId) {
        url = `/api/videos?channelId=${encodeURIComponent(state.selectedCreatorId)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        subsVideos = data.videos || [];
      }
    } catch (err) {}
  }

  // 3. Fallback to local catalog if offline
  if (subsVideos.length === 0) {
    const all = state.videos.length > 0 ? state.videos : (window.ASI_DATA?.initialVideos || []);
    subsVideos = all.filter(v => state.subscriptions.has(v.channelId));
  }

  // Filter by selected creator if one was clicked in the stories bar
  if (state.selectedCreatorId) {
    const selCh = state.channels.find(c => c.id === state.selectedCreatorId || c.ytChannelId === state.selectedCreatorId);
    const selName = selCh?.title?.toLowerCase() || state.selectedCreatorId.toLowerCase();
    subsVideos = subsVideos.filter(v => 
      v.channelId === state.selectedCreatorId || 
      (v.channelTitle && v.channelTitle.toLowerCase().includes(selName))
    );
  }

  // SEQUENCE ORDER: Sort chronologically with newest uploads strictly on top (like real YouTube)
  subsVideos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  state.cachedSubVideos = subsVideos;

  if (subsVideos.length === 0) {
    dom.subscriptionsVideoGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.03); border-radius: 14px;">
        <h3 style="margin-bottom: 8px;">No uploads found for this creator</h3>
        <p style="color: #aaa; font-size: 14px; margin-bottom: 16px;">Check back soon for new videos!</p>
        <button class="btn-primary-action" onclick="state.selectedCreatorId=null; loadSubscriptionsFeed();">View All Subscriptions</button>
      </div>
    `;
    return;
  }

  renderVideoGrid(dom.subscriptionsVideoGrid, subsVideos);
}

// Load Trending Videos
async function loadTrendingVideos() {
  if (!dom.trendingVideoGrid) return;
  let trending = await fetchYouTubePopularFeed();
  if (!trending || trending.length === 0) {
    try {
      const res = await fetch('/api/videos?category=Trending');
      if (res.ok) {
        const data = await res.json();
        trending = data.videos || [];
      }
    } catch (err) {}
  }
  if (!trending || trending.length === 0) {
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
    video.embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&fs=1`;
  }

  // Ensure initial portrait controls
  if (dom.playerOverlay) {
    dom.playerOverlay.classList.remove('landscape-mode');
  }
  const rotateTxt = document.getElementById('playerRotateText');
  if (rotateTxt) rotateTxt.textContent = 'Landscape';

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
  if (window.AndroidBridge && window.AndroidBridge.setVideoPlaying) {
    window.AndroidBridge.setVideoPlaying(true);
  }
}

// Close Video Player
function closePlayer() {
  stopWatchTracker();
  if (window.AndroidBridge && window.AndroidBridge.setVideoPlaying) {
    window.AndroidBridge.setVideoPlaying(false);
  }
  if (dom.playerOverlay) {
    dom.playerOverlay.classList.remove('landscape-mode');
    dom.playerOverlay.classList.remove('pip-active');
    dom.playerOverlay.style.display = 'none';
  }
  if (window.AndroidBridge && window.AndroidBridge.forcePortrait) {
    window.AndroidBridge.forcePortrait();
  }
  const rotateTxt = document.getElementById('playerRotateText');
  if (rotateTxt) rotateTxt.textContent = 'Landscape';

  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  } catch (e) {}

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

// ==========================================================
// LANDSCAPE / FULLSCREEN THEATER MODE CONTROLLER
// ==========================================================
let isTogglingFullscreen = false;

function toggleLandscapeMode() {
  const overlay = dom.playerOverlay;
  if (!overlay) return;

  const isLandscape = overlay.classList.contains('landscape-mode');
  isTogglingFullscreen = true;
  setTimeout(() => { isTogglingFullscreen = false; }, 600);

  if (!isLandscape) {
    overlay.classList.add('landscape-mode');
    const txt = document.getElementById('playerRotateText');
    if (txt) txt.textContent = 'Portrait';

    if (window.AndroidBridge && window.AndroidBridge.forceLandscape) {
      window.AndroidBridge.forceLandscape();
    } else {
      try {
        if (dom.videoFrameWrapper && dom.videoFrameWrapper.requestFullscreen) {
          dom.videoFrameWrapper.requestFullscreen().catch(() => {});
        }
      } catch (e) {}
    }
  } else {
    overlay.classList.remove('landscape-mode');
    const txt = document.getElementById('playerRotateText');
    if (txt) txt.textContent = 'Landscape';

    if (window.AndroidBridge && window.AndroidBridge.forcePortrait) {
      window.AndroidBridge.forcePortrait();
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {}
    }
  }
}

function handleFullscreenChange() {
  if (isTogglingFullscreen) return;
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (dom.playerOverlay) {
    if (isFs) {
      dom.playerOverlay.classList.add('landscape-mode');
      if (window.AndroidBridge && window.AndroidBridge.forceLandscape) {
        window.AndroidBridge.forceLandscape();
      }
      const txt = document.getElementById('playerRotateText');
      if (txt) txt.textContent = 'Portrait';
    } else {
      dom.playerOverlay.classList.remove('landscape-mode');
      if (window.AndroidBridge && window.AndroidBridge.forcePortrait) {
        window.AndroidBridge.forcePortrait();
      }
      const txt = document.getElementById('playerRotateText');
      if (txt) txt.textContent = 'Landscape';
    }
  }
}

// Utility: format relative time
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return `${Math.floor(diffSec / 604800)}w ago`;
}

// Utility: HTML escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Visual feedback toast
function showToast(message) {
  let toast = document.getElementById('syncToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'syncToast';
    toast.className = 'sync-status-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = 'flex';
  setTimeout(() => {
    if (toast) toast.style.display = 'none';
  }, 3500);
}

// Render search channel creator banner
function renderSearchChannelCard(channel) {
  if (!dom.videoGrid) return;
  const isSubbed = state.subscriptions.has(channel.channelId);
  const card = document.createElement('div');
  card.className = 'search-channel-card';

  const avatarUrl = channel.channelAvatar || getSvgAvatarDataUrl(channel.channelTitle);

  card.innerHTML = `
    <img src="${avatarUrl}" class="search-channel-avatar" alt="${escapeHtml(channel.channelTitle)}" onerror="this.onerror=null; this.src='${getSvgAvatarDataUrl(channel.channelTitle)}';">
    <div class="search-channel-info">
      <div class="search-channel-title">
        ${escapeHtml(channel.channelTitle)}
        <span class="search-channel-badge">Creator</span>
      </div>
      <div class="search-channel-meta">
        ${channel.subscriberCount ? `${escapeHtml(channel.subscriberCount)} subscribers • ` : ''}
        ${channel.videoCount ? escapeHtml(channel.videoCount) : 'YouTube Channel'}
      </div>
      <div class="search-channel-desc">${escapeHtml(channel.description || 'Verified YouTube Creator')}</div>
    </div>
    <button class="search-channel-sub-btn ${isSubbed ? 'subscribed' : ''}" data-channel="${channel.channelId}">
      ${isSubbed ? 'Subscribed' : 'Subscribe'}
    </button>
  `;

  const btn = card.querySelector('.search-channel-sub-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSubscription(channel.channelId);
    const nowSubbed = state.subscriptions.has(channel.channelId);
    btn.classList.toggle('subscribed', nowSubbed);
    btn.textContent = nowSubbed ? 'Subscribed' : 'Subscribe';
  });

  card.addEventListener('click', () => {
    state.selectedCreatorId = channel.channelId;
    switchView('subscriptions');
  });

  dom.videoGrid.prepend(card);
}

// Parse YouTube search HTML response
function parseYouTubeResultsHtml(html) {
  if (!html) return [];
  const results = [];
  try {
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/) ||
                      html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    const sectionList = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    for (const section of sectionList) {
      const contents = section.itemSectionRenderer?.contents || [];
      for (const item of contents) {
        if (item.videoRenderer) {
          const vr = item.videoRenderer;
          if (vr.videoId) {
            const thumb = vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url ||
                          `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;
            const avatar = vr.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url || '';
            const channelName = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || 'Creator';
            const channelId = vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || 'youtube';

            results.push({
              id: vr.videoId,
              title: vr.title?.runs?.[0]?.text || 'YouTube Video',
              channelId: channelId,
              channelTitle: channelName,
              channelAvatar: avatar,
              thumbnail: thumb,
              views: vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || 'Popular',
              uploadedAt: vr.publishedTimeText?.simpleText || 'Recently',
              timestamp: Date.now(),
              duration: vr.lengthText?.simpleText || 'Video',
              category: 'YouTube Search',
              isNew: false,
              likes: 'Like'
            });
          }
        } else if (item.channelRenderer) {
          const cr = item.channelRenderer;
          const chId = cr.channelId;
          const title = cr.title?.simpleText || cr.title?.runs?.[0]?.text || 'Channel';
          const avatar = cr.thumbnail?.thumbnails?.[cr.thumbnail.thumbnails.length - 1]?.url || '';
          const subCount = cr.subscriberCountText?.simpleText || '';
          const vidCount = cr.videoCountText?.simpleText || '';

          results.unshift({
            id: 'channel_' + chId,
            isChannelResult: true,
            channelId: chId,
            channelTitle: title,
            channelAvatar: avatar,
            subscriberCount: subCount,
            videoCount: vidCount,
            description: cr.descriptionSnippet?.runs?.map(r => r.text).join('') || ''
          });
        }
      }
    }
  } catch (err) {
    console.error('Error parsing YouTube HTML:', err);
  }
  return results;
}

// Search YouTube via Google Cloud YouTube Data API v3
async function searchYouTubeApi(query) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=video,channel&key=${YT_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.items || data.items.length === 0) return [];

    const channels = [];
    const videoItems = [];
    const videoIds = [];

    data.items.forEach(item => {
      if (item.id.kind === 'youtube#channel') {
        const chId = item.id.channelId;
        const title = item.snippet.channelTitle || item.snippet.title;
        const avatar = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url;
        const ch = {
          id: 'channel_' + chId,
          isChannelResult: true,
          channelId: chId,
          channelTitle: title,
          channelAvatar: avatar,
          subscriberCount: 'YouTube Creator',
          videoCount: 'Latest Videos',
          description: item.snippet.description || 'Verified YouTube Channel'
        };
        channels.push(ch);

        // Auto-register channel in state.channels if not existing
        if (!state.channels.some(c => c.id === chId || c.ytChannelId === chId)) {
          state.channels.push({
            id: chId,
            ytChannelId: chId,
            title: title,
            avatar: avatar,
            subscriberCount: 'YouTube Creator',
            description: item.snippet.description,
            subscribed: false
          });
        }
      } else if (item.id.kind === 'youtube#video') {
        videoItems.push(item);
        videoIds.push(item.id.videoId);
      }
    });

    let detailsMap = {};
    if (videoIds.length > 0) {
      try {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(',')}&key=${YT_API_KEY}`;
        const dRes = await fetch(detailsUrl);
        if (dRes.ok) {
          const dData = await dRes.json();
          (dData.items || []).forEach(d => {
            detailsMap[d.id] = {
              duration: parseISO8601Duration(d.contentDetails?.duration),
              views: formatViewCount(d.statistics?.viewCount),
              likes: formatViewCount(d.statistics?.likeCount)
            };
          });
        }
      } catch (err) {}
    }

    const videos = videoItems.map(item => {
      const vidId = item.id.videoId;
      const details = detailsMap[vidId] || {};
      return {
        id: vidId,
        title: item.snippet.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        channelAvatar: '',
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
        views: details.views || 'Popular',
        uploadedAt: formatTimeAgo(item.snippet.publishedAt),
        timestamp: new Date(item.snippet.publishedAt).getTime(),
        duration: details.duration || 'Video',
        category: 'YouTube Search',
        description: item.snippet.description,
        likes: details.likes || 'Like',
        embedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&fs=1`
      };
    });

    return [...channels, ...videos];
  } catch (e) {
    console.warn('YouTube search API error:', e);
    return null;
  }
}

// Real-Time Universal YouTube Search
async function performUniversalYouTubeSearch(query) {
  if (!dom.videoGrid) return;
  dom.videoGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px;">
      <div class="sync-icon spinning" style="font-size: 28px; margin-bottom: 12px; display: inline-block;">🔍</div>
      <h3 style="color: #fff; font-size: 16px;">Searching YouTube for "${escapeHtml(query)}"...</h3>
      <p style="color: #888; font-size: 13px; margin-top: 4px;">Fetching live YouTube creators and videos</p>
    </div>
  `;

  let results = [];

  // 1. Google Cloud YouTube Data API v3 (Official & Instant)
  try {
    const apiResults = await searchYouTubeApi(query);
    if (apiResults && apiResults.length > 0) {
      results = apiResults;
    }
  } catch (e) {
    console.warn('YouTube API search error:', e);
  }

  // 2. Android Native Bridge (Zero CORS)
  if (!results || results.length === 0) {
    if (window.AndroidBridge && window.AndroidBridge.fetchUrl) {
      try {
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const html = window.AndroidBridge.fetchUrl(ytUrl);
        if (html) {
          results = parseYouTubeResultsHtml(html);
        }
      } catch (e) {
        console.warn('Native YouTube search error:', e);
      }
    }
  }

  // 3. Node.js backend or WebView intercepted API
  if (!results || results.length === 0) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          results = json.videos || [];
          if (json.channels && json.channels.length > 0) {
            json.channels.forEach(ch => {
              results.unshift({
                id: 'channel_' + ch.id,
                isChannelResult: true,
                channelId: ch.id,
                channelTitle: ch.title,
                channelAvatar: ch.avatar,
                subscriberCount: ch.subscriberCount,
                videoCount: `${ch.videoCount || 500}+ videos`,
                description: ch.description
              });
            });
          }
        } catch (e) {
          results = parseYouTubeResultsHtml(text);
        }
      }
    } catch (e) {}
  }

  // 3. Public CORS / Invidious fallback
  if (!results || results.length === 0) {
    try {
      const endpoints = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.youtube.com/results?search_query=' + query)}`,
        `https://yewtu.be/api/v1/search?q=${encodeURIComponent(query)}`,
        `https://invidious.jing.rocks/api/v1/search?q=${encodeURIComponent(query)}`
      ];
      for (const endpoint of endpoints) {
        try {
          const cRes = await fetch(endpoint, { signal: AbortSignal.timeout(3500) });
          if (cRes.ok) {
            const raw = await cRes.text();
            if (raw.includes('ytInitialData') || raw.includes('<!DOCTYPE html>')) {
              results = parseYouTubeResultsHtml(raw);
            } else {
              const data = JSON.parse(raw);
              if (Array.isArray(data)) {
                results = data.map(item => ({
                  id: item.videoId,
                  title: item.title,
                  channelId: item.authorId || item.author,
                  channelTitle: item.author,
                  channelAvatar: item.authorThumbnails?.[0]?.url || '',
                  thumbnail: item.videoThumbnails?.[item.videoThumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                  views: item.viewCount ? item.viewCount.toLocaleString() : 'Popular',
                  uploadedAt: item.publishedText || 'Recently',
                  duration: item.lengthSeconds ? formatSeconds(item.lengthSeconds) : 'Video',
                  category: 'YouTube Search',
                  isNew: false,
                  likes: 'Like'
                }));
              }
            }
            if (results.length > 0) break;
          }
        } catch (err) {}
      }
    } catch (e) {}
  }

  // 4. Local catalog fallback if completely offline
  if (!results || results.length === 0) {
    const qLower = query.toLowerCase();
    const all = (state.videos && state.videos.length > 0) ? state.videos : (window.ASI_DATA?.initialVideos || []);
    results = all.filter(v =>
      (v.title && v.title.toLowerCase().includes(qLower)) ||
      (v.channelTitle && v.channelTitle.toLowerCase().includes(qLower)) ||
      (v.tags && v.tags.some(t => t.toLowerCase().includes(qLower)))
    );
  }

  const channelResults = results.filter(r => r.isChannelResult);
  const videoResults = results.filter(r => !r.isChannelResult);

  // Check if query matches a known channel
  const chLower = query.toLowerCase();
  const matchedChannel = state.channels.find(c =>
    c.title.toLowerCase().includes(chLower) || c.id.toLowerCase() === chLower
  );

  if (videoResults.length === 0 && channelResults.length === 0 && !matchedChannel) {
    dom.videoGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; background: rgba(255,255,255,0.03); border-radius: 16px;">
        <h3 style="color: #fff; font-size: 16px; margin-bottom: 8px;">No videos found for "${escapeHtml(query)}"</h3>
        <p style="color: #888; font-size: 13px; margin-bottom: 16px;">Check your spelling, try another keyword, or paste a YouTube video link.</p>
        <button class="btn-primary-action" onclick="state.searchQuery=''; if(dom.searchInput) dom.searchInput.value=''; loadVideos();">Back to Home Feed</button>
      </div>
    `;
    return;
  }

  // Render video results first
  renderVideoGrid(dom.videoGrid, videoResults);

  // Prepend Creator Channel Card if searching for a YouTuber
  if (channelResults.length > 0) {
    channelResults.reverse().forEach(ch => renderSearchChannelCard(ch));
  } else if (matchedChannel) {
    renderSearchChannelCard({
      channelId: matchedChannel.id,
      channelTitle: matchedChannel.title,
      channelAvatar: matchedChannel.avatar,
      subscriberCount: matchedChannel.subscriberCount,
      videoCount: `${matchedChannel.videoCount || 500}+ videos`,
      description: matchedChannel.description
    });
  }

  if (dom.videoCountBadge) {
    dom.videoCountBadge.textContent = `${videoResults.length} YouTube results`;
  }
}

// Real-Time Live YouTube Sync across Creator Feeds
async function syncLatestYouTubeUploads(showFeedback = true) {
  if (state.isSyncing) return;
  state.isSyncing = true;

  if (dom.syncIcon) dom.syncIcon.classList.add('spinning');
  if (showFeedback) showToast('⚡ Syncing latest uploads directly from YouTube...');

  const newlyDiscovered = [];
  const channelsToSync = state.channels.filter(c => c.ytChannelId);

  for (const channel of channelsToSync) {
    try {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.ytChannelId}`;
      let xmlText = null;

      if (window.AndroidBridge && window.AndroidBridge.fetchUrl) {
        xmlText = window.AndroidBridge.fetchUrl(feedUrl);
      }

      if (!xmlText) {
        try {
          const res = await fetch(`/api/proxy?url=${encodeURIComponent(feedUrl)}`);
          if (res.ok) xmlText = await res.text();
        } catch (e) {}
      }

      if (!xmlText) {
        try {
          const cRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`, {
            signal: AbortSignal.timeout(3000)
          });
          if (cRes.ok) xmlText = await cRes.text();
        } catch (e) {}
      }

      if (xmlText && xmlText.includes('<entry>')) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const entries = xmlDoc.querySelectorAll('entry');

        entries.forEach(entry => {
          const vidIdNode = entry.querySelector('videoId') || entry.querySelector('yt\\:videoId');
          const vidId = vidIdNode ? vidIdNode.textContent : null;
          const title = entry.querySelector('title')?.textContent;
          const published = entry.querySelector('published')?.textContent;

          if (vidId && title && !state.videos.some(v => v.id === vidId)) {
            const newVid = {
              id: vidId,
              title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
              channelId: channel.id,
              channelTitle: channel.title,
              channelAvatar: channel.avatar,
              subscriberCount: channel.subscriberCount,
              description: `Latest real-time YouTube upload from ${channel.title}.`,
              thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
              views: 'New Upload',
              uploadedAt: formatTimeAgo(new Date(published).getTime()),
              timestamp: new Date(published).getTime(),
              duration: 'NEW',
              category: 'Recently Uploaded',
              isNew: true,
              likes: '1.2K'
            };
            newlyDiscovered.push(newVid);
            state.videos.unshift(newVid);
            addNotification(newVid);
          }
        });
      }
    } catch (err) {
      console.warn('Sync failed for channel:', channel.title, err);
    }
  }

  // Also query server sync if available
  try {
    const sRes = await fetch('/api/sync');
    if (sRes.ok) {
      const sData = await sRes.json();
      if (sData.newVideos && sData.newVideos.length > 0) {
        sData.newVideos.forEach(v => {
          if (!state.videos.some(x => x.id === v.id)) {
            state.videos.unshift(v);
            newlyDiscovered.push(v);
            addNotification(v);
          }
        });
      }
    }
  } catch (e) {}

  state.lastSyncTime = Date.now();
  state.isSyncing = false;
  if (dom.syncIcon) dom.syncIcon.classList.remove('spinning');

  try {
    localStorage.setItem('asitube_cached_videos', JSON.stringify(state.videos));
  } catch (e) {}

  if (showFeedback) {
    if (newlyDiscovered.length > 0) {
      showToast(`🔥 Synced! ${newlyDiscovered.length} new videos found from YouTube creators.`);
    } else {
      showToast(`✅ YouTube Feeds are up to date! (${state.videos.length} videos available)`);
    }
  }

  if (state.currentView === 'subscriptions') {
    loadSubscriptionsFeed();
  } else if (!state.searchQuery) {
    renderVideoGrid(dom.videoGrid, state.videos);
  }
}

// Trigger Live Sync with YouTube (Button)
async function triggerSync() {
  await syncLatestYouTubeUploads(true);
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
