'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteBrandLogo from './SiteBrandLogo';
import { getCurrentUser, logoutUser, type AuthUser } from '../lib/auth-storage';

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const links = useMemo(
    () => [
      { href: '/', label: 'Accueil' },
      { href: '/annonces', label: 'Toutes les annonces' },
      { href: '/publier', label: 'Publier une annonce' },
      { href: '/mes-annonces', label: 'Mes annonces' },
      { href: '/tarifs', label: 'Tarifs' },
      { href: currentUser ? '/profil' : '/connexion', label: currentUser ? 'Mon profil' : 'Se connecter' },
    ],
    [currentUser]
  );

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setMenuOpen(false);
    router.push('/connexion');
  };

  return (
    <header className="flex items-end justify-between gap-3 px-2 pb-1 pt-0 md:pt-2">
      <Link href="/" className="flex shrink-0 items-end">
        <SiteBrandLogo className="h-auto w-[145px]" />
      </Link>

      <div className="relative flex min-w-0 flex-col items-end gap-1.5">
        <div ref={menuRef} className="relative flex flex-col items-end">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg text-gray-600"
            aria-label="Menu principal"
            aria-expanded={menuOpen}
            aria-controls="home-header-menu"
          >
            ☰
          </button>
          {menuOpen && (
            <div
              id="home-header-menu"
              className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              <nav className="py-1">
                {links.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {currentUser && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full border-t border-gray-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Se déconnecter
                </button>
              )}
            </div>
          )}
        </div>
        <p className="max-w-[9.5rem] text-right text-[11px] leading-snug text-gray-600 sm:max-w-none sm:text-xs">
          <Link
            href="/inscription"
            onClick={() => setMenuOpen(false)}
            className="font-semibold text-green-700 underline-offset-2 hover:underline"
          >
            S&apos;inscrire
          </Link>
          <span className="mx-0.5 text-gray-400" aria-hidden>
            /
          </span>
          <Link
            href="/connexion"
            onClick={() => setMenuOpen(false)}
            className="font-semibold text-green-700 underline-offset-2 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </header>
  );
}
