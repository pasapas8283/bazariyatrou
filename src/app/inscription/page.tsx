'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import SiteBrandLogo from '@/components/SiteBrandLogo';
import PasswordField from '@/components/PasswordField';
import { useAuth } from '../../hooks/use-auth';

export default function InscriptionPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarFile = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !birthDate ||
      !phone.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    const result = register({
      firstName,
      lastName,
      birthDate,
      phone,
      password,
      avatar,
    });

    if (!result.ok) {
      alert(result.message);
      return;
    }

    alert('Compte créé avec succès.');
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
            Créer un compte
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Préparez votre espace vendeur et acheteur.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <input
                type="text"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={fieldClass}
              />
              {submitted && !firstName.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Le prénom est obligatoire
                </p>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={fieldClass}
              />
              {submitted && !lastName.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Le nom est obligatoire
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`${fieldClass} ${birthDate ? '' : 'text-transparent'}`}
                />
                {!birthDate && (
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    Date de naissance
                  </span>
                )}
              </div>
              {submitted && !birthDate && (
                <p className="mt-1 text-sm text-red-600">
                  La date de naissance est obligatoire
                </p>
              )}
            </div>

            <div>
              <input
                type="tel"
                placeholder="Numéro de téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
              />
              {submitted && !phone.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Le numéro est obligatoire
                </p>
              )}
            </div>

            <div>
              <PasswordField
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                autoComplete="new-password"
              />
              {submitted && !password.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Le mot de passe est obligatoire
                </p>
              )}
            </div>

            <div>
              <PasswordField
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass}
                autoComplete="new-password"
              />
              {submitted && !confirmPassword.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  La confirmation est obligatoire
                </p>
              )}
              {submitted &&
                password.trim() &&
                confirmPassword.trim() &&
                password !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Photo de profil
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                className="hidden"
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Choisir un fichier
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-lg"
                  aria-label="Prendre une photo"
                  title="Prendre une photo"
                >
                  📷
                </button>
              </div>

              {avatar && (
                <img
                  src={avatar}
                  alt="Profil"
                  className="mt-3 h-20 w-20 rounded-full object-cover"
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-green-700 py-4 text-base font-bold text-white hover:bg-green-800"
            >
              S’inscrire
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="font-semibold text-green-700">
              Se connecter
            </Link>
          </p>
          </div>
        </div>
      </MobileShell>
    </main>
  );
}