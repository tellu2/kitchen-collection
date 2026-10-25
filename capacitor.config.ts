import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Never change appId after the first install: Android treats a new id as a different app.
  appId: 'com.kitchencollection.app',
  appName: 'Kitchen Collection',
  webDir: 'dist',
  android: {
    // Release builds never allow cleartext or WebView debugging
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: '#f7f4ef',
      showSpinner: false
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_timer',
      iconColor: '#b9482f'
    },
    SystemBars: {
      insetsHandling: 'css',
      style: 'LIGHT'
    }
  }
};

export default config;
