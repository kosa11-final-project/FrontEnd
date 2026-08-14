import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Logout, Menu, User } from 'reicon-react';
import { getNavigationItem } from '../model/navigation.js';
import { authKeys, currentUserQueryOptions, logout as logoutSession } from '@/entities/auth';
import { Avatar, Icon, IconButton } from '@/shared/ui';

// DESIGN / WIDGET: 전역 헤더 조합입니다. 경로 변경 때 breadcrumb만 갱신합니다.
export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accountMenuRef = useRef(null);
  const accountTriggerRef = useRef(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const currentPage = getNavigationItem(pathname);
  const { data: currentUser } = useQuery(currentUserQueryOptions());

  const logoutMutation = useMutation({
    mutationFn: () => logoutSession(),
    onSuccess: () => {
      // 다른 사용자가 이전 사용자의 업무 데이터를 볼 수 없도록 전체 서버 캐시를 제거함
      queryClient.clear();
      queryClient.setQueryData(authKeys.currentUser(), null);
      navigate('/login', { replace: true });
    },
  });

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    function closeOnOutsideClick(event) {
      if (!accountMenuRef.current?.contains(event.target)) setIsAccountMenuOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key !== 'Escape') return;
      setIsAccountMenuOpen(false);
      accountTriggerRef.current?.focus();
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isAccountMenuOpen]);

  function toggleAccountMenu() {
    if (!isAccountMenuOpen && logoutMutation.isError) logoutMutation.reset();
    setIsAccountMenuOpen((isOpen) => !isOpen);
  }

  return (
    <header className="topbar">
      <IconButton className="mobile-menu" label="메뉴 열기">
        <Icon icon={Menu} size={18} />
      </IconButton>
      <div className="breadcrumb" aria-label="현재 위치">
        <span>운영 관제</span>
        <span className="breadcrumb-separator">/</span>
        <strong>{currentPage.label}</strong>
      </div>
      <div className="topbar-actions">
        <IconButton className="notification-button" label="알림" variant="ghost">
          <Icon icon={Bell} size={20} />
          <span className="notification-indicator" aria-hidden="true" />
        </IconButton>
        <span className="topbar-divider" aria-hidden="true" />
        <div ref={accountMenuRef} className="account-menu">
          <button
            ref={accountTriggerRef}
            className="user-chip"
            type="button"
            aria-label={`사용자 메뉴: ${currentUser?.userName ?? '사용자'}, ${currentUser?.roleName ?? '역할 미지정'}`}
            aria-haspopup="menu"
            aria-expanded={isAccountMenuOpen}
            onClick={toggleAccountMenu}
          >
            <Avatar size="lg" className="user-chip-avatar">
              <Icon icon={User} size={21} />
            </Avatar>
            <span className="user-chip-copy">
              <strong>{currentUser?.userName ?? '사용자'}</strong>
              <small>{currentUser?.roleName ?? '역할 미지정'}</small>
            </span>
          </button>

          {isAccountMenuOpen ? (
            <div className="account-menu-popup" role="menu" aria-label="사용자 메뉴">
              <button
                className="account-menu-logout"
                type="button"
                role="menuitem"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                <Icon icon={Logout} size={17} />
                <span>{logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}</span>
              </button>
              {logoutMutation.isError ? (
                <p className="account-menu-error" role="alert">
                  로그아웃하지 못했습니다. 다시 시도해 주세요.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
