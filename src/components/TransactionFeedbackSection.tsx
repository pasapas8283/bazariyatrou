'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import type { MarketplaceItem } from '../types/marketplace';
import type { TransactionFeedbackEntry } from '../types/transaction-feedback';

type Props = {
  listing: MarketplaceItem;
  onListingRefresh: () => void | Promise<void>;
};

export default function TransactionFeedbackSection({
  listing,
  onListingRefresh,
}: Props) {
  const { currentUser, hydrated } = useAuth();
  const [items, setItems] = useState<TransactionFeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerBody, setSellerBody] = useState('');
  const [buyerBody, setBuyerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const loadFeedback = useCallback(async () => {
    if (listing.status !== 'sold') {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/listings/${encodeURIComponent(listing.id)}/feedback`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items?: TransactionFeedbackEntry[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [listing.id, listing.status]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const sellerFeedback = items.find((i) => i.role === 'seller');
  const buyerFeedback = items.find((i) => i.role === 'buyer');

  const isSeller = Boolean(currentUser && currentUser.id === listing.sellerId);
  const isBuyer = Boolean(
    currentUser && listing.buyerId && listing.buyerId === currentUser.id
  );
  const canClaim =
    listing.status === 'sold' &&
    !listing.buyerId &&
    Boolean(currentUser) &&
    !isSeller;

  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Membre'
    : '';

  const submit = async (role: 'seller' | 'buyer', body: string) => {
    if (!currentUser) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/listings/${encodeURIComponent(listing.id)}/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bzy-user-id': currentUser.id,
          },
          body: JSON.stringify({
            authorName: displayName,
            role,
            body,
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          typeof data.error === 'string' ? data.error : 'Envoi impossible.'
        );
        return;
      }
      if (role === 'seller') setSellerBody('');
      else setBuyerBody('');
      await loadFeedback();
    } catch {
      setError('Réseau indisponible.');
    } finally {
      setSubmitting(false);
    }
  };

  const claimBuyer = async () => {
    if (!currentUser || !canClaim) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/listings/${encodeURIComponent(listing.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-bzy-user-id': currentUser.id,
          },
          body: JSON.stringify({
            buyerId: currentUser.id,
            buyerName: displayName,
            updatedAt: new Date().toISOString(),
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : 'Impossible de confirmer.'
        );
        return;
      }
      await onListingRefresh();
      await loadFeedback();
    } catch {
      setError('Réseau indisponible.');
    } finally {
      setClaiming(false);
    }
  };

  if (listing.status !== 'sold') {
    return (
      <div className="border-t px-4 py-5 md:px-5">
        <h2 className="font-bold text-gray-900">Avis sur la transaction</h2>
        <p className="mt-2 text-sm text-gray-600">
          Quand l’annonce sera marquée comme vendue, le vendeur et l’acheteur
          pourront chacun laisser un court commentaire sur le déroulement de
          l’échange.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t px-4 py-5 md:px-5">
      <h2 className="font-bold text-gray-900">Avis sur la transaction</h2>
      <p className="mt-1 text-xs text-gray-500">
        Un message par rôle : retour du vendeur sur l’acheteur, et de l’acheteur
        sur le vendeur.
      </p>

      {hydrated && canClaim && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Vous avez acheté cet article ? Confirmez pour pouvoir publier votre
            avis en tant qu’acheteur.
          </p>
          <button
            type="button"
            disabled={claiming}
            onClick={() => void claimBuyer()}
            className="mt-3 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {claiming ? 'Enregistrement…' : 'Je confirme être l’acheteur'}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
            <h3 className="text-sm font-extrabold text-gray-800">Vendeur</h3>
            {sellerFeedback ? (
              <>
                <p className="mt-1 text-xs text-gray-500">
                  {sellerFeedback.authorName} ·{' '}
                  {new Date(sellerFeedback.createdAt).toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                  {sellerFeedback.body}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Pas encore d’avis.</p>
            )}
            {isSeller && !sellerFeedback && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={sellerBody}
                  onChange={(e) => setSellerBody(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Votre retour sur l’échange avec l’acheteur…"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm"
                />
                <button
                  type="button"
                  disabled={submitting || sellerBody.trim().length < 1}
                  onClick={() => void submit('seller', sellerBody.trim())}
                  className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Publier mon avis
                </button>
              </div>
            )}
            {isSeller && sellerFeedback && (
              <p className="mt-2 text-xs text-gray-400">
                Vous avez déjà publié votre avis.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
            <h3 className="text-sm font-extrabold text-gray-800">Acheteur</h3>
            {!listing.buyerId && (
              <p className="mt-2 text-sm text-gray-500">
                L’acheteur n’est pas encore identifié sur cette annonce.
              </p>
            )}
            {listing.buyerId &&
              listing.buyerName &&
              (isSeller || isBuyer) && (
                <p className="mt-1 text-xs text-gray-600">
                  Compte associé : {listing.buyerName}
                </p>
              )}
            {listing.buyerId &&
              (buyerFeedback ? (
                <>
                  <p className="mt-1 text-xs text-gray-500">
                    {buyerFeedback.authorName} ·{' '}
                    {new Date(buyerFeedback.createdAt).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {buyerFeedback.body}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Pas encore d’avis.</p>
              ))}
            {listing.buyerId && isBuyer && !buyerFeedback && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={buyerBody}
                  onChange={(e) => setBuyerBody(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Votre retour sur le vendeur et la transaction…"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm"
                />
                <button
                  type="button"
                  disabled={submitting || buyerBody.trim().length < 1}
                  onClick={() => void submit('buyer', buyerBody.trim())}
                  className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Publier mon avis
                </button>
              </div>
            )}
            {listing.buyerId && isBuyer && buyerFeedback && (
              <p className="mt-2 text-xs text-gray-400">
                Vous avez déjà publié votre avis.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
