// Android-only behaviour, wired in when running inside Capacitor:
// back button, keep-awake in cooking mode, timer notifications that fire
// even when the app is closed, and status bar icon colour per theme.
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { timerHooks } from './ui/feedback';
import { keepAwake } from './ui/keepAwake';

const CHANNEL = 'timers';
export const isNative = Capacitor.isNativePlatform();

async function ensureNotifications(): Promise<boolean> {
  try {
    let status = await LocalNotifications.checkPermissions();
    if (status.display === 'prompt' || status.display === 'prompt-with-rationale') {
      status = await LocalNotifications.requestPermissions();
    }
    return status.display === 'granted';
  } catch {
    return false;
  }
}

export function initNative(): void {
  if (!isNative) return;

  void App.addListener('backButton', ({ canGoBack }) => {
    const atHome = !window.location.hash || window.location.hash === '#/' || window.location.hash === '#';
    if (!atHome && canGoBack) window.history.back();
    // Minimise rather than exit, so running timers and the current list survive
    else void App.minimizeApp();
  });

  void LocalNotifications.createChannel({
    id: CHANNEL,
    name: 'Cooking timers',
    description: 'Tells you when a cooking timer finishes',
    importance: 5,
    visibility: 1,
    vibration: true
  }).catch(() => {});

  timerHooks.onStart = t => {
    void (async () => {
      if (!(await ensureNotifications())) return;
      await LocalNotifications.schedule({
        notifications: [{
          id: t.id,
          title: 'Timer finished',
          body: t.label,
          channelId: CHANNEL,
          schedule: { at: new Date(t.endAt), allowWhileIdle: true }
        }]
      }).catch(() => {});
    })();
  };
  timerHooks.onCancel = t => {
    void LocalNotifications.cancel({ notifications: [{ id: t.id }] }).catch(() => {});
  };

  keepAwake.on = async () => {
    try {
      await KeepAwake.keepAwake();
    } catch {
      /* not supported */
    }
    return () => void KeepAwake.allowSleep().catch(() => {});
  };
}

/** Dark status bar icons on the light theme, light icons on the dark theme. */
export function setNativeTheme(dark: boolean): void {
  if (!isNative) return;
  void SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
}
