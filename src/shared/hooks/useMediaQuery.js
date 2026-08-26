import { useEffect, useState } from 'react';

function readMediaQuery(query) {
  return typeof window !== 'undefined' && window.matchMedia?.(query).matches;
}

/** 여러 화면에서 공유하는 브라우저 media query 상태만 shared hook으로 관리합니다. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => Boolean(readMediaQuery(query)));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
      return () => mediaQuery.removeEventListener('change', update);
    }

    mediaQuery.addListener?.(update);
    return () => mediaQuery.removeListener?.(update);
  }, [query]);

  return matches;
}

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
