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
          <button
            class="btn-card-download"
            onclick="App.saveImageInApp('${safeUrl}', '${safeTitle}')"
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Save Image</span>
          </button>
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
        <div class="empty-downloads-state">
          <div class="empty-icon-cloud">📁</div>
          <h3>No Downloads Yet</h3>
          <p>Downloaded videos and songs will appear right here in your in-app library.</p>
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
            <button
              class="btn-history-action"
              onclick="UI.playInApp('${encodeURIComponent(item.downloadUrl)}', '${encodeURIComponent(item.title)}', '${item.format}')"
              title="Play In-App"
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <button
              class="btn-history-action"
              onclick="App.redownloadHistoryItem('${encodeURIComponent(item.downloadUrl)}', '${encodeURIComponent(item.filename)}', ${isAudio})"
              title="Save to Storage"
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
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
      finish: (downloadUrl, filename, isAudio) => {
        if (UI.activeModalInterval) clearInterval(UI.activeModalInterval);
        if (modalProgress) modalProgress.style.width = '100%';
        if (modalStatus) modalStatus.textContent = 'Download started! File saving directly to phone...';

        // Native Android in-app download (Never exits app!)
        if (window.AndroidDownloader && window.AndroidDownloader.downloadFile) {
          window.AndroidDownloader.downloadFile(
            downloadUrl,
            filename,
            isAudio ? 'audio/mpeg' : 'video/mp4'
          );
        } else {
          // Browser / PWA fallback
          try {
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.setAttribute('download', filename || 'video.mp4');
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 200);
          } catch (e) {}
        }

        if (modalActionArea) {
          modalActionArea.innerHTML = `
            <div class="inapp-success-box">
              <div class="inapp-check-circle">✓</div>
              <div class="inapp-success-info">
                <h4>Downloading in Background</h4>
                <p>Saved to your phone's <b>Download</b> folder.</p>
              </div>
            </div>
            <button
              onclick="UI.closeModal(); App.switchTab('downloads');"
              class="btn-primary"
              style="width: 100%; margin-top: 12px;"
              type="button"
            >
              <span>View in Library</span>
            </button>
          `;
        }

        setTimeout(() => {
          UI.closeModal();
        }, 3200);
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

  // In-App Media Player
  playInApp(encodedUrl, encodedTitle, format) {
    const url = decodeURIComponent(encodedUrl);
    const title = decodeURIComponent(encodedTitle || 'Media Player');
    const modal = document.getElementById('playerModal');
    const modalTitle = document.getElementById('playerModalTitle');
    const videoPlayer = document.getElementById('inAppVideoPlayer');
    const audioPlayer = document.getElementById('inAppAudioPlayer');
    const dlBtn = document.getElementById('playerDownloadBtn');

    if (modalTitle) modalTitle.textContent = title.length > 28 ? title.slice(0, 28) + '...' : title;

    const isAudio = format === 'mp3' || format === 'm4a';
    if (isAudio) {
      if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.classList.add('hidden');
      }
      if (audioPlayer) {
        audioPlayer.src = url;
        audioPlayer.classList.remove('hidden');
        audioPlayer.play().catch(() => {});
      }
    } else {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.classList.add('hidden');
      }
      if (videoPlayer) {
        videoPlayer.src = url;
        videoPlayer.classList.remove('hidden');
        videoPlayer.play().catch(() => {});
      }
    }

    if (dlBtn) {
      dlBtn.onclick = () => {
        App.redownloadHistoryItem(encodedUrl, encodeURIComponent(title + '.' + (isAudio ? 'mp3' : 'mp4')), isAudio);
      };
    }

    if (modal) modal.style.display = 'flex';
  },

  closePlayerModal() {
    const modal = document.getElementById('playerModal');
    const videoPlayer = document.getElementById('inAppVideoPlayer');
    const audioPlayer = document.getElementById('inAppAudioPlayer');
    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.src = '';
    }
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.src = '';
    }
    if (modal) modal.style.display = 'none';
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
