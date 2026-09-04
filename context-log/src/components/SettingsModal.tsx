import { useState } from 'react';
import type { UserSettings } from '../types/settings';
import type { PermissionState } from '../hooks/useNotifications';

interface SettingsModalProps {
  settings: UserSettings;
  permissionState: PermissionState;
  subscribed: boolean;
  onTogglePush: () => void;
  onSave: (settings: UserSettings) => void;
  onCancel: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function SettingsModal({ settings, permissionState, subscribed, onTogglePush, onSave, onCancel }: SettingsModalProps) {
  const [notificationHour, setNotificationHour] = useState(settings.notificationHour);
  const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState(settings.inactivityTimeoutMinutes);

  const pushLabel =
    permissionState === 'denied' ? 'Blocked — check your browser site settings' :
    permissionState === 'granted' && subscribed ? 'On for this device' :
    'Off for this device';

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Notification settings</h2>

        <label className="modal-label">
          Push notifications
          <div className="settings-toggle-row">
            <span className="modal-hint">{pushLabel}</span>
            <button
              className="modal-button modal-button-ghost"
              onClick={onTogglePush}
              disabled={permissionState === 'denied'}
            >
              {subscribed ? 'Turn off' : 'Turn on'}
            </button>
          </div>
        </label>

        <label className="modal-label">
          Daily reminder time <span className="modal-hint">Adelaide time</span>
          <select
            className="modal-input"
            value={notificationHour}
            onChange={(e) => setNotificationHour(Number(e.target.value))}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`}
              </option>
            ))}
          </select>
        </label>

        <label className="modal-label">
          Auto sign-out after inactivity
          <select
            className="modal-input"
            value={inactivityTimeoutMinutes}
            onChange={(e) => setInactivityTimeoutMinutes(Number(e.target.value))}
          >
            {[15, 30, 60, 120, 240].map((m) => (
              <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`}</option>
            ))}
          </select>
        </label>

        <div className="modal-footer">
          <div />
          <div className="modal-footer-right">
            <button className="modal-button modal-button-ghost" onClick={onCancel}>Cancel</button>
            <button
              className="modal-button modal-button-primary"
              onClick={() => onSave({...settings, notificationHour, inactivityTimeoutMinutes})}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}