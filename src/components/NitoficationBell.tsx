interface NotificationBellProps {
  subscribed: boolean;
  onClick: () => void;
}

export function NotificationBell({ subscribed, onClick }: NotificationBellProps) {
  return (
    <button className="topbar-bell" onClick={onClick} title="Notification settings" aria-label="Notification settings">
      {subscribed ? '🔔' : '🔕'}
    </button>
  );
}
