package com.asitube.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleSendIntent(getIntent());
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
