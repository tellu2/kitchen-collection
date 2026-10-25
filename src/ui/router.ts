// Hash router: #/, #/category/<name>, #/recipe/<id>, #/cook/<id>/<step>,
// #/have, #/list, #/meal, #/saved, #/ideas, #/settings.
// Hash changes are history entries, so Android's back button works.
import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'category'; category: string }
  | { name: 'recipe'; id: string }
  | { name: 'cook'; id: string; step: number }
  | { name: 'have' | 'list' | 'meal' | 'saved' | 'ideas' | 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  switch (parts[0]) {
    case 'category':
      return { name: 'category', category: parts[1] ?? '' };
    case 'recipe':
      return { name: 'recipe', id: parts[1] ?? '' };
    case 'cook':
      return { name: 'cook', id: parts[1] ?? '', step: Math.max(0, Number(parts[2]) || 0) };
    case 'have':
    case 'list':
    case 'meal':
    case 'saved':
    case 'ideas':
    case 'settings':
      return { name: parts[0] };
    default:
      return { name: 'home' };
  }
}

export function href(...segments: (string | number)[]): string {
  return '#/' + segments.map(s => encodeURIComponent(String(s))).join('/');
}

export function go(...segments: (string | number)[]): void {
  window.location.hash = href(...segments);
}

/** Replace the current entry (used when stepping through cooking mode). */
export function replace(...segments: (string | number)[]): void {
  window.history.replaceState(null, '', href(...segments));
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function back(fallback: () => void = () => go()): void {
  if (window.history.length > 1) window.history.back();
  else fallback();
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
