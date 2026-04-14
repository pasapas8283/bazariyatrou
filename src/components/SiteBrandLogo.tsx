'use client';

import { useCallback } from 'react';

const VERSION = '20260413a';
const LOGO_CANDIDATES = [
  '/logo.png',
  '/icons/logo.png',
  '/app-icon.png',
  '/icons/app-icon.png',
  '/icons/brand-wordmark.svg',
];

type SiteBrandLogoProps = {
  className?: string;
  alt?: string;
};

/**
 * Logo d'interface: mot-cle horizontal (`/icons/brand-wordmark.svg`).
 * L'icone d'application (PWA/launcher Android) reste `icon-192.svg`.
 */
export default function SiteBrandLogo({
  className = 'h-auto w-[200px] max-w-[min(200px,55vw)]',
  alt = 'BazariYatrou',
}: SiteBrandLogoProps) {
  const onError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    const current = decodeURIComponent(el.src);
    const currentIndex = LOGO_CANDIDATES.findIndex((path) => current.includes(path));
    const nextPath = currentIndex >= 0 ? LOGO_CANDIDATES[currentIndex + 1] : LOGO_CANDIDATES[1];

    if (nextPath) {
      el.src = `${nextPath}?v=${VERSION}`;
      return;
    }

    el.src = `/icons/icon-192.svg?v=${VERSION}`;
    el.onerror = null;
  }, []);

  return (
    <img
      src={`${LOGO_CANDIDATES[0]}?v=${VERSION}`}
      alt={alt}
      className={className}
      onError={onError}
    />
  );
}
