import type { CapacitorConfig } from '@capacitor/cli';

/**
 * UI chargée depuis l’APK (dossier `out/`) — pas depuis Render dans la WebView.
 * Les appels API utilisent `NEXT_PUBLIC_CAP_API_ORIGIN` + `apiFetch()` dans le JS.
 */
const config: CapacitorConfig = {
  appId: 'com.bazariyatrou.app',
  appName: 'BazariYatrou',
  webDir: 'out',
  appendUserAgent: ' Chrome/131.0.0.0 Mobile Safari/537.36',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    webContentsDebuggingEnabled: true,
  },
};

export default config;
