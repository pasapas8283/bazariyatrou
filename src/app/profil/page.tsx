'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import DesktopTopNav from '@/components/DesktopTopNav';
import { readProfile, writeProfile, type LocalProfile } from '../../lib/profile-storage';
import { useMarketplaceItems } from '../../hooks/use-marketplace-items';
import { readFavorites } from '../../lib/favorites-storage';
import { useAuth } from '../../hooks/use-auth';

export default function ProfilPage() {
  const { myItems } = useMarketplaceItems();
  const { currentUser, usersCount, isLoggedIn, logout, refresh } = useAuth();

  const [profile, setProfile] = useState<LocalProfile>({
    name: 'Utilisateur',
    phone: '',
    avatar: '',
  });

  const [favoritesCount, setFavoritesCount] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setProfile(readProfile());
    setFavoritesCount(readFavorites().length);
  }, [currentUser]);

  const myItemsCount = useMemo(() => myItems.length, [myItems]);

  const handleSave = () => {
    writeProfile(profile);
    setEditing(false);
    refresh();
    alert('Profil enregistré.');
  };

  const handleLogout = () => {
    logout();
    setProfile(readProfile());
    alert('Déconnexion réussie.');
  };

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <div className="mx-auto mb-0 w-full max-w-5xl md:mb-4">
        <DesktopTopNav />
      </div>
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Profil</h1>
            <p className="mt-2 text-sm text-gray-500">
              Gérez votre compte et votre activité.
            </p>
          </div>

            <div className="space-y-4 px-4 pb-5">
            <div className="rounded-3xl bg-green-700 p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>

                <div>
                  <h2 className="text-xl font-extrabold">
  {currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : profile.name || 'Utilisateur'}
</h2>
<p className="mt-1 text-sm text-green-100">
  {currentUser?.phone?.trim()
    ? currentUser.phone
    : profile.phone?.trim()
    ? profile.phone
    : 'Numéro non renseigné'}
</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p className="text-2xl font-black text-gray-900">
                  {myItemsCount}
                </p>
                <p className="mt-1 text-sm text-gray-500">Annonces</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p className="text-2xl font-black text-gray-900">
                  {favoritesCount}
                </p>
                <p className="mt-1 text-sm text-gray-500">Favoris</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p className="text-2xl font-black text-gray-900">
                  {usersCount}
                </p>
                <p className="mt-1 text-sm text-gray-500">Utilisateurs</p>
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <h3 className="text-base font-extrabold text-gray-900">
                  Compte utilisateur
                </h3>
                <p className="text-sm text-gray-500">
                  Créez un compte ou connectez-vous pour préparer la future
                  version avec authentification réelle.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 md:max-w-md">
                  <Link
                    href="/inscription"
                    className="rounded-2xl bg-green-700 py-3 text-center text-sm font-bold text-white"
                  >
                    S’inscrire
                  </Link>

                  <Link
                    href="/connexion"
                    className="rounded-2xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-700"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-gray-900">
                    Informations personnelles
                  </h3>

                  {!editing ? (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                    >
                      Modifier
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSave}
                      className="rounded-xl bg-green-700 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Enregistrer
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      disabled={!editing}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                        editing
                          ? 'border-gray-200 bg-white'
                          : 'border-gray-100 bg-gray-50 text-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone ?? ''}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      disabled={!editing}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                        editing
                          ? 'border-gray-200 bg-white'
                          : 'border-gray-100 bg-gray-50 text-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 w-full rounded-2xl bg-red-100 py-3 text-sm font-bold text-red-700"
                >
                  Se déconnecter
                </button>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <Link
                href="/parametres"
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4"
              >
                <div>
                  <p className="text-base font-bold text-gray-900">Paramètres</p>
                  <p className="text-sm text-gray-500">
                    Confidentialité, notifications, préférences
                  </p>
                </div>
                <span className="text-xl text-gray-400">›</span>
              </Link>
              <Link
                href="/mes-annonces"
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4"
              >
                <div>
                  <p className="text-base font-bold text-gray-900">
                    Mes annonces
                  </p>
                  <p className="text-sm text-gray-500">
                    Voir, vendre ou supprimer mes annonces
                  </p>
                </div>
                <span className="text-xl text-gray-400">›</span>
              </Link>
              <Link
                href="/favoris"
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4"
              >
                <div>
                  <p className="text-base font-bold text-gray-900">
                    Mes favoris
                  </p>
                  <p className="text-sm text-gray-500">
                    Retrouver les annonces enregistrées
                  </p>
                </div>
                <span className="text-xl text-gray-400">›</span>
              </Link>
            </div>
          </div>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}