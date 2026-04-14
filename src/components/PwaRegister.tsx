'use client';

import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (Capacitor.isNativePlatform()) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          for (const r of regs) void r.unregister();
        })
        .catch(() => {});
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          for (const r of regs) void r.unregister();
        })
        .catch(() => {});
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return null;
}
