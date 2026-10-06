export interface UserSettings {
    notificationHour: number;
    inactivityTimeoutMinutes: number;
    timezone: string,
}

export const DEFAULT_SETTING: UserSettings = {
    notificationHour: 10,
    inactivityTimeoutMinutes: 120,
    timezone: 'Australia/Adelaide',
}