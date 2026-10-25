// Keeps the screen on while cooking. Uses the browser Wake Lock API by
// default; src/native.ts swaps in the Capacitor plugin on Android.
type WakeLockNav = Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };

export const keepAwake = {
  async on(): Promise<() => void> {
    try {
      const lock = await (navigator as WakeLockNav).wakeLock?.request('screen');
      return () => void lock?.release();
    } catch {
      return () => {};
    }
  }
};
