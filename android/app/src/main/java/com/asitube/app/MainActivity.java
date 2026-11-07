package com.asitube.app;

import android.annotation.SuppressLint;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private FrameLayout rootContainer;
    private FrameLayout fullscreenContainer;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // AMOLED Pure Dark Status Bar & Navigation Bar
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#0f0f0f"));
        window.setNavigationBarColor(Color.parseColor("#0f0f0f"));

        // Container layouts
        rootContainer = new FrameLayout(this);
        rootContainer.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        rootContainer.setBackgroundColor(Color.parseColor("#0f0f0f"));

        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        rootContainer.addView(webView);

        fullscreenContainer = new FrameLayout(this);
        fullscreenContainer.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        fullscreenContainer.setBackgroundColor(Color.BLACK);
        fullscreenContainer.setVisibility(View.GONE);
        rootContainer.addView(fullscreenContainer);

        setContentView(rootContainer);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Assets Loader to serve local assets via https://appassets.androidplatform.net
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Intercept native API proxy calls if requested via /api/
                if (url.startsWith("https://appassets.androidplatform.net/api/")) {
                    WebResourceResponse nativeResp = handleNativeApiRequest(url);
                    if (nativeResp != null) {
                        return nativeResp;
                    }
                }
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                showCustomViewInternal(view, callback);
            }

            @Override
            public void onHideCustomView() {
                hideCustomViewInternal();
            }
        });

        webView.setBackgroundColor(Color.parseColor("#0f0f0f"));

        // Register Android Javascript Interface for orientation & native network calls
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // Load AsiTube through secure virtual domain
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    private void showCustomViewInternal(View view, WebChromeClient.CustomViewCallback callback) {
        if (customView != null) {
            hideCustomViewInternal();
            return;
        }

        customView = view;
        customViewCallback = callback;

        webView.setVisibility(View.GONE);
        fullscreenContainer.setVisibility(View.VISIBLE);
        fullscreenContainer.addView(view, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Force landscape orientation on fullscreen video
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);

        // Immersive sticky full screen
        hideSystemUI();
    }

    private void hideCustomViewInternal() {
        if (customView == null) return;

        fullscreenContainer.removeView(customView);
        fullscreenContainer.setVisibility(View.GONE);
        customView = null;

        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }

        webView.setVisibility(View.VISIBLE);

        // Restore portrait orientation
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        // Restore system UI
        showSystemUI();
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    private void showSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#0f0f0f"));
        window.setNavigationBarColor(Color.parseColor("#0f0f0f"));
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void forceLandscape() {
            runOnUiThread(() -> {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                hideSystemUI();
            });
        }

        @JavascriptInterface
        public void forcePortrait() {
            runOnUiThread(() -> {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                showSystemUI();
            });
        }

        @JavascriptInterface
        public void toggleOrientation() {
            runOnUiThread(() -> {
                int orientation = getResources().getConfiguration().orientation;
                if (orientation == Configuration.ORIENTATION_LANDSCAPE) {
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                    showSystemUI();
                } else {
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                    hideSystemUI();
                }
            });
        }

        @JavascriptInterface
        public boolean isLandscape() {
            return getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
        }

        @JavascriptInterface
        public String fetchUrl(String targetUrl) {
            return executeNativeGet(targetUrl);
        }

        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }
    }

    private String executeNativeGet(String targetUrl) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(targetUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
            conn.setRequestProperty("Accept-Language", "en-US,en;q=0.9");
            conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");

            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                reader.close();
                return sb.toString();
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
        return null;
    }

    private WebResourceResponse handleNativeApiRequest(String requestUrl) {
        try {
            Uri uri = Uri.parse(requestUrl);
            if (requestUrl.contains("/api/search")) {
                String q = uri.getQueryParameter("q");
                if (q != null && !q.isEmpty()) {
                    String ytUrl = "https://www.youtube.com/results?search_query=" + URLEncoder.encode(q, "UTF-8");
                    String html = executeNativeGet(ytUrl);
                    if (html != null) {
                        InputStream is = new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8));
                        return new WebResourceResponse("text/html", "UTF-8", is);
                    }
                }
            } else if (requestUrl.contains("/api/proxy")) {
                String targetUrl = uri.getQueryParameter("url");
                if (targetUrl != null && !targetUrl.isEmpty()) {
                    String result = executeNativeGet(targetUrl);
                    if (result != null) {
                        InputStream is = new ByteArrayInputStream(result.getBytes(StandardCharsets.UTF_8));
                        return new WebResourceResponse("text/plain", "UTF-8", is);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            hideCustomViewInternal();
            return;
        }

        webView.evaluateJavascript(
            "(function() { return (typeof window.handleAndroidBack === 'function') ? window.handleAndroidBack() : false; })()",
            value -> {
                if (!"true".equals(value)) {
                    runOnUiThread(() -> {
                        if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            finish();
                        }
                    });
                }
            }
        );
    }
}
