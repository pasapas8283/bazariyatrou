package com.bazariyatrou.app;

import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      boolean debug =
          (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
      WebView.setWebContentsDebuggingEnabled(debug);
    }
    super.onCreate(savedInstanceState);
  }
}
