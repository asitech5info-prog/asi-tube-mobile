// ASI TUBE - Mobile Application Controller (Android Edition)

const App = {
  activeTab: 'downloader',
  activeFormatTab: 'video',

  init() {
    this.bindDomElements();
    this.bindEvents();
    this.initTheme();
    this.initSettings();
    this.loadHistory();
    this.checkAutoPaste();
  },

  // Haptic feedback trigger
  vibrate(duration = 25) {
    try {
      const enabled = localStorage.getItem('asi_haptic') !== 'false';
      if (enabled && navigator.vibrate) {
        navigator.vibrate(duration);
      }
    } catch (e) {}
  },

  bindDomElements() {
    // Inputs & Buttons
    this.mediaUrl = document.getElementById('media-url');
    this.downloadBtn = document.getElementById('download-btn');
    this.pasteBtn = document.getElementById('paste-btn');
    this.clearBtn = document.getElementById('clear-btn');
    this.errorMessage = document.getElementById('error-message');
    this.errorText = document.getElementById('error-text');
    
    // Result sections
    this.resultContainer = document.getElementById('result-container');
    this.loadingContainer = document.getElementById('loading-container');
    this.resultSection = document.getElementById('resultSection');

    // Title / Desc Copy
    this.copyTitleBtn = document.getElementById('copyTitleBtn');
    this.copyDescBtn = document.getElementById('copyDescBtn');
    this.copyBothBtn = document.getElementById('copyBothBtn');
    this.toggleDescBtn = document.getElementById('toggleDescBtn');
    this.resultDescription = document.getElementById('resultDescription');

    // Platform chips
    this.platformChips = document.querySelectorAll('.chip-item');

    // Bottom Navigation tabs
    this.navTabs = document.querySelectorAll('.nav-tab');
    this.tabViews = document.querySelectorAll('.tab-view');

    // Search view elements
    this.searchInput = document.getElementById('search-input');
    this.searchSubmitBtn = document.getElementById('search-submit-btn');
    this.searchClearBtn = document.getElementById('search-clear-btn');
    this.searchLoading = document.getElementById('searchLoading');
    this.searchTags = document.querySelectorAll('.search-tag');

    // Settings & History
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    this.themeToggle = document.getElementById('theme-toggle');
    this.themeToggleSetting = document.getElementById('themeToggleSetting');
    this.autoPasteToggle = document.getElementById('autoPasteToggle');
    this.hapticToggle = document.getElementById('hapticToggle');
    this.defaultQualitySelect = document.getElementById('defaultQualitySelect');
    this.backendUrlInput = document.getElementById('backendUrlInput');
    this.saveBackendBtn = document.getElementById('saveBackendBtn');
    this.testConnectionBtn = document.getElementById('testConnectionBtn');
    this.connectionTestResult = document.getElementById('connectionTestResult');
  },

  initTheme() {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode');
        this.updateThemeLabels('Light');
      } else {
        this.updateThemeLabels('Dark');
      }
    } catch (e) {}
  },

  updateThemeLabels(label) {
    if (this.themeToggleSetting) {
      const span = this.themeToggleSetting.querySelector('.theme-label');
      if (span) span.textContent = label;
    }
  },

  toggleTheme() {
    this.vibrate(20);
    const isLight = document.documentElement.classList.toggle('light-mode');
    const newTheme = isLight ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {}
    this.updateThemeLabels(isLight ? 'Light' : 'Dark');
  },

  initSettings() {
    try {
      if (this.autoPasteToggle) {
        this.autoPasteToggle.checked = localStorage.getItem('asi_autopaste') !== 'false';
      }
      if (this.hapticToggle) {
        this.hapticToggle.checked = localStorage.getItem('asi_haptic') !== 'false';
      }
      if (this.defaultQualitySelect) {
        const q = localStorage.getItem('asi_default_quality');
        if (q) this.defaultQualitySelect.value = q;
      }
      if (this.backendUrlInput) {
        const u = localStorage.getItem('asi_backend_url');
        if (u) this.backendUrlInput.value = u;
      }
    } catch (e) {}
  },

  // Auto-paste link from clipboard if enabled
  async checkAutoPaste() {
    const auto = localStorage.getItem('asi_autopaste') !== 'false';
    if (!auto) return;

    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('tiktok.com') || text.includes('instagram.com') || text.includes('facebook.com'))) {
          if (this.mediaUrl && !this.mediaUrl.value) {
            this.mediaUrl.value = text.trim();
            if (this.clearBtn) this.clearBtn.classList.remove('hidden');
            UI.showToast('Link detected from clipboard!', 'success');
          }
        }
      }
    } catch (e) {
      // Clipboard permission prompt or unavailable
    }
  },

  // Switch Bottom Navigation Tab
  switchTab(tabName) {
    this.vibrate(15);
    this.activeTab = tabName;

    // Update bottom nav active state
    this.navTabs.forEach(t => {
      if (t.dataset.tab === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    // Update views
    this.tabViews.forEach(v => {
      if (v.id === `view-${tabName}`) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    if (tabName === 'downloads') {
      this.loadHistory();
    }
  },

  // Switch Video / Audio / Thumbnails format segmented control
  switchFormatTab(fmt) {
    this.vibrate(15);
    this.activeFormatTab = fmt;

    document.querySelectorAll('.seg-tab').forEach(t => {
      if (t.dataset.fmt === fmt) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    if (window.currentVideoData) {
      if (fmt === 'video') {
        UI.renderVideoFormats(window.currentVideoData.formats?.video || [], window.currentVideoData);
      } else if (fmt === 'audio') {
        UI.renderAudioFormats(window.currentVideoData.formats?.audio || [], window.currentVideoData);
      } else if (fmt === 'thumbnails') {
        UI.renderThumbnailFormats(window.currentVideoData.formats?.thumbnails || [], window.currentVideoData);
      }
    }
  },

  // Robust Clipboard Copy Action
  async copyToClipboard(text, btnElement, successMsg) {
    this.vibrate(30);
    if (!text) {
      UI.showToast('Nothing to copy', 'warning');
      return;
    }

    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        textarea.remove();
      }
    } catch (e) {}

    if (copied) {
      if (btnElement) {
        btnElement.classList.add('copied');
        setTimeout(() => btnElement.classList.remove('copied'), 2000);
      }
      UI.showToast(successMsg || 'Copied to clipboard!', 'success');
    } else {
      UI.showToast('Could not access clipboard', 'error');
    }
  },

  // Process Video URL Submission
  async processUrl(inputUrl) {
    const trimmed = (inputUrl || '').trim();
    if (!trimmed) {
      this.showError('Please paste a video link first.');
      return;
    }

    this.vibrate(25);
    if (this.errorMessage) this.errorMessage.classList.add('hidden');
    if (this.downloadBtn) this.downloadBtn.disabled = true;

    // Show loading spinner
    if (this.resultContainer) this.resultContainer.classList.remove('hidden');
    if (this.loadingContainer) this.loadingContainer.classList.remove('hidden');
    if (this.resultSection) this.resultSection.classList.add('hidden');

    try {
      const data = await API.getInfo(trimmed);
      if (!data || data.error) {
        throw new Error(data?.error || 'Could not extract video details.');
      }

      if (this.loadingContainer) this.loadingContainer.classList.add('hidden');
      if (this.resultSection) this.resultSection.classList.remove('hidden');

      UI.renderResult(data);
      this.switchFormatTab('video');
      this.vibrate(40);
    } catch (err) {
      console.error('Extraction error:', err);
      if (this.loadingContainer) this.loadingContainer.classList.add('hidden');
      this.showError(err.message || 'Failed to fetch video details. Verify the link is public.');
    } finally {
      if (this.downloadBtn) this.downloadBtn.disabled = false;
    }
  },

  showError(msg) {
    this.vibrate([40, 60, 40]);
    if (this.errorMessage && this.errorText) {
      this.errorText.textContent = msg;
      this.errorMessage.classList.remove('hidden');
    }
  },

  // Load URL into Downloader from Search / External action
  loadUrlToDownloader(encodedUrl) {
    const rawUrl = decodeURIComponent(encodedUrl);
    this.switchTab('downloader');
    if (this.mediaUrl) {
      this.mediaUrl.value = rawUrl;
      if (this.clearBtn) this.clearBtn.classList.remove('hidden');
      this.processUrl(rawUrl);
    }
  },

  // Trigger Download
  async triggerDownload(encodedUrl, quality, format, isAudio, encodedTitle, encodedDirectUrl) {
    this.vibrate(30);
    const rawUrl = decodeURIComponent(encodedUrl || '');
    const rawTitle = decodeURIComponent(encodedTitle || 'video');
    const directUrl = encodedDirectUrl ? decodeURIComponent(encodedDirectUrl) : '';

    const modalHandler = UI.showDownloadModal(rawTitle, quality, format);

    try {
      const result = await API.getDownload(rawUrl, quality, format, isAudio, rawTitle, directUrl);
      if (result && result.downloadUrl) {
        modalHandler.finish(result.downloadUrl, result.filename);
        this.saveDownloadHistory({
          title: rawTitle,
          url: rawUrl,
          downloadUrl: result.downloadUrl,
          filename: result.filename,
          quality: quality || '1080',
          format: format || 'mp4',
          timestamp: Date.now()
        });
        this.vibrate([30, 50, 30]);
      } else {
        throw new Error('Download link could not be generated.');
      }
    } catch (err) {
      console.error('Download error:', err);
      modalHandler.error(err.message || 'Download failed.');
    }
  },

  // Downloads History Management
  loadHistory() {
    try {
      const stored = localStorage.getItem('asi_downloads_history');
      const list = stored ? JSON.parse(stored) : [];
      UI.renderDownloadsHistory(list);
    } catch (e) {
      UI.renderDownloadsHistory([]);
    }
  },

  saveDownloadHistory(item) {
    try {
      const stored = localStorage.getItem('asi_downloads_history');
      let list = stored ? JSON.parse(stored) : [];
      list.unshift(item);
      if (list.length > 50) list = list.slice(0, 50);
      localStorage.setItem('asi_downloads_history', JSON.stringify(list));
      this.loadHistory();
    } catch (e) {}
  },

  removeHistoryItem(idx) {
    this.vibrate(20);
    try {
      const stored = localStorage.getItem('asi_downloads_history');
      if (stored) {
        let list = JSON.parse(stored);
        list.splice(idx, 1);
        localStorage.setItem('asi_downloads_history', JSON.stringify(list));
        this.loadHistory();
        UI.showToast('Item removed from history');
      }
    } catch (e) {}
  },

  clearAllHistory() {
    this.vibrate(30);
    localStorage.removeItem('asi_downloads_history');
    this.loadHistory();
    UI.showToast('Download history cleared');
  },

  // Search Action
  async handleSearch(query) {
    const q = (query || '').trim();
    if (!q) return;

    this.vibrate(25);
    if (this.searchLoading) this.searchLoading.classList.remove('hidden');

    try {
      const results = await API.search(q);
      if (this.searchLoading) this.searchLoading.classList.add('hidden');
      UI.renderSearchResults(results);
    } catch (e) {
      if (this.searchLoading) this.searchLoading.classList.add('hidden');
      UI.showToast('Search failed', 'error');
    }
  },

  bindEvents() {
    // Bottom Nav Tabs Click
    this.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        if (tabName) this.switchTab(tabName);
      });
    });

    // Start Button
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => {
        const val = this.mediaUrl?.value;
        this.processUrl(val);
      });
    }

    // Paste Button
    if (this.pasteBtn) {
      this.pasteBtn.addEventListener('click', async () => {
        this.vibrate(20);
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
              this.mediaUrl.value = text.trim();
              if (this.clearBtn) this.clearBtn.classList.remove('hidden');
              this.processUrl(text.trim());
              return;
            }
          }
          UI.showToast('Please paste manually', 'warning');
        } catch (e) {
          UI.showToast('Clipboard access denied', 'error');
        }
      });
    }

    // Input Enter Key
    if (this.mediaUrl) {
      this.mediaUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.processUrl(this.mediaUrl.value);
        }
      });

      this.mediaUrl.addEventListener('input', () => {
        if (this.errorMessage) this.errorMessage.classList.add('hidden');
        if (this.clearBtn) {
          if (this.mediaUrl.value.length > 0) {
            this.clearBtn.classList.remove('hidden');
          } else {
            this.clearBtn.classList.add('hidden');
          }
        }
      });
    }

    // Clear Button
    if (this.clearBtn && this.mediaUrl) {
      this.clearBtn.addEventListener('click', () => {
        this.vibrate(15);
        this.mediaUrl.value = '';
        this.clearBtn.classList.add('hidden');
        if (this.errorMessage) this.errorMessage.classList.add('hidden');
        if (this.resultContainer) this.resultContainer.classList.add('hidden');
        this.mediaUrl.focus();
      });
    }

    // Platform Filter Chips
    this.platformChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.vibrate(15);
        this.platformChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (this.mediaUrl) this.mediaUrl.focus();
      });
    });

    // Format Segmented Tabs (Video / Audio / Thumbnails)
    document.querySelectorAll('.seg-tab').forEach(t => {
      t.addEventListener('click', () => {
        const fmt = t.dataset.fmt;
        if (fmt) this.switchFormatTab(fmt);
      });
    });

    // Copy Title Button
    if (this.copyTitleBtn) {
      this.copyTitleBtn.addEventListener('click', () => {
        if (window.currentVideoData?.title) {
          this.copyToClipboard(window.currentVideoData.title, this.copyTitleBtn, 'Video title copied!');
        }
      });
    }

    // Copy Description Button
    if (this.copyDescBtn) {
      this.copyDescBtn.addEventListener('click', () => {
        if (window.currentVideoData?.description) {
          this.copyToClipboard(window.currentVideoData.description, this.copyDescBtn, 'Description copied!');
        }
      });
    }

    // Copy Both Button
    if (this.copyBothBtn) {
      this.copyBothBtn.addEventListener('click', () => {
        if (window.currentVideoData) {
          const t = window.currentVideoData.title || '';
          const d = window.currentVideoData.description || '';
          const combined = d ? `${t}\n\n${d}` : t;
          this.copyToClipboard(combined, this.copyBothBtn, 'Title and description copied!');
        }
      });
    }

    // Toggle Description Show More/Less
    if (this.toggleDescBtn && this.resultDescription) {
      this.toggleDescBtn.addEventListener('click', () => {
        this.vibrate(15);
        const isCollapsed = this.resultDescription.classList.contains('collapsed');
        if (isCollapsed) {
          this.resultDescription.classList.remove('collapsed');
          this.toggleDescBtn.textContent = 'Show less';
        } else {
          this.resultDescription.classList.add('collapsed');
          this.toggleDescBtn.textContent = 'Show more';
        }
      });
    }

    // Search submit
    if (this.searchSubmitBtn && this.searchInput) {
      this.searchSubmitBtn.addEventListener('click', () => {
        this.handleSearch(this.searchInput.value);
      });
      this.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch(this.searchInput.value);
        }
      });
    }

    // Search Clear Button
    if (this.searchClearBtn && this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        if (this.searchInput.value.length > 0) {
          this.searchClearBtn.classList.remove('hidden');
        } else {
          this.searchClearBtn.classList.add('hidden');
        }
      });
      this.searchClearBtn.addEventListener('click', () => {
        this.searchInput.value = '';
        this.searchClearBtn.classList.add('hidden');
        this.searchInput.focus();
      });
    }

    // Search Tag Chips
    this.searchTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const q = tag.dataset.query;
        if (this.searchInput && q) {
          this.searchInput.value = q;
          if (this.searchClearBtn) this.searchClearBtn.classList.remove('hidden');
          this.handleSearch(q);
        }
      });
    });

    // Clear History Button
    if (this.clearHistoryBtn) {
      this.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Clear all downloaded history?')) {
          this.clearAllHistory();
        }
      });
    }

    // Theme toggles
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    if (this.themeToggleSetting) {
      this.themeToggleSetting.addEventListener('click', () => this.toggleTheme());
    }

    // Auto-Paste Toggle
    if (this.autoPasteToggle) {
      this.autoPasteToggle.addEventListener('change', (e) => {
        this.vibrate(15);
        localStorage.setItem('asi_autopaste', e.target.checked);
      });
    }

    // Haptic Toggle
    if (this.hapticToggle) {
      this.hapticToggle.addEventListener('change', (e) => {
        this.vibrate(25);
        localStorage.setItem('asi_haptic', e.target.checked);
      });
    }

    // Default Quality
    if (this.defaultQualitySelect) {
      this.defaultQualitySelect.addEventListener('change', (e) => {
        this.vibrate(15);
        localStorage.setItem('asi_default_quality', e.target.value);
      });
    }

    // Backend URL Save
    if (this.saveBackendBtn && this.backendUrlInput) {
      this.saveBackendBtn.addEventListener('click', () => {
        this.vibrate(20);
        const u = this.backendUrlInput.value.trim();
        localStorage.setItem('asi_backend_url', u);
        UI.showToast('Backend URL saved!');
      });
    }

    // Test Connection Button
    if (this.testConnectionBtn && this.connectionTestResult) {
      this.testConnectionBtn.addEventListener('click', async () => {
        this.vibrate(15);
        this.connectionTestResult.textContent = 'Testing...';
        this.connectionTestResult.style.color = 'var(--text-muted)';
        const target = this.backendUrlInput ? this.backendUrlInput.value.trim() : '';
        const res = await API.testConnection(target);
        this.connectionTestResult.textContent = res.message;
        this.connectionTestResult.style.color = res.ok ? 'var(--success)' : 'var(--error)';
      });
    }
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
