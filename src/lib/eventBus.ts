type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationEvent {
  message: string;
  type: NotificationType;
}

type Handler = (event: NotificationEvent) => void;

class EventBus {
  private handlers: Handler[] = [];

  subscribe(handler: Handler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  emit(event: NotificationEvent) {
    this.handlers.forEach((handler) => handler(event));
  }
}

export const notificationEventBus = new EventBus();
