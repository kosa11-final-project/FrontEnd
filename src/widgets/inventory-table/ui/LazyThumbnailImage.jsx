import { useEffect, useRef, useState } from 'react';
import { getImageThumbnailUrl } from '@/shared/lib/media';

/**
 * 뷰포트에 실제로 진입했을 때만 썸네일을 로드하여 초기 페이지
 * 네트워크 페이로드를 줄이고 CLS를 방지하는 지연 썸네일 컴포넌트입니다.
 */
export function LazyThumbnailImage({ src, alt, width = 48, height = 48, className = '', onImageClick, item }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);
  const thumbnailSrc = getImageThumbnailUrl(src);
  const canObserve = typeof window !== 'undefined' && 'IntersectionObserver' in window;
  const shouldRenderImage = isVisible || !canObserve;

  useEffect(() => {
    if (!src) return;

    // IntersectionObserver 미지원 환경에서는 렌더 단계에서 바로 이미지를 표시합니다.
    if (!canObserve) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px 0px' },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [canObserve, src]);

  if (!src) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[#F3F4F6] text-[11px] font-medium text-gray-600 ${className}`}
        style={{ width, height }}
      >
        No Img
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[#F3F4F6] ${className}`}
      style={{ width, height }}
    >
      {shouldRenderImage ? (
        <button
          type="button"
          aria-label={`${alt} 이미지 크게 보기`}
          className="group/image size-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
          onClick={(event) => onImageClick?.(event, item, alt)}
        >
          <img
            src={thumbnailSrc}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            onLoad={() => setIsLoaded(true)}
            className={`size-full object-cover shadow-2xs transition-all duration-200 group-hover/image:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </button>
      ) : null}
      {!isLoaded && shouldRenderImage ? (
        <div aria-hidden="true" className="absolute inset-0 bg-[#E5E7EB] motion-safe:animate-pulse" />
      ) : null}
    </div>
  );
}
