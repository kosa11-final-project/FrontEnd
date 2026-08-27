import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, patchJson, unwrapApiResponse } from '@/shared/api';
import { getNotifications, getUnreadNotificationCount, markNotificationRead } from './notificationApi.js';

vi.mock('@/shared/api', () => ({
  getJson: vi.fn(),
  patchJson: vi.fn(),
  unwrapApiResponse: vi.fn((response) => response.data),
}));

describe('notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps and maps AI strategy and existing forecast notifications without filtering types', async () => {
    const signal = new AbortController().signal;
    getJson.mockResolvedValue({
      data: [
        {
          notificationId: 1,
          notificationType: 'AI_STRATEGY_GENERATION_COMPLETED',
          severity: 'INFO',
          title: 'AI 전략 생성 완료',
          message: '전략 생성이 완료되었습니다.',
          strategyCaseId: 123,
          forecastRunId: null,
          read: false,
          createdAt: '2026-08-26T15:00:00',
        },
        {
          notificationId: 2,
          notificationType: 'FORECAST_COMPLETED',
          severity: 'INFO',
          title: '수요예측 완료',
          message: '수요예측이 완료되었습니다.',
          strategyCaseId: null,
          forecastRunId: 77,
          read: true,
          createdAt: '2026-08-26T14:00:00',
        },
      ],
    });

    await expect(getNotifications(signal)).resolves.toEqual([
      expect.objectContaining({ notificationId: 1, strategyCaseId: 123, read: false }),
      expect.objectContaining({ notificationId: 2, notificationType: 'FORECAST_COMPLETED', forecastRunId: 77 }),
    ]);
    expect(getJson).toHaveBeenCalledWith({ path: 'v1/notifications', signal });
    expect(unwrapApiResponse).toHaveBeenCalledOnce();
  });

  it('unwraps the unread count and validates its shape', async () => {
    getJson.mockResolvedValueOnce({ data: { unreadCount: 3 } });
    await expect(getUnreadNotificationCount()).resolves.toBe(3);
    expect(getJson).toHaveBeenCalledWith({ path: 'v1/notifications/unread-count', signal: undefined });

    getJson.mockResolvedValueOnce({ data: { unreadCount: -1 } });
    await expect(getUnreadNotificationCount()).rejects.toThrow('미확인 알림 개수 응답 형식이 올바르지 않습니다.');
  });

  it('marks a notification as read through PATCH', async () => {
    const signal = new AbortController().signal;
    const csrf = { token: 'csrf-token', headerName: 'X-XSRF-TOKEN' };
    patchJson.mockResolvedValue(undefined);

    await markNotificationRead(10, { signal, csrf });

    expect(patchJson).toHaveBeenCalledWith({
      path: 'v1/notifications/10/read',
      headers: { 'X-XSRF-TOKEN': 'csrf-token' },
      signal,
    });
  });

  it('rejects malformed notification list responses', async () => {
    getJson.mockResolvedValueOnce({ data: {} });
    await expect(getNotifications()).rejects.toThrow('알림 목록 응답 형식이 올바르지 않습니다.');

    getJson.mockResolvedValueOnce({ data: [{ notificationId: 1 }] });
    await expect(getNotifications()).rejects.toThrow('알림 목록 응답 형식이 올바르지 않습니다.');
  });
});
