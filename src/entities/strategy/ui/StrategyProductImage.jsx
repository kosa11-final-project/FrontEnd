import { useState } from 'react';
import { Package } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui';

const sizeClasses = Object.freeze({
  md: 'size-16 rounded-[var(--radius-card)]',
  lg: 'size-24 rounded-[var(--radius-panel)]',
});

function ProductImageContent({ src, alt, size, className }) {
  const [failed, setFailed] = useState(false);
  const sizeClassName = sizeClasses[size] ?? sizeClasses.md;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'shrink-0 border border-[var(--border)] bg-[var(--surface-subtle)] object-cover shadow-[var(--shadow-soft)]',
          sizeClassName,
          className,
        )}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${alt} 없음`}
      className={cn(
        'grid shrink-0 place-items-center border border-[var(--border)] bg-[var(--surface-subtle)] text-[color:var(--text-muted)]',
        sizeClassName,
        className,
      )}
    >
      <Icon icon={Package} size={size === 'lg' ? 28 : 22} aria-hidden="true" />
    </div>
  );
}

export function StrategyProductImage({ src, alt, size = 'md', className }) {
  return (
    <ProductImageContent key={src || 'empty-product-image'} src={src} alt={alt} size={size} className={className} />
  );
}
