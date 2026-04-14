'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import SiteBrandLogo from '@/components/SiteBrandLogo';
import PasswordField from '@/components/PasswordField';
import { useAuth } from '../../hooks/use-auth';

export default function ConnexionPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!identifier.trim() || !password.trim()) return;

    const result = login({ phone: identifier, password });

    if (!result.ok) {
      alert(result.message);
      return;
    }

    alert('Connexion réussie.');
    router.push('/profil');
  };

  const fieldClass =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-100';

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 bg-white px-2 pb-4 pt-[max(1rem,env(safe-area-inset-top,0px))] md:py-4">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-2xl font-bold leading-none text-gray-800"
              aria-label="Retour à l'accueil"
            >
              ‹
            </Link>
            <Link href="/" className="flex shrink-0 items-end">
              <SiteBrandLogo className="h-auto w-[155px]" />
            </Link>
            <div className="h-9 w-9" aria-hidden />
          </div>
          <div className="px-4 py-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Connexion
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Connectez-vous avec votre nom ou votre numéro et mot de passe.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <input
                type="text"
                placeholder="Nom ou numéro de téléphone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={fieldClass}
              />
              {submitted && !identifier.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Le nom ou le numéro est obligatoire
                </p>
              )}
            </div>

            <div>
              <PasswordField
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                autoComplete="current-password"
              />
              {submitted && !password.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Le mot de passe est obligatoire
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-green-700 py-4 text-base font-bold text-white hover:bg-green-800"
            >
              Se connecter
            </button>
          </form>

          <p className="mt-3 text-right text-sm">
            <Link href="/mot-de-passe-oublie" className="font-semibold text-green-700">
              Mot de passe oublié ?
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="font-semibold text-green-700">
              S’inscrire
            </Link>
          </p>
          </div>
        </div>
      </MobileShell>
    </main>
  );
}