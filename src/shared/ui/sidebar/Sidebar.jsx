import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

/**
 * Router와 도메인을 모르는 shadcn 스타일의 Sidebar primitive입니다.
 * 실제 메뉴 구성과 NavLink 연결은 widgets/app-shell에서 담당합니다.
 */
export const sidebarMenuButtonVariants = cva('sidebar-menu-button nav-item group', {
  variants: {
    size: {
      default: '',
      sm: 'min-h-9',
      lg: 'min-h-12',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export const Sidebar = forwardRef(function Sidebar({ className, ...props }, ref) {
  return <aside ref={ref} data-slot="sidebar" className={cn('sidebar', className)} {...props} />;
});

export const SidebarHeader = forwardRef(function SidebarHeader({ className, ...props }, ref) {
  return <div ref={ref} data-slot="sidebar-header" className={cn(className)} {...props} />;
});

export const SidebarContent = forwardRef(function SidebarContent({ className, ...props }, ref) {
  return <div ref={ref} data-slot="sidebar-content" className={cn(className)} {...props} />;
});

export const SidebarFooter = forwardRef(function SidebarFooter({ className, ...props }, ref) {
  return <div ref={ref} data-slot="sidebar-footer" className={cn(className)} {...props} />;
});

export const SidebarMenu = forwardRef(function SidebarMenu({ asChild = false, className, ...props }, ref) {
  const Comp = asChild ? Slot : 'nav';
  return <Comp ref={ref} data-slot="sidebar-menu" className={cn('main-nav', className)} {...props} />;
});

export const SidebarMenuItem = forwardRef(function SidebarMenuItem({ className, ...props }, ref) {
  return <div ref={ref} data-slot="sidebar-menu-item" className={cn(className)} {...props} />;
});

export const SidebarMenuButton = forwardRef(function SidebarMenuButton(
  { asChild = false, className, size, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  const buttonProps = asChild ? props : { type: 'button', ...props };

  return (
    <Comp
      ref={ref}
      data-slot="sidebar-menu-button"
      className={cn(sidebarMenuButtonVariants({ size }), className)}
      {...buttonProps}
    />
  );
});
