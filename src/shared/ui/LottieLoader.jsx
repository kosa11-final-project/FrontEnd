import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/shared/hooks';
import { cn } from '@/shared/lib/cn';

const DEFAULT_PATH = '/projects/hg-inventory-loader/scene-1/lottie.json';
let lottieModulePromise;

function loadLottie() {
  lottieModulePromise ??= import('lottie-web').then((module) => module.default ?? module);
  return lottieModulePromise;
}

/**
 * Shared loading animation backed by the transparent Lottie scene in public/projects.
 * Keep this component state-free from business concerns so it can be used in any route.
 */
export function LottieLoader({
  path = DEFAULT_PATH,
  label = '데이터를 불러오는 중입니다.',
  size = 88,
  speed = 1,
  className,
}) {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;

    async function mountAnimation() {
      try {
        const lottie = await loadLottie();
        if (cancelled || !containerRef.current) return;

        const animation = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: !reducedMotion,
          path,
          rendererSettings: {
            progressiveLoad: true,
            preserveAspectRatio: 'xMidYMid meet',
          },
        });

        animation.setSpeed(speed);
        animation.addEventListener('data_failed', () => setFailed(true));
        animationRef.current = animation;
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    mountAnimation();

    return () => {
      cancelled = true;
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [path, reducedMotion, speed]);

  return (
    <span
      className={cn(
        'inline-grid place-items-center text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]',
        className,
      )}
      role="status"
      aria-label={label}
      aria-busy="true"
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span ref={containerRef} className="size-full" aria-hidden="true" />
      )}
    </span>
  );
}

export { DEFAULT_PATH as defaultLottiePath };
