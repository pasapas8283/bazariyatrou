'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import { useAuth } from '../../hooks/use-auth';

export default function VerificationTelephonePage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    router.replace(currentUser ? '/profil' : '/connexion');
  }, [currentUser, router]);

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white px-4 py-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Vérification téléphone désactivée
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Cette étape n’est plus requise. Redirection en cours...
          </p>
        </div>
      </MobileShell>
    </main>
  );
}