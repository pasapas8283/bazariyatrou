'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import DesktopTopNav from '@/components/DesktopTopNav';
import PasswordField from '@/components/PasswordField';
import { useAuth } from '../../hooks/use-auth';
import { changeCurrentUserPassword } from '../../lib/auth-storage';
import {
  readPlatformSettings,
  writePlatformSettings,
  type PlatformSettings,
} from '../../lib/platform-settings-storage';
import { ISLAND_OPTIONS } from '../../lib/comoros-locations';

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? 'bg-green-700' : 'bg-gray-300'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

export default function ParametresPage() {
  const router = useRouter();
  const { currentUser, hydrated } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setSettings(readPlatformSettings());
  }, []);

  useEffect(() => {
    if (hydrated && !currentUser) router.replace('/connexion');
  }, [hydrated, currentUser, router]);

  if (!settings) return null;

  const saveSettings = () => {
    writePlatformSettings(settings);
    alert('Paramètres enregistrés.');
  };

  const handlePasswordUpdate = () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      alert('Remplissez tous les champs mot de passe.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('La confirmation ne correspond pas.');
      return;
    }
    const result = changeCurrentUserPassword({ currentPassword, newPassword });
    if (!result.ok) {
      alert(result.message);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert('Mot de passe mis à jour.');
  };

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <div className="mx-auto mb-0 w-full max-w-5xl md:mb-4">
        <DesktopTopNav />
      </div>
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Paramètres</h1>
            <p className="mt-2 text-sm text-gray-500">
              Gérez votre compte, confidentialité et préférences.
            </p>
          </div>

          <div className="space-y-4 px-4 pb-5">
            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="text-base font-extrabold text-gray-900">Compte</h2>
              <p className="mt-1 text-sm text-gray-500">
                Modifier vos informations personnelles depuis Profil.
              </p>
              <Link
                href="/profil"
                className="mt-3 inline-block rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Aller au profil
              </Link>

              <div className="mt-4 space-y-3 border-t pt-4">
                <h3 className="text-sm font-bold text-gray-900">Changer le mot de passe</h3>
                <PasswordField
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none"
                />
                <PasswordField
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none"
                />
                <PasswordField
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le nouveau mot de passe"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none"
                />
                <button
                  type="button"
                  onClick={handlePasswordUpdate}
                  className="w-full rounded-2xl bg-green-700 py-3 text-sm font-bold text-white"
                >
                  Mettre à jour le mot de passe
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="text-base font-extrabold text-gray-900">Confidentialité</h2>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Afficher mon téléphone dans les annonces
                  </p>
                  <p className="text-xs text-gray-500">Désactivez pour masquer votre numéro.</p>
                </div>
                <Toggle
                  checked={settings.showPhoneOnListings}
                  onChange={(next) =>
                    setSettings((prev) => (prev ? { ...prev, showPhoneOnListings: next } : prev))
                  }
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="text-base font-extrabold text-gray-900">Préférences de publication</h2>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Préremplir mon téléphone</p>
                  <Toggle
                    checked={settings.autoFillPhoneInPublish}
                    onChange={(next) =>
                      setSettings((prev) =>
                        prev ? { ...prev, autoFillPhoneInPublish: next } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-900">
                    Île par défaut
                  </label>
                  <select
                    value={settings.defaultIsland}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, defaultIsland: e.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
                  >
                    <option>Île</option>
                    {ISLAND_OPTIONS.map((island) => (
                      <option key={island}>{island}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="text-base font-extrabold text-gray-900">Notifications</h2>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Messages reçus</p>
                  <Toggle
                    checked={settings.notifyMessages}
                    onChange={(next) =>
                      setSettings((prev) => (prev ? { ...prev, notifyMessages: next } : prev))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Nouveaux favoris</p>
                  <Toggle
                    checked={settings.notifyFavorites}
                    onChange={(next) =>
                      setSettings((prev) => (prev ? { ...prev, notifyFavorites: next } : prev))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Boost expiré</p>
                  <Toggle
                    checked={settings.notifyBoosts}
                    onChange={(next) =>
                      setSettings((prev) => (prev ? { ...prev, notifyBoosts: next } : prev))
                    }
                  />
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={saveSettings}
              className="w-full rounded-2xl bg-green-700 py-4 text-base font-bold text-white"
            >
              Enregistrer les paramètres
            </button>
          </div>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}
