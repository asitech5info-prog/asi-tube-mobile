package com.asitube.app;

import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.URLUtil;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleSendIntent(getIntent());
        setupDownloadListener();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleSendIntent(intent);
    }

    private void setupDownloadListener() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    if (mimetype != null && !mimetype.isEmpty()) {
                        request.setMimeType(mimetype);
                    }
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Downloading media file with ASI Tube...");
                    String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                    if (filename == null || filename.isEmpty() || filename.equals("downloadfile.bin")) {
                        filename = "ASI_Tube_Video_" + System.currentTimeMillis() + (mimetype != null && mimetype.contains("audio") ? ".mp3" : ".mp4");
                    }
                    request.setTitle(filename);
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);

                    DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(getApplicationContext(), "Starting download: " + filename, Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW);
                        i.setData(Uri.parse(url));
                        startActivity(i);
                    } catch (Exception ignored) {}
                }
            });
        }
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
