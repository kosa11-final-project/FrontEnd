import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { useReducedMotion } from '@/shared/hooks';

export function LoadingMedia({
  src,
  poster,
  label = '로딩 애니메이션',
  controls = false,
  className,
  fallback = '로딩 애니메이션을 불러오지 못했습니다.',
  ...props
}) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!videoRef.current) return;
    if (reducedMotion) {
      videoRef.current.pause();
      return;
    }

    videoRef.current.play().catch(() => {
      // Browser autoplay policy may still require explicit user interaction.
    });
  }, [reducedMotion]);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={label}
        className={cn(
          'grid place-items-center bg-[var(--surface-subtle)] p-4 text-center text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]',
          className,
        )}
      >
        {fallback}
      </span>
    );
  }

  return (
    <video
      ref={videoRef}
      className={cn('h-full w-full object-cover', className)}
      aria-label={label}
      autoPlay={!reducedMotion}
      controls={controls || reducedMotion}
      loop
      muted
      playsInline
      preload="metadata"
      poster={poster}
      onError={() => setFailed(true)}
      {...props}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
