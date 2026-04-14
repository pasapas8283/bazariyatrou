'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  beginPasswordReset,
  completePasswordReset,
  getAllUsers,
  getCurrentUser,
  getPasswordResetSession,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
} from '../lib/auth-storage';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [usersCount, setUsersCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const refresh = () => {
    setCurrentUser(getCurrentUser());
    setUsersCount(getAllUsers().length);
  };

  useEffect(() => {
    refresh();
    setHydrated(true);
  }, []);

  const isLoggedIn = useMemo(() => !!currentUser, [currentUser]);

  const register = (input: {
    firstName: string;
    lastName: string;
    birthDate: string;
    phone: string;
    password: string;
    avatar?: string;
  }) => {
    const result = registerUser(input);
    if (result.ok) {
      void fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }).catch(() => {});
    }
    refresh();
    return result;
  };

  const login = (input: { phone: string; password: string }) => {
    const result = loginUser(input);
    if (result.ok) {
      void fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }).catch(() => {});
    }
    refresh();
    return result;
  };

  const logout = () => {
    logoutUser();
    refresh();
  };

  const requestPasswordReset = (input: { phone: string; birthDate: string }) => {
    const result = beginPasswordReset(input);
    refresh();
    return result;
  };

  const resetPassword = (input: { newPassword: string }) => {
    const result = completePasswordReset(input);
    refresh();
    return result;
  };

  return {
    currentUser,
    usersCount,
    hydrated,
    isLoggedIn,
    register,
    login,
    logout,
    passwordResetSession: getPasswordResetSession(),
    requestPasswordReset,
    resetPassword,
    refresh,
  };
}