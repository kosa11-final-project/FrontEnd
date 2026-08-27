import { getJson, patchJson, unwrapApiResponse } from '@/shared/api';

const notificationPath = 'v1/notifications';

function mapNotification(item) {
  if (!Number.isInteger(item?.notificationId) || !item?.title || !item?.message || !item?.createdAt) {
    throw new Error('알림 목록 응답 형식이 올바르지 않습니다.');
  }

  return {
    notificationId: item.notificationId,
    notificationType: item.notificationType || 'UNKNOWN',
    severity: item.severity || 'INFO',
    title: item.title,
    message: item.message,
    strategyCaseId: Number.isInteger(item.strategyCaseId) ? item.strategyCaseId : null,
    forecastRunId: Number.isInteger(item.forecastRunId) ? item.forecastRunId : null,
    read: Boolean(item.read),
    createdAt: item.createdAt,
  };
}

export async function getNotifications(signal) {
  const data = unwrapApiResponse(
    await getJson({
      path: notificationPath,
      signal,
    }),
  );

  if (!Array.isArray(data)) {
    throw new Error('알림 목록 응답 형식이 올바르지 않습니다.');
  }
  return data.map(mapNotification);
}

export async function getUnreadNotificationCount(signal) {
  const data = unwrapApiResponse(
    await getJson({
      path: `${notificationPath}/unread-count`,
      signal,
    }),
  );

  if (!Number.isInteger(data?.unreadCount) || data.unreadCount < 0) {
    throw new Error('미확인 알림 개수 응답 형식이 올바르지 않습니다.');
  }
  return data.unreadCount;
}

export async function markNotificationRead(notificationId, { signal, csrf } = {}) {
  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    throw new Error('읽음 처리할 알림을 확인할 수 없습니다.');
  }
  const headers = csrf?.token && csrf?.headerName ? { [csrf.headerName]: csrf.token } : undefined;
  await patchJson({
    path: `${notificationPath}/${notificationId}/read`,
    headers,
    signal,
  });
}
