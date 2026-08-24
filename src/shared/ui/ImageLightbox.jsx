import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CloseCircle } from 'reicon-react';

const MAX_IMAGE_WIDTH = 760;
const MAX_IMAGE_HEIGHT = 760;

function toRect(rect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function getCenteredRect(originRect, naturalWidth = 1, naturalHeight = 1, viewport) {
  if (!viewport) return originRect;

  const ratio = naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 1;
  const maxWidth = Math.min(viewport.width * 0.86, MAX_IMAGE_WIDTH);
  const maxHeight = Math.min(viewport.height * 0.8, MAX_IMAGE_HEIGHT);
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    left: Math.max(16, (viewport.width - width) / 2),
    top: Math.max(16, (viewport.height - height) / 2),
    width,
    height,
  };
}

function toMotionRect(rect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

/** 클릭한 이미지의 실제 위치에서 중앙 라이트박스로 이동하는 공유 이미지 뷰어입니다. */
export function ImageLightbox({ image, onClose }) {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [loadedSize, setLoadedSize] = useState(null);
  const [viewport, setViewport] = useState(() =>
    typeof window === 'undefined' ? null : { width: window.innerWidth, height: window.innerHeight },
  );
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!image) return undefined;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [image, onClose]);

  if (typeof document === 'undefined') return null;

  const originRect = image?.originRect;
  const naturalSize =
    loadedSize?.id === image?.id ? loadedSize : { width: image?.naturalWidth || 1, height: image?.naturalHeight || 1 };
  const centeredRect =
    image && originRect ? getCenteredRect(originRect, naturalSize.width, naturalSize.height, viewport) : null;
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 360, damping: 32, mass: 0.8 };

  return createPortal(
    <AnimatePresence initial={false}>
      {image && originRect && centeredRect && (
        <motion.div
          key={image.id}
          className="fixed inset-0 z-[110]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${image.alt} 크게 보기`}
        >
          <motion.button
            type="button"
            aria-label="이미지 크게 보기 닫기"
            className="absolute inset-0 size-full cursor-zoom-out bg-black/55 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.img
            src={image.src}
            alt={image.alt}
            initial={toMotionRect(originRect)}
            animate={toMotionRect(centeredRect)}
            exit={toMotionRect(originRect)}
            transition={transition}
            onLoad={(event) => {
              setLoadedSize({
                id: image.id,
                width: event.currentTarget.naturalWidth || 1,
                height: event.currentTarget.naturalHeight || 1,
              });
            }}
            onClick={(event) => event.stopPropagation()}
            className="pointer-events-auto fixed rounded-2xl border border-white/70 bg-white object-contain shadow-2xl"
          />
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="이미지 크게 보기 닫기"
            className="absolute right-5 top-5 z-10 inline-grid size-10 place-items-center rounded-full border border-white/50 bg-black/45 text-white shadow-lg transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={onClose}
          >
            <CloseCircle size={22} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export { toRect };
