import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start justify-between gap-4 overflow-hidden rounded-[var(--radius-card)] border p-4 pr-8 shadow-[var(--shadow-panel)] transition-all',
  {
    variants: {
      variant: {
        default: 'border-[var(--border)] bg-[var(--card)] text-[color:var(--text-heading)]',
        destructive: 'border-[var(--danger)] bg-[var(--danger)] text-[color:var(--color-white)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = ({ className, ...props }) => (
  <ToastPrimitive.Viewport
    className={cn(
      'fixed right-0 top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className,
    )}
    {...props}
  />
);

const Toast = ({ className, variant, ...props }) => (
  <ToastPrimitive.Root className={cn(toastVariants({ variant }), className)} {...props} />
);

const ToastTitle = ({ className, ...props }) => (
  <ToastPrimitive.Title className={cn('text-sm font-semibold', className)} {...props} />
);

const ToastDescription = ({ className, ...props }) => (
  <ToastPrimitive.Description className={cn('mt-1 text-xs opacity-90', className)} {...props} />
);

const ToastClose = ({ className, ...props }) => (
  <ToastPrimitive.Close
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-current/70 opacity-0 transition-opacity hover:text-current focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] group-hover:opacity-100',
      className,
    )}
    toast-close=""
    {...props}
  >
    <span aria-hidden="true">×</span>
    <span className="sr-only">알림 닫기</span>
  </ToastPrimitive.Close>
);

export { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, toastVariants };
