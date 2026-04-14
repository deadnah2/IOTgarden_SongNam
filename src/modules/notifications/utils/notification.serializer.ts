import type { NotificationLike } from '../interfaces/notification-like.interface';

export function serializeNotification(notification: NotificationLike) {
  return {
    ...notification,
    temperature: notification.temperature?.toNumber() ?? null,
    humidity: notification.humidity?.toNumber() ?? null,
    thresholdValue: notification.thresholdValue?.toNumber() ?? null,
  };
}
