// Toasts and running timers. Several timers can run at once; they keep
// going across screens and show in a tray above the bottom bar.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { clock } from '../lib/format';

/* ---------------- Toast ---------------- */

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className={`toast${msg ? ' show' : ''}`} role="status" aria-live="polite">{msg}</div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Timers ---------------- */

export interface Timer {
  id: number;
  label: string;
  endAt: number;
  done: boolean;
}

interface TimerApi {
  timers: Timer[];
  start: (seconds: number, label: string) => void;
  cancel: (id: number) => void;
}

const TimerCtx = createContext<TimerApi>({ timers: [], start: () => {}, cancel: () => {} });
export const useTimers = () => useContext(TimerCtx);

let audio: AudioContext | null = null;
function wakeAudio() {
  try {
    if (!audio) audio = new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
  } catch {
    /* no audio */
  }
}
function chime() {
  try {
    if (audio) {
      const t0 = audio.currentTime;
      for (let i = 0; i < 3; i++) {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.frequency.value = 880;
        o.connect(g);
        g.connect(audio.destination);
        const st = t0 + i * 0.45;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.35, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.3);
        o.start(st);
        o.stop(st + 0.32);
      }
    }
  } catch {
    /* no audio */
  }
  try {
    navigator.vibrate?.([250, 120, 250, 120, 250]);
  } catch {
    /* no vibration */
  }
}

/** Hook for platform alerts (Phase 4 adds local notifications). */
export const timerHooks = {
  onStart: (_t: Timer) => {},
  onCancel: (_t: Timer) => {}
};

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [, setTick] = useState(0);
  const seq = useRef(0);
  const toast = useToast();

  const start = useCallback(
    (seconds: number, label: string) => {
      wakeAudio();
      const t: Timer = { id: ++seq.current, label, endAt: Date.now() + seconds * 1000, done: false };
      setTimers(list => [...list, t]);
      timerHooks.onStart(t);
      toast(`${Math.round(seconds / 60)} min timer started.`);
    },
    [toast]
  );

  const cancel = useCallback((id: number) => {
    setTimers(list => {
      const t = list.find(x => x.id === id);
      if (t && !t.done) timerHooks.onCancel(t);
      return list.filter(x => x.id !== id);
    });
  }, []);

  useEffect(() => {
    if (!timers.length) return;
    const int = setInterval(() => {
      const now = Date.now();
      let finished: Timer | null = null;
      setTimers(list =>
        list.map(t => {
          if (!t.done && now >= t.endAt) {
            finished = t;
            return { ...t, done: true };
          }
          return t;
        })
      );
      if (finished) {
        chime();
        toast(`Time: ${(finished as Timer).label}`);
      }
      setTick(x => x + 1);
    }, 500);
    return () => clearInterval(int);
  }, [timers.length, toast]);

  return <TimerCtx.Provider value={{ timers, start, cancel }}>{children}</TimerCtx.Provider>;
}

export function TimerTray() {
  const { timers, cancel } = useTimers();
  if (!timers.length) return null;
  const now = Date.now();
  return (
    <div className="timer-tray" aria-live="polite">
      {timers.map(t => (
        <div key={t.id} className={`timer${t.done ? ' done' : ''}`}>
          <span className="timer-label">{t.label}</span>
          <span className="timer-clock">{t.done ? 'Done' : clock((t.endAt - now) / 1000)}</span>
          <button type="button" className="timer-btn" onClick={() => cancel(t.id)}>
            {t.done ? 'Dismiss' : 'Cancel'}
          </button>
        </div>
      ))}
    </div>
  );
}
