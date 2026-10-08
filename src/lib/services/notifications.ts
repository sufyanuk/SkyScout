import "server-only";

export interface AlertNotification {
  userId: string;
  email: string | null;
  subject: string;
  body: string;
  url: string;
}

/**
 * Delivery channel for triggered price alerts. Alerts always appear in-app;
 * plug an email/push service in here (Resend, Postmark, SES, web push…).
 */
export interface NotificationService {
  send(notification: AlertNotification): Promise<void>;
}

class ConsoleNotificationService implements NotificationService {
  async send(n: AlertNotification) {
    console.info(`[alerts] Would notify ${n.email ?? n.userId}: ${n.subject} → ${n.url}`);
  }
}

export const notifications: NotificationService = new ConsoleNotificationService();
