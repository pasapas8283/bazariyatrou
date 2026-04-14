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
  const isFloating = pathname === '/';

  return (
    <nav
      className={
        isFloating
          ? 'sticky bottom-0 z-40 w-full border-t border-gray-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur md:hidden'
          : 'sticky bottom-0 w-full border-t border-gray-200 bg-white md:hidden'
      }
    >
      <div className="grid grid-cols-5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const isPublish = item.href === '/publier';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2.5 text-xs ${
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
                    ? 'flex h-7 min-w-7 items-center justify-center rounded-full bg-green-700 px-2 text-base leading-none'
                    : 'text-lg'
                }`}
              >
                {item.icon}
              </span>
              <span className={`mt-1 ${isPublish ? 'text-[11px] font-semibold text-green-700' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}