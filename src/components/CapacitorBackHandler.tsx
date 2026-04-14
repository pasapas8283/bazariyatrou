'use client';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Sur Android, le bouton retour physique / geste remonte l’historique comme le bouton ‹
 * (évite de quitter l’app dès le premier écran interne).
 */
export default function CapacitorBackHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  pathnameRef.current = pathname;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let handle: { remove: () => Promise<void> } | undefined;

    void (async () => {
      handle = await App.addListener('backButton', ({ canGoBack }) => {
        const path = pathnameRef.current ?? '/';
        if (path === '/') {
          if (Capacitor.getPlatform() === 'android') {
            void App.minimizeApp();
          }
          return;
        }
        if (canGoBack) {
          window.history.back();
        } else {
          router.back();
        }
      });
      if (cancelled) {
        void handle.remove();
      }
    })();

    return () => {
      cancelled = true;
      void handle?.remove();
    };
  }, [router]);

  return null;
}
