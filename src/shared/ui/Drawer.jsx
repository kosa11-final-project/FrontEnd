import { useEffect } from 'react';
import { cva } from 'class-variance-authority';
import { CloseCircle } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Icon } from './Icon.jsx';

const drawerVariants = cva('flex h-full w-full flex-col border-l border-[var(--border-strong)] bg-[var(--card)] shadow-2xl', {
  variants: {
    size: {
      sm: 'max-w-[360px]',
      md: 'max-w-[440px]',
      lg: 'max-w-[640px]',
    },
  },
  defaultVariants: { size: 'md' },
});

export function Drawer({ open, onClose, title, description, children, className, size }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <aside className={cn(drawerVariants({ size }), className)} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 id="drawer-title" className="text-lg font-bold text-[var(--foreground)]">{title}</h2>
            {description && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>}
          </div>
          <button type="button" className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]" onClick={onClose} aria-label="상세 닫기"><Icon icon={CloseCircle} size={19} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  );
}

export { drawerVariants };
