import { cn } from '@/shared/lib/cn';

export function Table({ className, ...props }) {
  return <div className={cn('w-full overflow-x-auto', className)} {...props} />;
}

export function TableElement({ className, ...props }) {
  return <table className={cn('w-full border-collapse', className)} {...props} />;
}
