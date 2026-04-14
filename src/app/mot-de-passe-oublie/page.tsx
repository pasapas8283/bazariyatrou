'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import PasswordField from '@/components/PasswordField';
import { useAuth } from '../../hooks/use-auth';

export default function MotDePasseOubliePage() {
  const router = useRouter();
  const { requestPasswordReset, resetPassword, passwordResetSession } = useAuth();

  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);

  const fieldClass =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-100';

  const handleIdentityCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!phone.trim() || !birthDate) return;

    const result = requestPasswordReset({ phone, birthDate });
    if (!result.ok) {
      alert(result.message);
      return;
    }

    setStep(2);
    setSubmitted(false);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!newPassword.trim() || !confirmPassword.trim()) return;
    if (newPassword !== confirmPassword) return;
    if (!passwordResetSession) {
      alert('Session expirée. Recommencez la récupération.');
      setStep(1);
      setSubmitted(false);
      return;
    }

    const result = resetPassword({ newPassword });
    if (!result.ok) {
      alert(result.message);
      setStep(1);
      setSubmitted(false);
      return;
    }

    alert('Mot de passe réinitialisé avec succès.');
    router.push('/connexion');
  };

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white px-4 py-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Mot de passe oublié
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Récupérez l’accès à votre compte en deux étapes.
          </p>

          {step === 1 ? (
            <form onSubmit={handleIdentityCheck} className="mt-6 space-y-4">
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
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={fieldClass}
                />
                {submitted && !birthDate && (
                  <p className="mt-1 text-sm text-red-600">
                    La date de naissance est obligatoire
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-green-700 py-4 text-base font-bold text-white hover:bg-green-800"
              >
                Continuer
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <div>
                <PasswordField
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={fieldClass}
                  autoComplete="new-password"
                />
                {submitted && !newPassword.trim() && (
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
                  newPassword.trim() &&
                  confirmPassword.trim() &&
                  newPassword !== confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-green-700 py-4 text-base font-bold text-white hover:bg-green-800"
              >
                Réinitialiser
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            Retour à la{' '}
            <Link href="/connexion" className="font-semibold text-green-700">
              connexion
            </Link>
          </p>
        </div>
      </MobileShell>
    </main>
  );
}
