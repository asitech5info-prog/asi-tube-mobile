# asi tube (AsiTube) 🎬📱

> **Pure, Ad-Free YouTube Experience with Real-Time Live Sync, Subscriptions, Playlists & Playback Resume**

[![Release](https://img.shields.io/github/v/release/asitech5info-prog/asi-tube?color=red)](https://github.com/asitech5info-prog/asi-tube/releases)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-brightgreen)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

**asi tube** is an ad-free streaming client and Android application designed to give you uninterrupted YouTube viewing with true real-time synchronization, dedicated subscriptions for your favorite creators, custom playlists, and smart playback memory.

---

## ✨ Features

- 🚫 **100% Ad-Free Video Playback**: Stream any YouTube video with zero ads, zero pre-rolls, and zero mid-rolls.
- ⚡ **Real-Time YouTube Upload Sync**: Integrated Server-Sent Events (SSE) stream live notifications and new uploads directly from YouTube creator feeds without refreshing.
- 📺 **Watch Later & Custom Playlists**: Save any video to built-in **Watch Later** or create your own custom playlists directly from video cards or while watching.
- ⏱️ **Smart Playback Resume**: Remembers the exact second where you left off. Shows a red watch progress bar on video cards and automatically resumes playback when reopened.
- 👥 **Separated Favorite Creators**: Dedicated Subscriptions feed with creator stories, live upload badges, and full subscription management.
- 🔍 **Universal YouTube Search**: Search and watch any video across YouTube with live search and link resolution.
- 📱 **Native Android AMOLED Dark UI**: Clean, distraction-free interface optimized for mobile and desktop screens.

---

## 📲 Download Android APK

Get the official **asi tube** Android APK from our GitHub Releases:

👉 **[Download Latest APK from Releases](https://github.com/asitech5info-prog/asi-tube/releases/latest)**

1. Download `asi-tube-v1.0.apk` onto your Android device.
2. Tap the APK file and select **Install** (allow installation from unknown sources if prompted).
3. Enjoy uninterrupted YouTube streaming!

---

## 🚀 Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/asitech5info-prog/asi-tube.git
   cd asi-tube
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   node server.js
   ```

4. **Open in browser**:
   - PC: `http://localhost:3000`
   - Android Mobile: `http://<your-ip>:3000` (Add to Home screen for PWA)

---

## 🧪 Testing with Playwright

Run the automated test suite with Android emulation:
```bash
node test-playwright.js
```

---

## 📄 License

MIT License. Designed with ❤️ for clean, ad-free streaming.

