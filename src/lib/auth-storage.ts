export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  password: string;
  avatar?: string;
  createdAt: string;
};

type AuthState = {
  currentUser: AuthUser | null;
  users: AuthUser[];
  passwordResetSession?: {
    userId: string;
    expiresAt: string;
  } | null;
};

export const AUTH_STORAGE_KEY = 'bazariyatrou-auth';

function getDefaultState(): AuthState {
  return {
    currentUser: null,
    users: [],
    passwordResetSession: null,
  };
}

export function readAuthState(): AuthState {
  if (typeof window === 'undefined') return getDefaultState();

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return {
      currentUser: parsed?.currentUser ?? null,
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      passwordResetSession: parsed?.passwordResetSession ?? null,
    };
  } catch {
    return getDefaultState();
  }
}

export function writeAuthState(state: AuthState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

export function getCurrentUser(): AuthUser | null {
  return readAuthState().currentUser;
}

export function getAllUsers(): AuthUser[] {
  return readAuthState().users;
}

function hashPassword(raw: string): string {
  // Hash très simple côté client pour ne pas stocker le mot de passe en clair.
  // NOTE: pour une vraie prod, utiliser un hash sécurisé côté serveur (bcrypt, argon2, etc.).
  const salted = `bazariyatrou::${raw}::v1`;
  return btoa(unescape(encodeURIComponent(salted)));
}

export function registerUser(input: {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  password: string;
  avatar?: string;
}) {
  const state = readAuthState();

  const alreadyExists = state.users.find(
    (user) => user.phone.trim() === input.phone.trim()
  );

  if (alreadyExists) {
    return {
      ok: false as const,
      message: 'Un compte avec ce numéro existe déjà.',
    };
  }

  const newUser: AuthUser = {
    id: crypto.randomUUID(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    birthDate: input.birthDate,
    phone: input.phone.trim(),
    password: hashPassword(input.password),
    avatar: input.avatar,
    createdAt: new Date().toISOString(),
  };

  const nextState: AuthState = {
    currentUser: newUser,
    users: [newUser, ...state.users],
  };

  writeAuthState(nextState);

  return {
    ok: true as const,
    user: newUser,
  };
}

export function loginUser(input: { phone: string; password: string }) {
  const state = readAuthState();
  const identifier = input.phone.trim().toLowerCase();

  const found = state.users.find(
    (user) => {
      const byPhone = user.phone.trim().toLowerCase() === identifier;
      const fullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
      const byFullName = fullName === identifier;
      const byFirstName = user.firstName.trim().toLowerCase() === identifier;
      const byLastName = user.lastName.trim().toLowerCase() === identifier;
      return byPhone || byFullName || byFirstName || byLastName;
    }
  );

  if (!found) {
    return {
      ok: false as const,
      message: 'Aucun compte trouvé avec ce numéro ou ce nom.',
    };
  }

  if (found.password !== hashPassword(input.password)) {
    return {
      ok: false as const,
      message: 'Mot de passe incorrect.',
    };
  }

  writeAuthState({
    ...state,
    currentUser: found,
  });

  return {
    ok: true as const,
    user: found,
  };
}

export function logoutUser() {
  const state = readAuthState();

  writeAuthState({
    ...state,
    currentUser: null,
  });
  if (typeof window !== 'undefined') {
    void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }
}

export function changeCurrentUserPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const state = readAuthState();
  const current = state.currentUser;
  if (!current) {
    return { ok: false as const, message: 'Aucun utilisateur connecté.' };
  }

  if (current.password !== hashPassword(input.currentPassword)) {
    return { ok: false as const, message: 'Mot de passe actuel incorrect.' };
  }

  const nextUser = {
    ...current,
    password: hashPassword(input.newPassword),
  };

  const nextUsers = state.users.map((u) => (u.id === current.id ? nextUser : u));
  writeAuthState({
    ...state,
    currentUser: nextUser,
    users: nextUsers,
  });

  return { ok: true as const };
}

export function beginPasswordReset(input: { phone: string; birthDate: string }) {
  const state = readAuthState();
  const user = state.users.find(
    (entry) =>
      entry.phone.trim() === input.phone.trim() &&
      entry.birthDate === input.birthDate
  );

  if (!user) {
    return {
      ok: false as const,
      message: 'Informations incorrectes. Vérifiez numéro et date de naissance.',
    };
  }

  const nextState: AuthState = {
    ...state,
    passwordResetSession: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
  };

  writeAuthState(nextState);

  return {
    ok: true as const,
  };
}

export function getPasswordResetSession() {
  const state = readAuthState();
  const session = state.passwordResetSession;

  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;

  return session;
}

export function completePasswordReset(input: { newPassword: string }) {
  const state = readAuthState();
  const session = state.passwordResetSession;

  if (!session) {
    return {
      ok: false as const,
      message: 'Session de réinitialisation invalide.',
    };
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    writeAuthState({
      ...state,
      passwordResetSession: null,
    });
    return {
      ok: false as const,
      message: 'Session expirée. Recommencez la récupération.',
    };
  }

  const updatedUsers = state.users.map((user) =>
    user.id === session.userId
      ? { ...user, password: hashPassword(input.newPassword) }
      : user
  );

  const updatedCurrentUser =
    state.currentUser && state.currentUser.id === session.userId
      ? {
          ...state.currentUser,
          password: hashPassword(input.newPassword),
        }
      : state.currentUser;

  writeAuthState({
    ...state,
    users: updatedUsers,
    currentUser: updatedCurrentUser,
    passwordResetSession: null,
  });

  return {
    ok: true as const,
  };
}