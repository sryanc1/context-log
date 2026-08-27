import type { PermissionState } from "../hooks/useNotifications";

interface NotificationBellProps {
    state: PermissionState;
    subscribed: boolean;
    onClick: () => void;
}

export function NotificationBell({ state, subscribed, onClick}: NotificationBellProps) {
    const label = 
        state === 'denied' ? 'Notifications blocked — enable in browser settings' :
        state === 'granted' && subscribed ? 'Notifications on for this device — click to turn off' :
        state === 'granted' && !subscribed ? 'Notifications off for this device — click to turn on' :
        'Enable notifications';

    return (
        <button className="topbar-bell" onClick={onClick} title={label} aria-label={label}>
            {state === 'granted' && subscribed ? '🔔' : '🔕'}
        </button>
    );
}
