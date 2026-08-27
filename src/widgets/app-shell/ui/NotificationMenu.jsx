import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Danger, TickCircle } from 'reicon-react';
import { getCsrfToken as refreshCsrfToken } from '@/entities/auth';
import {
  getNotificationTarget,
  isFailureNotification,
  markNotificationRead,
  notificationKeys,
  notificationListQueryOptions,
  unreadNotificationCountQueryOptions,
} from '@/entities/notification';
import { formatDateTime } from '@/shared/lib/format';
import { Button, Icon, IconButton, StateView, toast } from '@/shared/ui';

const TRANSIENT_NOTIFICATION_DURATION_MS = 8_000;

function NotificationItem({ notification, disabled, onSelect }) {
  const failed = isFailureNotification(notification);

  return (
    <button
      type="button"
      className={`grid w-full grid-cols-[32px_minmax(0,1fr)] gap-3 border-0 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-subtle)] disabled:cursor-wait disabled:opacity-60 ${
        notification.read ? 'bg-[var(--card)]' : 'bg-[var(--primary-faint)]'
      }`}
      disabled={disabled}
      onClick={() => onSelect(notification)}
    >
      <span
        className={`mt-0.5 grid size-8 place-items-center rounded-full ${
          failed
            ? 'bg-[var(--danger-soft)] text-[color:var(--danger)]'
            : 'bg-[var(--good-soft)] text-[color:var(--good)]'
        }`}
        aria-hidden="true"
      >
        <Icon icon={failed ? Danger : TickCircle} size={16} />
      </span>
      <span className="min-w-0">
        <span className="flex items-start justify-between gap-3">
          <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
            {notification.title}
          </strong>
          {!notification.read ? (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--danger)]" aria-hidden="true" />
          ) : null}
        </span>
        {!notification.read ? <span className="sr-only">미확인 알림</span> : null}
        <span className="mt-1 block text-[length:var(--font-size-meta)] leading-5 text-[color:var(--text-body)]">
          {notification.message}
        </span>
        <time
          dateTime={notification.createdAt}
          className="mt-1.5 block text-[length:var(--font-size-overline)] text-[color:var(--text-muted)]"
        >
          {formatDateTime(notification.createdAt)}
        </time>
      </span>
    </button>
  );
}

export function NotificationMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const unreadCountQuery = useQuery(unreadNotificationCountQueryOptions());
  const notificationsQuery = useQuery(notificationListQueryOptions({ enabled: open }));
  const transientNotificationQuery = useQuery({
    queryKey: notificationKeys.transient(),
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
  });
  const unreadCount = unreadCountQuery.data ?? 0;
  const transientNotification = transientNotificationQuery.data;
  const readMutation = useMutation({
    mutationFn: async (notificationId) => {
      const csrf = await refreshCsrfToken();
      return markNotificationRead(notificationId, { csrf });
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(notificationKeys.list(), (notifications = []) =>
        notifications.map((notification) =>
          notification.notificationId === notificationId ? { ...notification, read: true } : notification,
        ),
      );
      queryClient.setQueryData(notificationKeys.unreadCount(), (count = 0) => Math.max(0, count - 1));
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all, refetchType: 'active' });
    },
  });

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!transientNotification?.eventId) return undefined;

    const timeoutId = window.setTimeout(() => {
      queryClient.removeQueries({ queryKey: notificationKeys.transient(), exact: true });
    }, TRANSIENT_NOTIFICATION_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [queryClient, transientNotification?.eventId]);

  function dismissTransientNotification() {
    queryClient.removeQueries({ queryKey: notificationKeys.transient(), exact: true });
  }

  async function selectNotification(notification) {
    try {
      if (!notification.read) await readMutation.mutateAsync(notification.notificationId);
      const target = getNotificationTarget(notification);
      if (target) {
        setOpen(false);
        navigate(target);
      }
    } catch (error) {
      toast({
        title: '알림을 읽음 처리하지 못했습니다.',
        description: error?.message,
        variant: 'destructive',
      });
    }
  }

  function selectTransientNotification() {
    const target = getNotificationTarget(transientNotification);
    dismissTransientNotification();
    if (target) navigate(target);
  }

  return (
    <div ref={menuRef} className="relative">
      <IconButton
        ref={triggerRef}
        className="notification-button"
        label={unreadCount > 0 ? `알림, 미확인 ${unreadCount}개` : '알림'}
        variant="ghost"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          dismissTransientNotification();
          setOpen((isOpen) => !isOpen);
        }}
      >
        <Icon icon={Bell} size={20} />
        {unreadCount > 0 ? <span className="notification-indicator" aria-hidden="true" /> : null}
      </IconButton>

      {!open && transientNotification ? (
        <button
          type="button"
          className="absolute right-0 top-[calc(100%+10px)] z-40 grid w-[min(360px,calc(100vw-24px))] grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-left shadow-[var(--shadow-panel)] transition-colors hover:bg-[var(--surface-subtle)]"
          aria-label={`${transientNotification.title}: ${transientNotification.message}`}
          onClick={selectTransientNotification}
        >
          <span
            className={`mt-0.5 grid size-8 place-items-center rounded-full ${
              isFailureNotification(transientNotification)
                ? 'bg-[var(--danger-soft)] text-[color:var(--danger)]'
                : 'bg-[var(--good-soft)] text-[color:var(--good)]'
            }`}
            aria-hidden="true"
          >
            <Icon icon={isFailureNotification(transientNotification) ? Danger : TickCircle} size={16} />
          </span>
          <span className="min-w-0">
            <strong className="block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
              {transientNotification.title}
            </strong>
            <span className="mt-1 block text-[length:var(--font-size-meta)] leading-5 text-[color:var(--text-body)]">
              {transientNotification.message}
            </span>
            <span className="mt-1.5 block text-[length:var(--font-size-overline)] text-[color:var(--text-muted)]">
              방금 도착
            </span>
          </span>
        </button>
      ) : null}

      {open ? (
        <section
          role="dialog"
          aria-label="최근 알림"
          className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-panel)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <div>
              <h2 className="text-[length:var(--font-size-body)] font-bold text-[color:var(--text-heading)]">알림</h2>
              <p className="mt-0.5 text-[length:var(--font-size-overline)] text-[color:var(--text-muted)]">
                미확인 {unreadCount}개
              </p>
            </div>
          </header>

          <div className="max-h-[min(520px,calc(100vh-110px))] overflow-y-auto">
            {notificationsQuery.isPending ? (
              <StateView compact state="loading" title="알림을 불러오고 있습니다." className="m-4" />
            ) : notificationsQuery.isError ? (
              <div className="grid gap-3 p-4 text-center">
                <p className="m-0 text-[length:var(--font-size-body-sm)] text-[color:var(--danger)]">
                  알림을 불러오지 못했습니다.
                </p>
                <Button type="button" variant="secondary" size="sm" onClick={() => notificationsQuery.refetch()}>
                  다시 시도
                </Button>
              </div>
            ) : notificationsQuery.data.length === 0 ? (
              <StateView compact state="empty" title="도착한 알림이 없습니다." className="m-4" />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {notificationsQuery.data.map((notification) => (
                  <NotificationItem
                    key={notification.notificationId}
                    notification={notification}
                    disabled={readMutation.isPending && readMutation.variables === notification.notificationId}
                    onSelect={selectNotification}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
