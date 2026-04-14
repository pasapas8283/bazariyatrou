'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import PasswordField from '@/components/PasswordField';

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin/boost';
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        alert('Mot de passe admin incorrect.');
        return;
      }
      router.replace(next);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white px-4 py-8">
          <h1 className="text-xl font-extrabold text-gray-900">Connexion admin</h1>
          <p className="mt-1 text-sm text-gray-500">Accès sécurisé administration.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <PasswordField
              placeholder="Mot de passe admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-100"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-green-700 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </MobileShell>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#efefef]" />}>
      <AdminLoginPageContent />
    </Suspense>
  );
}
