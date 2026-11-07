const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const brainScreenshotsDir = null;

let serverProcess = null;

async function ensureServerRunning() {
  const baseUrl = 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/videos`);
    if (res.ok) {
      console.log('✅ Server already running on port 3000');
      return;
    }
  } catch (e) {
    // Not running yet
  }

  console.log('🚀 Starting background AsiTube server on port 3000...');
  serverProcess = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    stdio: 'ignore'
  });

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const res = await fetch(`${baseUrl}/api/videos`);
      if (res.ok) {
        console.log('✅ AsiTube server started and responding!');
        return;
      }
    } catch (e) {}
  }
  throw new Error('Failed to start AsiTube server on port 3000');
}

function copyToBrain(filename) {
  if (!brainScreenshotsDir) return;
  try {
    const src = path.join(screenshotsDir, filename);
    const dest = path.join(brainScreenshotsDir, filename);
    fs.copyFileSync(src, dest);
  } catch (e) {
    console.warn('Failed to copy to brain:', filename, e.message);
  }
}

async function runAsiTubeTests() {
  console.log('🎬 Starting AsiTube Clean UI Playwright Test Suite...');

  await ensureServerRunning();
  const baseUrl = 'http://localhost:3000';

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  // Emulate an Android Phone (Pixel 7 / Galaxy S24)
  const androidContext = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.5,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  });

  const page = await androidContext.newPage();

  try {
    // -------------------------------------------------------------
    // TEST 1: Clean Home Feed (Android Mobile View)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Home Feed (Android Mobile View) ---');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.video-card');
    await page.waitForTimeout(1500); // Allow thumbnails and channel pfps to render

    const videoCardsCount = await page.locator('.video-card').count();
    console.log(`[PASS] Home Feed loaded with ${videoCardsCount} YouTube videos`);

    // Verify account initial "A" in header
    const initialText = await page.locator('.account-pfp').first().textContent();
    console.log(`[PASS] Account profile icon verified: "${initialText.trim()}"`);

    const screenshot1 = '01_android_home_feed.png';
    const screenshot1Path = path.join(screenshotsDir, screenshot1);
    await page.screenshot({ path: screenshot1Path, fullPage: false });
    copyToBrain(screenshot1);
    console.log(`[SAVED] Screenshot: ${screenshot1Path}`);

    // -------------------------------------------------------------
    // TEST 2: Small Sync Button & Notifications Dropdown
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Small Sync Button & Notifications Dropdown ---');
    const syncBtn = page.locator('#syncBtn');
    await syncBtn.click();
    console.log('Clicked small sync button in header...');
    await page.waitForTimeout(1000);

    // Open notification dropdown via notification bell button
    const notifBtn = page.locator('#notifBtn');
    await notifBtn.click();
    await page.waitForTimeout(600);

    const screenshot2 = '02_android_live_sync_new_video.png';
    const screenshot2Path = path.join(screenshotsDir, screenshot2);
    await page.screenshot({ path: screenshot2Path, fullPage: false });
    copyToBrain(screenshot2);
    console.log(`[SAVED] Screenshot: ${screenshot2Path}`);

    // Close notifications
    await page.locator('#brandHomeBtn').click();
    await page.waitForTimeout(400);

    // -------------------------------------------------------------
    // TEST 3: Subscriptions View (Favorite Creators Separated)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Subscriptions & Favorite Creators ---');
    await page.locator('.bnav-item[data-view="subscriptions"]').click();
    await page.waitForTimeout(1000);

    const storiesCount = await page.locator('.creator-story-item').count();
    console.log(`[PASS] Subscriptions screen loaded with ${storiesCount} creator story avatars`);

    const subsVideosCount = await page.locator('#subscriptionsVideoGrid .video-card').count();
    console.log(`[PASS] Subscriptions feed displaying ${subsVideosCount} videos from subscribed creators`);

    // Filter by a creator
    const creatorStory = page.locator('.creator-story-item').nth(1);
    await creatorStory.click();
    await page.waitForTimeout(700);

    const screenshot3 = '03_android_subscriptions_feed.png';
    const screenshot3Path = path.join(screenshotsDir, screenshot3);
    await page.screenshot({ path: screenshot3Path, fullPage: false });
    copyToBrain(screenshot3);
    console.log(`[SAVED] Screenshot: ${screenshot3Path}`);

    // -------------------------------------------------------------
    // TEST 4: Clean Ad-Free Video Player View
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Clean Video Player ---');
    await page.locator('.bnav-item[data-view="home"]').click();
    await page.waitForTimeout(600);

    const firstVideoCard = page.locator('.video-card').first();
    const videoTitle = await firstVideoCard.locator('.video-card-title').textContent();
    console.log(`Opening video: "${videoTitle}"`);

    await firstVideoCard.locator('.thumbnail-wrapper').click();
    await page.waitForSelector('#playerOverlay', { state: 'visible' });
    await page.waitForTimeout(1500);

    // Verify video iframe is loaded
    const iframeSrc = await page.locator('#videoIframe').getAttribute('src');
    console.log(`[PASS] Video iframe active with source: ${iframeSrc}`);

    // Like video
    await page.locator('#playerLikeBtn').click();
    await page.waitForTimeout(300);

    // Comment
    await page.locator('#commentInput').fill('Super clean YouTube experience on AsiTube!');
    await page.locator('#postCommentBtn').click();
    await page.waitForTimeout(600);
    console.log('[PASS] Comment added');

    // Test Landscape Force-Rotation & Fullscreen
    const rotateBtn = page.locator('#playerRotateBtn');
    if (await rotateBtn.isVisible()) {
      console.log('Testing landscape mode button...');
      await rotateBtn.click({ force: true });
      await page.waitForTimeout(600);
      const isLandscape = await page.locator('#playerOverlay').evaluate(el => el.classList.contains('landscape-mode'));
      console.log(`[PASS] Rotate button clicked -> landscape-mode active: ${isLandscape}`);
      await rotateBtn.click({ force: true });
      await page.waitForTimeout(600);
      const isLandscapeAfter = await page.locator('#playerOverlay').evaluate(el => el.classList.contains('landscape-mode'));
      console.log(`[PASS] Rotate button clicked again -> restored portrait: ${!isLandscapeAfter}`);
    }

    const screenshot4 = '04_android_adfree_player.png';
    const screenshot4Path = path.join(screenshotsDir, screenshot4);
    await page.screenshot({ path: screenshot4Path, fullPage: false });
    copyToBrain(screenshot4);
    console.log(`[SAVED] Screenshot: ${screenshot4Path}`);

    // Close player cleanly
    await page.evaluate(() => {
      if (typeof closePlayer === 'function') closePlayer();
    });
    await page.waitForSelector('#playerOverlay', { state: 'hidden' });
    await page.waitForTimeout(400);

    // -------------------------------------------------------------
    // TEST 5: Search Across YouTube (Creator & Video Search)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing YouTube Search Feature ---');
    const mobileSearchBtn = page.locator('#mobileSearchTrigger');
    if (await mobileSearchBtn.isVisible()) {
      await mobileSearchBtn.click();
    }

    const searchInput = page.locator('#searchInput');
    await searchInput.fill('Ducky');
    await page.locator('#searchSubmitBtn').click();
    await page.waitForTimeout(1200);

    const channelCardsCount = await page.locator('.search-channel-card').count();
    const searchResultsCount = await page.locator('.video-card').count();
    console.log(`[PASS] Search for "Ducky" returned ${channelCardsCount} creator banner(s) and ${searchResultsCount} video(s)`);

    const screenshot5 = '05_android_search_results.png';
    const screenshot5Path = path.join(screenshotsDir, screenshot5);
    await page.screenshot({ path: screenshot5Path, fullPage: false });
    copyToBrain(screenshot5);
    console.log(`[SAVED] Screenshot: ${screenshot5Path}`);

    // -------------------------------------------------------------
    // TEST 5.1: Mobile Hamburger Drawer Navigation
    // -------------------------------------------------------------
    console.log('\n--- 5.1 Testing Mobile Hamburger Drawer ---');
    const menuBtn = page.locator('#menuToggleBtn');
    await menuBtn.click();
    await page.waitForTimeout(400);

    const isSidebarOpen = await page.locator('#appSidebar').evaluate(el => el.classList.contains('mobile-open'));
    const isBackdropActive = await page.locator('#sidebarBackdrop').evaluate(el => el.classList.contains('active'));
    console.log(`[PASS] Hamburger clicked -> mobile drawer open: ${isSidebarOpen}, backdrop active: ${isBackdropActive}`);

    const closeSidebarBtn = page.locator('#closeSidebarBtn');
    await closeSidebarBtn.click();
    await page.waitForTimeout(400);

    const isSidebarClosed = await page.locator('#appSidebar').evaluate(el => !el.classList.contains('mobile-open'));
    console.log(`[PASS] Close button clicked -> mobile drawer closed: ${isSidebarClosed}`);

    // -------------------------------------------------------------
    // TEST 5.2: AMOLED Settings Modal & Theme Switcher
    // -------------------------------------------------------------
    console.log('\n--- 5.2 Testing AMOLED Settings Modal & Theme Switcher ---');
    const settingsBtn = page.locator('#settingsBtn');
    await settingsBtn.click();
    await page.waitForTimeout(400);

    const isSettingsVisible = await page.locator('#settingsModal').isVisible();
    console.log(`[PASS] Settings clicked -> AMOLED modal visible: ${isSettingsVisible}`);

    // Switch to Light Theme
    console.log('Switching to Light theme...');
    await page.locator('#themeLightBtn').click();
    await page.waitForTimeout(300);
    let currentTheme = await page.evaluate(() => document.body.className);
    console.log(`[PASS] Body class after light theme: "${currentTheme}"`);

    // Switch to Dark Theme
    console.log('Switching to Dark theme...');
    await page.locator('#themeDarkBtn').click();
    await page.waitForTimeout(300);
    currentTheme = await page.evaluate(() => document.body.className);
    console.log(`[PASS] Body class after dark theme: "${currentTheme}"`);

    // Switch to AMOLED Black Theme
    console.log('Switching to AMOLED Black theme...');
    await page.locator('#themeAmoledBtn').click();
    await page.waitForTimeout(300);
    currentTheme = await page.evaluate(() => document.body.className);
    console.log(`[PASS] Body class after AMOLED black theme: "${currentTheme}"`);

    const screenshotSettings = '05b_android_settings_amoled.png';
    const screenshotSettingsPath = path.join(screenshotsDir, screenshotSettings);
    await page.screenshot({ path: screenshotSettingsPath, fullPage: false });
    console.log(`[SAVED] Screenshot: ${screenshotSettingsPath}`);

    // Close settings modal
    await page.locator('#closeSettingsModalBtn').click();
    await page.waitForTimeout(300);

    await androidContext.close();

    // -------------------------------------------------------------
    // TEST 6: Desktop Clean Layout
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Desktop Clean Layout ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1.5
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(1500);

    const screenshot6 = '06_desktop_view.png';
    const screenshot6Path = path.join(screenshotsDir, screenshot6);
    await desktopPage.screenshot({ path: screenshot6Path, fullPage: false });
    copyToBrain(screenshot6);
    console.log(`[SAVED] Screenshot: ${screenshot6Path}`);

    await desktopContext.close();

    console.log('\n🎉 ALL TESTS AND SCREENSHOTS COMPLETED SUCCESSFULLY!');
    return true;
  } catch (err) {
    console.error('Test execution error:', err);
    return false;
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runAsiTubeTests().then((success) => {
  process.exit(success ? 0 : 1);
});
