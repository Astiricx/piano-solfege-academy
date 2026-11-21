// Routage minimal par hash (#/solfege, #/lesson/l3…), compatible GitHub Pages.
import { useEffect, useState } from 'react';

export type Route =
  | { name: 'dashboard' }
  | { name: 'solfege'; lesson?: string }
  | { name: 'rhythm' }
  | { name: 'lessons' }
  | { name: 'lesson'; id: string }
  | { name: 'practice' }
  | { name: 'piece'; id: string }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'solfege':
      return parts[1] === 'cours' && parts[2] ? { name: 'solfege', lesson: parts[2] } : { name: 'solfege' };
    case 'rythme':
      return { name: 'rhythm' };
    case 'lecons':
      return { name: 'lessons' };
    case 'lecon':
      return parts[1] ? { name: 'lesson', id: parts[1] } : { name: 'lessons' };
    case 'pratique':
      return { name: 'practice' };
    case 'morceau':
      return parts[1] ? { name: 'piece', id: parts[1] } : { name: 'practice' };
    case 'reglages':
      return { name: 'settings' };
    default:
      return { name: 'dashboard' };
  }
}

export function routeToHash(r: Route): string {
  switch (r.name) {
    case 'dashboard':
      return '#/';
    case 'solfege':
      return r.lesson ? `#/solfege/cours/${r.lesson}` : '#/solfege';
    case 'rhythm':
      return '#/rythme';
    case 'lessons':
      return '#/lecons';
    case 'lesson':
      return `#/lecon/${r.id}`;
    case 'practice':
      return '#/pratique';
    case 'piece':
      return `#/morceau/${r.id}`;
    case 'settings':
      return '#/reglages';
  }
}

export function navigate(r: Route) {
  window.location.hash = routeToHash(r);
  window.scrollTo({ top: 0 });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
