'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Accueil', icon: '⌂' },
  { href: '/messages', label: 'Messages', icon: '✉' },
  { href: '/publier', label: 'Publier', icon: '+' },
  { href: '/favoris', label: 'Favoris', icon: '♡' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeNav =
    pathname === '/'
      ? '/'
      : pathname.startsWith('/messages')
        ? '/messages'
        : pathname.startsWith('/favoris')
          ? '/favoris'
          : pathname.startsWith('/profil')
            ? '/profil'
            : pathname.startsWith('/publier')
              ? '/publier'
              : pathname;

  return (
    <>
      {/* Réserve l'espace pour éviter que le contenu passe sous la barre fixe. */}
      <div
        aria-hidden
        className="md:hidden"
        style={{
          height: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))',
        }}
      />
      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="mx-auto w-full max-w-[640px] px-2 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]">
          <div className="grid grid-cols-5 rounded-2xl border border-gray-200 bg-white/95 shadow-[0_-8px_26px_rgba(0,0,0,0.10)] backdrop-blur">
            {navItems.map((item) => {
              const active = activeNav === item.href;
              const isPublish = item.href === '/publier';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 text-[11px] ${
                    isPublish
                      ? 'text-white'
                      : active
                        ? 'text-green-700'
                        : 'text-gray-500'
                  }`}
                >
                  <span
                    className={`${
                      isPublish
                        ? 'flex h-8 min-w-8 items-center justify-center rounded-full bg-green-700 px-2 text-lg leading-none'
                        : 'text-[20px] leading-none'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`mt-1 leading-none ${
                      isPublish ? 'text-[11px] font-semibold text-green-700' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}