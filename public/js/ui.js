// ASI TUBE - UI Renderer for Android Mobile App

const UI = {
  activeModalInterval: null,

  // Render main video result preview
  renderResult(data) {
    window.currentVideoData = data;

    const thumb = document.getElementById('resultThumb');
    const title = document.getElementById('resultTitle');
    const channel = document.getElementById('resultChannel');
    const views = document.getElementById('resultViews');
    const duration = document.getElementById('durationBadge');
    const platform = document.getElementById('resultPlatform');
    const desc = document.getElementById('resultDescription');
    const descContainer = document.getElementById('videoDescContainer');

    if (thumb) thumb.src = data.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
    if (title) title.textContent = data.title || 'Untitled Video';
    if (channel) channel.textContent = data.author || 'Creator';
    if (views) views.textContent = data.viewsFormatted || 'Trending';
    if (duration) duration.textContent = data.durationFormatted || 'HD';

    if (platform) {
      const plat = (data.platform || 'youtube').toLowerCase();
      platform.textContent = plat.charAt(0).toUpperCase() + plat.slice(1);
      platform.className = `platform-pill badge-${plat}`;
    }

    // Description
    if (descContainer && desc) {
      if (data.description && data.description.trim()) {
        desc.textContent = data.description;
        descContainer.classList.remove('hidden');
      } else {
        descContainer.classList.add('hidden');
      }
    }

    // Render initial format tab (video)
    this.renderVideoFormats(data.formats?.video || [], data);
  },

  // Render Video Format Cards (Mobile Card Architecture)
  renderVideoFormats(formats, data) {
    const container = document.getElementById('formatCardsList');
    if (!container) return;

    if (!formats || formats.length === 0) {
      container.innerHTML = `<div class="empty-search-state"><p>No video formats available for this media.</p></div>`;
      return;
    }

    container.innerHTML = formats.map(f => {
      const quality = f.quality || '1080';
      const label = f.resolution || `${quality}p HD`;
      const format = (f.format || 'mp4').toUpperCase();
      const size = f.estimatedSize || '~ MB';
      const note = f.note || (quality >= 1080 ? 'Full HD' : 'Standard');
      const directUrl = f.directUrl ? encodeURIComponent(f.directUrl) : '';
      const safeTitle = encodeURIComponent(data.title || 'video');
      const safeUrl = encodeURIComponent(data.url);

      return `
        <div class="format-card">
          <div class="format-info-col">
            <div class="format-title-row">
              <span class="format-quality-name">${label}</span>
              <span class="format-ext-badge">${format}</span>
            </div>
            <div class="format-meta-sub">
              <span>${note}</span>
              <span>•</span>
              <span class="format-size-tag">${size}</span>
            </div>
          </div>
          <button
            class="btn-card-download"
            onclick="App.triggerDownload('${safeUrl}', '${quality}', 'mp4', false, '${safeTitle}', '${directUrl}')"
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download</span>
          </button>
        </div>
      `;
    }).join('');
  },

  // Render Audio Format Cards
  renderAudioFormats(formats, data) {
    const container = document.getElementById('formatCardsList');
    if (!container) return;

    if (!formats || formats.length === 0) {
      container.innerHTML = `<div class="empty-search-state"><p>No audio formats available.</p></div>`;
      return;
    }

    container.innerHTML = formats.map(f => {
      const quality = f.quality || '320';
      const label = f.bitrate || `${quality} kbps MP3`;
      const format = (f.format || 'mp3').toUpperCase();
      const size = f.estimatedSize || '~ 6 MB';
      const note = f.note || 'Studio Audio';
      const directUrl = f.directUrl ? encodeURIComponent(f.directUrl) : '';
      const safeTitle = encodeURIComponent(data.title || 'audio');
      const safeUrl = encodeURIComponent(data.url);

      return `
        <div class="format-card">
          <div class="format-info-col">
            <div class="format-title-row">
              <span class="format-quality-name">${label}</span>
              <span class="format-ext-badge">${format}</span>
            </div>
            <div class="format-meta-sub">
              <span>${note}</span>
              <span>•</span>
              <span class="format-size-tag">${size}</span>
            </div>
          </div>
          <button
            class="btn-card-download"
            onclick="App.triggerDownload('${safeUrl}', '${quality}', '${(f.format || 'mp3').toLowerCase()}', true, '${safeTitle}', '${directUrl}')"
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download</span>
          </button>
        </div>
      `;
    }).join('');
  },

  // Render Thumbnail Format Cards
  renderThumbnailFormats(thumbnails, data) {
    const container = document.getElementById('formatCardsList');
    if (!container) return;

    if (!thumbnails || thumbnails.length === 0) {
      container.innerHTML = `<div class="empty-search-state"><p>No cover images available.</p></div>`;
      return;
    }

    container.innerHTML = thumbnails.map(t => {
      const label = t.resolution || 'HD Cover';
      const quality = t.quality || 'Original Image';
      const url = t.url || data.thumbnail;
      const safeUrl = encodeURIComponent(url);
      const safeTitle = encodeURIComponent((data.title || 'cover') + '_thumbnail.jpg');

      return `
        <div class="format-card">
          <div class="format-info-col">
            <div class="format-title-row">
              <span class="format-quality-name">${label}</span>
              <span class="format-ext-badge">JPG</span>
            </div>
            <div class="format-meta-sub">
              <span>${quality}</span>
            </div>
          </div>
          <a
            class="btn-card-download"
            href="${url}"
            target="_blank"
            download="${decodeURIComponent(safeTitle)}"
            style="text-decoration: none;"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Save Image</span>
          </a>
        </div>
      `;
    }).join('');
  },

  // Render Search Results
  renderSearchResults(results) {
    const container = document.getElementById('searchResultsList');
    if (!container) return;

    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="empty-search-state">
          <p>No search results found. Try different keywords.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(item => {
      const safeUrl = encodeURIComponent(item.url);
      return `
        <div class="search-card">
          <div class="search-thumb-box">
            <img class="search-thumb" src="${item.thumbnail}" alt="Thumb" loading="lazy" />
            <span class="duration-pill">${item.durationFormatted}</span>
          </div>
          <div class="search-details">
            <h3 class="search-title">${item.title}</h3>
            <div class="search-meta-line">${item.author} • ${item.viewsFormatted}</div>
            <div class="search-action-row">
              <button
                class="btn-search-dl"
                onclick="App.loadUrlToDownloader('${safeUrl}')"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Render Downloads History
  renderDownloadsHistory(historyList) {
    const container = document.getElementById('downloadsList');
    const badge = document.getElementById('historyBadge');
    if (!container) return;

    if (badge) {
      if (historyList.length > 0) {
        badge.textContent = historyList.length;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (!historyList || historyList.length === 0) {
      container.innerHTML = `
        <div class="empty-search-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>Library is Empty</h3>
          <p>Downloaded videos and songs will appear here for easy replay and sharing.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = historyList.map((item, idx) => {
      const isAudio = item.format === 'mp3' || item.format === 'm4a';
      const icon = isAudio ? '🎵' : '🎬';
      return `
        <div class="history-card">
          <div class="history-icon-box">${icon}</div>
          <div class="history-info">
            <div class="history-name">${item.title}</div>
            <div class="history-meta">
              <span>${item.quality} ${item.format.toUpperCase()}</span>
              <span>•</span>
              <span>${new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
          <div class="history-actions">
            <a
              href="${item.downloadUrl}"
              download="${item.filename}"
              class="btn-history-action"
              title="Download Again"
              target="_blank"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </a>
            <button
              class="btn-history-action"
              onclick="App.removeHistoryItem(${idx})"
              title="Delete"
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // Download Bottom Sheet Modal
  showDownloadModal(title, quality, format) {
    const modal = document.getElementById('downloadModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalStatus = document.getElementById('modalStatus');
    const modalProgress = document.getElementById('modalProgress');
    const modalActionArea = document.getElementById('modalActionArea');

    if (modal) modal.style.display = 'flex';
    if (modalTitle) modalTitle.textContent = title.length > 30 ? title.substring(0, 30) + '...' : title;
    if (modalStatus) modalStatus.textContent = `Resolving ${quality ? quality + 'p ' : ''}${format.toUpperCase()} stream...`;
    if (modalProgress) modalProgress.style.width = '20%';
    if (modalActionArea) modalActionArea.innerHTML = '';

    if (this.activeModalInterval) clearInterval(this.activeModalInterval);
    let pct = 20;
    this.activeModalInterval = setInterval(() => {
      if (pct < 85) {
        pct += 12;
        if (modalProgress) modalProgress.style.width = `${pct}%`;
      }
    }, 400);

    return {
      finish: (downloadUrl, filename) => {
        if (UI.activeModalInterval) clearInterval(UI.activeModalInterval);
        if (modalProgress) modalProgress.style.width = '100%';
        if (modalStatus) modalStatus.textContent = 'Stream ready! Starting download...';

        // Auto trigger download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.setAttribute('download', filename || 'video.mp4');
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();

        if (modalActionArea) {
          modalActionArea.innerHTML = `
            <a
              href="${downloadUrl}"
              download="${filename}"
              target="_blank"
              class="btn-primary"
              style="text-decoration: none; width: 100%;"
            >
              <span>Download File Again</span>
            </a>
          `;
        }

        setTimeout(() => {
          UI.closeModal();
        }, 3500);
      },
      error: (msg) => {
        if (UI.activeModalInterval) clearInterval(UI.activeModalInterval);
        if (modalStatus) modalStatus.textContent = `Error: ${msg}`;
        if (modalProgress) {
          modalProgress.style.width = '100%';
          modalProgress.style.backgroundColor = 'var(--error)';
        }
      }
    };
  },

  closeModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) modal.style.display = 'none';
    if (this.activeModalInterval) clearInterval(this.activeModalInterval);
  },

  // Toast System
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  }
};

window.UI = UI;
