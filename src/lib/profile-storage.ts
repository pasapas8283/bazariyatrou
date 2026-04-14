import { getCurrentUser } from './auth-storage';

export type LocalProfile = {
  name: string;
  phone?: string;
  avatar?: string;
};

export const PROFILE_STORAGE_KEY = 'bazariyatrou-profile';

export function readProfile(): LocalProfile {
  const authUser = getCurrentUser();

  // ✅ Si connecté → on prend les vraies infos
  if (authUser) {
    return {
      name: `${authUser.firstName} ${authUser.lastName}`,
      phone: authUser.phone,
      avatar: authUser.avatar || '',
    };
  }

  // ✅ Sinon fallback localStorage
  if (typeof window === 'undefined') {
    return {
      name: 'Utilisateur',
    };
  }

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return {
      name: parsed?.name ?? 'Utilisateur',
      phone: parsed?.phone ?? '',
      avatar: parsed?.avatar ?? '',
    };
  } catch {
    return {
      name: 'Utilisateur',
    };
  }
}

export function writeProfile(profile: LocalProfile) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}