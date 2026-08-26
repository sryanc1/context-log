import type { PermissionState } from "../hooks/useNotifications";

interface NotificationBellProps {
    state: PermissionState;
    onClick: () => void;
}

export function NotificationBell({ state, onClick}: NotificationBellProps) {
    const label = 
        state === 'granted' ? 'Notification on' :
        state === 'denied' ? 'Notification blaocked - enable in browser setting' :
        'Enable notifications';

    return (
        <button className="topbar-bell" onClick={onClick} title={label} aria-label={label}>
            {state === 'granted' ? '🔔' : '🔕'}
        </button>
    );
}
