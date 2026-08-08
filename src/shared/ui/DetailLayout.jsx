import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const detailLayoutVariants = cva('grid min-w-0 items-start gap-4', {
  variants: {
    aside: {
      narrow: 'grid-cols-1 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]',
      regular: 'grid-cols-1 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]',
      wide: 'grid-cols-1 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]',
    },
  },
  defaultVariants: { aside: 'regular' },
});

export function DetailLayout({ asideContent, children, className, aside = 'regular', ...props }) {
  return (
    <div className={cn(detailLayoutVariants({ aside }), className)} {...props}>
      <aside className="min-w-0">{asideContent}</aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}

export { detailLayoutVariants };
