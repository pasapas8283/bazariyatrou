'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import SiteBrandLogo from '@/components/SiteBrandLogo';
import PasswordField from '@/components/PasswordField';
import { useAuth } from '../../hooks/use-auth';
import { compressListingImageForApi } from '@/lib/listing-images';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitted(true);

    const missing: string[] = [];
    if (!firstName.trim()) missing.push('prénom');
    if (!lastName.trim()) missing.push('nom');
    if (!birthDate) missing.push('date de naissance');
    if (!phone.trim()) missing.push('numéro de téléphone');
    if (!password.trim()) missing.push('mot de passe');
    if (!confirmPassword.trim()) missing.push('confirmation du mot de passe');

    if (missing.length > 0) {
      alert(`Complète les champs obligatoires : ${missing.join(', ')}.`);
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>('[data-register-error="true"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.trim().length < 4) {
      alert('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      let avatarForSave = avatar;
      if (avatarForSave?.startsWith('data:image/')) {
        avatarForSave = await compressListingImageForApi(avatarForSave, 180_000);
      }

      const result = register({
        firstName,
        lastName,
        birthDate,
        phone,
        password,
        avatar: avatarForSave,
      });

      if (!result.ok) {
        alert(result.message);
        return;
      }

      if ('warning' in result && result.warning) {
        alert(result.warning);
      } else {
        alert('Compte créé avec succès.');
      }
      router.push('/profil');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Impossible de créer le compte. Réessaie.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-100';
  const errorBorder =
    'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100';

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
          <div className="px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
            <h1 className="text-2xl font-extrabold text-gray-900">
              Créer un compte
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Préparez votre espace vendeur et acheteur.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-register-error={
                    submitted && !firstName.trim() ? 'true' : undefined
                  }
                  className={`${fieldClass} ${
                    submitted && !firstName.trim() ? errorBorder : ''
                  }`}
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
                  data-register-error={
                    submitted && !lastName.trim() ? 'true' : undefined
                  }
                  className={`${fieldClass} ${
                    submitted && !lastName.trim() ? errorBorder : ''
                  }`}
                />
                {submitted && !lastName.trim() && (
                  <p className="mt-1 text-sm text-red-600">
                    Le nom est obligatoire
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  data-register-error={
                    submitted && !birthDate ? 'true' : undefined
                  }
                  className={`${fieldClass} ${
                    submitted && !birthDate ? errorBorder : ''
                  }`}
                />
                {submitted && !birthDate && (
                  <p className="mt-1 text-sm text-red-600">
                    La date de naissance est obligatoire
                  </p>
                )}
              </div>

              <div>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="Numéro de téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-register-error={
                    submitted && !phone.trim() ? 'true' : undefined
                  }
                  className={`${fieldClass} ${
                    submitted && !phone.trim() ? errorBorder : ''
                  }`}
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
                  className={`${fieldClass} ${
                    submitted && !password.trim() ? errorBorder : ''
                  }`}
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
                  className={`${fieldClass} ${
                    submitted &&
                    (!confirmPassword.trim() || password !== confirmPassword)
                      ? errorBorder
                      : ''
                  }`}
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
                  Photo de profil (optionnel)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleAvatarFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => {
                    handleAvatarFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex min-h-[44px] flex-1 touch-manipulation items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    Choisir un fichier
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-lg"
                    aria-label="Prendre une photo"
                    title="Prendre une photo"
                  >
                    📷
                  </button>
                </div>

                {avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt="Profil"
                    className="mt-3 h-20 w-20 rounded-full object-cover"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[52px] w-full touch-manipulation rounded-2xl bg-green-700 py-4 text-base font-bold text-white hover:bg-green-800 disabled:opacity-70"
              >
                {isSubmitting ? 'Création du compte…' : 'S’inscrire'}
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
