package com.asitube.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public class AndroidDownloaderBridge {
        @JavascriptInterface
        public void downloadFile(String url, String filename, String mimetype) {
            runOnUiThread(() -> {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    if (mimetype != null && !mimetype.isEmpty()) {
                        request.setMimeType(mimetype);
                    }
                    request.setDescription("Downloading media file with ASI Tube...");
                    String finalName = filename;
                    if (finalName == null || finalName.trim().isEmpty()) {
                        finalName = "ASI_Tube_" + System.currentTimeMillis() + (mimetype != null && mimetype.contains("audio") ? ".mp3" : ".mp4");
                    }
                    request.setTitle(finalName);
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, finalName);

                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Download started: " + finalName + "\nSaved to Downloads folder.", Toast.LENGTH_LONG).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Download error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupInAppBridge();
        handleSendIntent(getIntent());
    }

    @Override
    public void onResume() {
        super.onResume();
        setupInAppBridge();
    }

    private void setupInAppBridge() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.addJavascriptInterface(new AndroidDownloaderBridge(), "AndroidDownloader");

            // Also catch any fallback download clicks so it never exits the app
            webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                try {
                    String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                    if (filename == null || filename.isEmpty() || filename.equals("downloadfile.bin")) {
                        filename = "ASI_Tube_" + System.currentTimeMillis() + (mimetype != null && mimetype.contains("audio") ? ".mp3" : ".mp4");
                    }
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    if (mimetype != null && !mimetype.isEmpty()) {
                        request.setMimeType(mimetype);
                    }
                    request.setDescription("Downloading media file with ASI Tube...");
                    request.setTitle(filename);
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);

                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Download started: " + filename, Toast.LENGTH_LONG).show();
                    }
                } catch (Exception ignored) {}
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleSendIntent(intent);
    }

    private void handleSendIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null && "text/plain".equals(type)) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null && !sharedText.trim().isEmpty()) {
                try {
                    String encoded = java.net.URLEncoder.encode(sharedText.trim(), "UTF-8");
                    String js = "window.App && window.App.loadUrlToDownloader && window.App.loadUrlToDownloader('" + encoded + "');";
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
                    }
                } catch (Exception ignored) {}
            }
        }
    }
}
