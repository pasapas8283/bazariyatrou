'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/publier', label: 'Publier' },
  { href: '/mes-annonces', label: 'Mes annonces' },
  { href: '/favoris', label: 'Favoris' },
  { href: '/profil', label: 'Profil' },
];

export default function DesktopTopNav() {
  const pathname = usePathname();

  return (
    <header className="hidden md:block">
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <nav className="flex flex-wrap items-center gap-2">
          {navLinks.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-green-700 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
