import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.bazariyatrou.app',
  appName: 'BazariYatrou',
  webDir: 'out',
  /**
   * APK « embarqué » : `https://localhost` échoue sur certains appareils (WebView).
   * `http` + cleartext pour le contenu local uniquement (pas pour CAP_SERVER_URL HTTPS).
   */
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith('http://'),
      }
    : {
        androidScheme: 'http',
        cleartext: true,
      },
};

export default config;
