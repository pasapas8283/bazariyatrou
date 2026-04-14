'use client';

export type PlatformSettings = {
  showPhoneOnListings: boolean;
  autoFillPhoneInPublish: boolean;
  defaultIsland: string;
  notifyMessages: boolean;
  notifyFavorites: boolean;
  notifyBoosts: boolean;
};

const SETTINGS_KEY = 'bazariyatrou-platform-settings';

const defaultSettings: PlatformSettings = {
  showPhoneOnListings: true,
  autoFillPhoneInPublish: true,
  defaultIsland: 'Île',
  notifyMessages: true,
  notifyFavorites: true,
  notifyBoosts: true,
};

export function readPlatformSettings(): PlatformSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      showPhoneOnListings:
        parsed?.showPhoneOnListings ?? defaultSettings.showPhoneOnListings,
      autoFillPhoneInPublish:
        parsed?.autoFillPhoneInPublish ?? defaultSettings.autoFillPhoneInPublish,
      defaultIsland: parsed?.defaultIsland ?? defaultSettings.defaultIsland,
      notifyMessages: parsed?.notifyMessages ?? defaultSettings.notifyMessages,
      notifyFavorites: parsed?.notifyFavorites ?? defaultSettings.notifyFavorites,
      notifyBoosts: parsed?.notifyBoosts ?? defaultSettings.notifyBoosts,
    };
  } catch {
    return defaultSettings;
  }
}

export function writePlatformSettings(settings: PlatformSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
