'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import ProductMobileShell from '@/components/ProductMobileShell';
import BottomNav from '@/components/BottomNav';
import DesktopTopNav from '@/components/DesktopTopNav';
import SiteBrandLogo from '@/components/SiteBrandLogo';
import ListingFavoriteButton from '@/components/ListingFavoriteButton';
import type { MarketplaceItem } from '../../../types/marketplace';
import {
  conditionDisplayLabel,
  listingCategoryDisplayLabel,
  listingPriceDisplaySuffix,
} from '../../../lib/marketplace-formatters';
import { formatPriceForVisitor } from '../../../lib/currency-conversion';
import { useDisplayCurrency } from '../../../contexts/display-currency-context';
import DisplayCurrencyToggle from '@/components/DisplayCurrencyToggle';
import TransactionFeedbackSection from '@/components/TransactionFeedbackSection';
import { useAuth } from '@/hooks/use-auth';
import { loadMergedMarketplaceItems } from '../../../lib/listings-merge';
import {
  deleteMarketplaceItem,
  readMarketplaceItems,
  updateMarketplaceItem,
  writeMarketplaceItems,
} from '../../../lib/marketplace-storage';
import {
  readConversations,
  upsertConversation,
  type Conversation,
} from '../../../lib/messages-storage';
import {
  buildWhatsAppHref,
  WHATSAPP_DEFAULT_MESSAGE,
} from '../../../lib/contact-links';
import {
  fetchListingImageAsBlob,
  resolveListingImageUrl,
  saveListingImageBlobToGallery,
  saveListingImageToGallery,
} from '../../../lib/save-listing-image-native';

const fallbackImage =
  'https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200&auto=format&fit=crop';

function ShareIcon({
  children,
  className = 'h-4 w-4',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      {children}
    </svg>
  );
}

function WhatsAppGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.52 3.48A11.9 11.9 0 0012.03 0C5.42 0 .05 5.36.05 11.98c0 2.11.55 4.18 1.6 6.01L0 24l6.17-1.62a11.9 11.9 0 005.86 1.5h.01c6.61 0 11.98-5.36 11.98-11.98 0-3.2-1.25-6.22-3.5-8.42zm-8.49 18.38h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.22-3.66.96.98-3.57-.24-.37a9.87 9.87 0 01-1.53-5.3c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.9 7c0 5.46-4.44 9.9-9.93 9.9zm5.43-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15s-.76.97-.93 1.16c-.17.2-.34.22-.64.08-.3-.15-1.24-.46-2.37-1.47a8.86 8.86 0 01-1.64-2.04c-.17-.3-.02-.46.12-.6.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.08-.8.37s-1.05 1.02-1.05 2.48 1.08 2.88 1.23 3.08c.15.2 2.11 3.22 5.1 4.51.71.3 1.27.49 1.7.63.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.56-.35z" />
    </svg>
  );
}

function AnnonceDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = useMemo(() => {
    const raw = params.id;
    if (Array.isArray(raw)) return raw[0] ?? '';
    if (typeof raw === 'string' && raw) return raw;
    return searchParams.get('id') ?? '';
  }, [params.id, searchParams]);

  const { currentUser } = useAuth();
  const { displayCurrency } = useDisplayCurrency();

  const [product, setProduct] = useState<MarketplaceItem | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setSelectedImage('');
      return;
    }

    const localFirst = readMarketplaceItems().find((item) => item.id === id);
    if (localFirst) {
      setProduct(localFirst);
      const imgs =
        localFirst.images && localFirst.images.length > 0
          ? localFirst.images
          : [fallbackImage];
      setSelectedImage(imgs[0]);
    }

    let cancelled = false;
    (async () => {
      const merged = await loadMergedMarketplaceItems();
      if (cancelled) return;
      writeMarketplaceItems(merged);
      const foundProduct =
        merged.find((item) => item.id === id) ?? null;
      setProduct(foundProduct);

      if (foundProduct) {
        const imgs =
          foundProduct.images && foundProduct.images.length > 0
            ? foundProduct.images
            : [fallbackImage];
        setSelectedImage(imgs[0]);
      } else {
        setSelectedImage('');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const reloadListing = useCallback(async () => {
    if (!id) return;
    const merged = await loadMergedMarketplaceItems();
    writeMarketplaceItems(merged);
    const found = merged.find((item) => item.id === id) ?? null;
    setProduct(found);
  }, [id]);

  const productImages = useMemo(() => {
    if (!product) return [fallbackImage];

    return product.images && product.images.length > 0
      ? product.images
      : [fallbackImage];
  }, [product]);

  const selectedImageIndex = useMemo(() => {
    const idx = productImages.findIndex((img) => img === selectedImage);
    return idx >= 0 ? idx : 0;
  }, [productImages, selectedImage]);

  const favoritePriceLabel = useMemo(() => {
    if (!product) return '';
    return (
      formatPriceForVisitor(
        product.price,
        product.priceCurrency ?? 'KMF',
        displayCurrency
      ) + listingPriceDisplaySuffix(product)
    );
  }, [product, displayCurrency]);

  const openGalleryAt = (img: string) => {
    setSelectedImage(img);
    setIsGalleryOpen(true);
  };

  const showPrevImage = () => {
    if (productImages.length <= 1) return;
    const prev =
      (selectedImageIndex - 1 + productImages.length) % productImages.length;
    setSelectedImage(productImages[prev]);
  };

  const showNextImage = () => {
    if (productImages.length <= 1) return;
    const next = (selectedImageIndex + 1) % productImages.length;
    setSelectedImage(productImages[next]);
  };

  const listingUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/annonces/detail?id=${encodeURIComponent(id)}`
      : '';
  const shareText = product
    ? `Regarde cette annonce sur BazariYatrou: ${product.title}`
    : 'Regarde cette annonce sur BazariYatrou';
  const encodedUrl = encodeURIComponent(listingUrl);
  const encodedText = encodeURIComponent(`${shareText} ${listingUrl}`.trim());

  const copyLink = async () => {
    if (!listingUrl) return;
    try {
      await navigator.clipboard.writeText(listingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const openWithCopiedLink = async (url: string) => {
    await copyLink();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (!shareMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (shareMenuRef.current?.contains(target)) return;
      setShareMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShareMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, {
      passive: true,
    });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shareMenuOpen]);

  const saveCurrentImage = async () => {
    const current = selectedImage || productImages[0];
    if (!current) return;
    const baseName = `annonce-${id}-${selectedImageIndex + 1}`;
    const resolved = resolveListingImageUrl(current);

    const extFromMime = (mime: string) => {
      if (mime.includes('png')) return 'png';
      if (mime.includes('webp')) return 'webp';
      if (mime.includes('gif')) return 'gif';
      if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
      return 'jpg';
    };

    const triggerDownload = (href: string, fileName: string) => {
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const tryWebShareBlob = async (
      blob: Blob,
      fileName: string
    ): Promise<boolean> => {
      try {
        const mime = blob.type || 'image/jpeg';
        const file = new File([blob], fileName, { type: mime });
        if (typeof navigator.share !== 'function') return false;
        if (typeof navigator.canShare === 'function') {
          const allowed = navigator.canShare({ files: [file] });
          if (!allowed && !Capacitor.isNativePlatform()) return false;
        }
        await navigator.share({
          title: product?.title ?? 'Photo',
          text: 'Image de l’annonce',
          files: [file],
        });
        return true;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return true;
        return false;
      }
    };

    const fetchedBlob = await fetchListingImageAsBlob(resolved);

    if (Capacitor.isNativePlatform()) {
      if (fetchedBlob) {
        const ext = extFromMime(fetchedBlob.type);
        const fileName = `${baseName}.${ext}`;

        if (Capacitor.getPlatform() === 'android') {
          const shared = await tryWebShareBlob(fetchedBlob, fileName);
          if (shared) return;
        }

        const galleryResult = await saveListingImageBlobToGallery(
          fetchedBlob,
          baseName
        );
        if (galleryResult.ok) {
          alert('Photo enregistrée dans la galerie.');
          return;
        }

        if (Capacitor.getPlatform() !== 'android') {
          const shared = await tryWebShareBlob(fetchedBlob, fileName);
          if (shared) return;
        } else {
          const sharedRetry = await tryWebShareBlob(fetchedBlob, fileName);
          if (sharedRetry) return;
        }

        alert(galleryResult.reason);
        return;
      }

      const fallbackGallery = await saveListingImageToGallery(resolved, baseName);
      if (fallbackGallery.ok) {
        alert('Photo enregistrée dans la galerie.');
        return;
      }
      alert(fallbackGallery.reason);
      return;
    }

    if (fetchedBlob) {
      const ext = extFromMime(fetchedBlob.type);
      const fileName = `${baseName}.${ext}`;
      const shared = await tryWebShareBlob(fetchedBlob, fileName);
      if (shared) return;

      const objectUrl = URL.createObjectURL(fetchedBlob);
      try {
        triggerDownload(objectUrl, fileName);
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      }
      return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: resolved });
        return;
      } catch {
        /* fallback webview */
      }
    }

    try {
      const direct = document.createElement('a');
      direct.href = resolved;
      direct.target = '_blank';
      direct.rel = 'noopener noreferrer';
      direct.download = `${baseName}.jpg`;
      document.body.appendChild(direct);
      direct.click();
      document.body.removeChild(direct);
      return;
    } catch {
      /* continue fallback */
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.title ?? 'Photo',
          text: 'Image de l’annonce',
          url: resolved,
        });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }

    window.location.assign(resolved);
  };

  const isTerrainListing = Boolean(
    product?.terrainSetting ||
      product?.terrainAreaMode ||
      product?.terrainAreaM2 ||
      product?.terrainLengthM ||
      product?.terrainWidthM
  );
  const isHouseSaleListing = Boolean(product?.houseAreaM2);
  const isLocationListing = product?.category === 'location';

  const openConversation = () => {
    if (!product) return;
    if (!currentUser) {
      router.push('/connexion');
      return;
    }

    try {
      const conversations = readConversations(currentUser.id);

      const existing = conversations.find(
        (conv) => conv.itemId === product.id && conv.ownerUserId === currentUser.id
      );

      if (existing) {
        router.push(`/messages/conversation?id=${encodeURIComponent(existing.id)}`);
        return;
      }

      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        ownerUserId: currentUser.id,
        itemId: product.id,
        sellerName: product.sellerName || 'Vendeur',
        productTitle: product.title,
        messages: [],
      };

      upsertConversation(newConversation);
      router.push(
        `/messages/conversation?id=${encodeURIComponent(newConversation.id)}`
      );
    } catch {}
  };

  const handleDelete = () => {
    if (!product) return;
    if (!currentUser || product.sellerId !== currentUser.id) return;

    const confirmed = window.confirm(
      `Supprimer définitivement l'annonce "${product.title}" ?`
    );

    if (!confirmed) return;

    const deleted = deleteMarketplaceItem(product.id);
    if (!deleted) return;

    router.push('/mes-annonces?deleted=1');
  };

  if (!product) {
    return (
      <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
        <ProductMobileShell>
          <div className="p-5">
            <p className="text-base font-medium text-gray-600">
              Produit introuvable.
            </p>
          </div>
        </ProductMobileShell>
      </main>
    );
  }

  const publicPhone = (product.phone ?? '').trim();
  const messagingSource = (product.contactPhone ?? product.phone ?? '').trim();
  const canCall = publicPhone.length > 0;
  const whatsappHref = buildWhatsAppHref(
    messagingSource,
    WHATSAPP_DEFAULT_MESSAGE
  );
  const canWhatsApp = Boolean(whatsappHref);
  const showWhatsAppBelow = canCall && canWhatsApp;
  const isOwner = Boolean(currentUser && product.sellerId === currentUser.id);

  const whatsappButtonClass =
    'flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#25D366] bg-[#ecfdf3] py-4 text-center text-sm font-bold text-[#075e54] hover:bg-[#d8f5e3]';

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <div className="mx-auto mb-0 w-full max-w-5xl md:mb-4">
        <DesktopTopNav />
      </div>
      <ProductMobileShell>
        <div className="bg-white">
          {/* HEADER */}
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

          {/* TITLE */}
          <div className="relative px-4 pt-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="min-w-0 flex-1 text-[19px] font-extrabold text-gray-900">
                {product.title}
              </h1>
              <div ref={shareMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShareMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span>Partager</span>
                  <span aria-hidden className="text-gray-600">
                    <ShareIcon className="h-3.5 w-3.5">
                      <path d="M18 16a3 3 0 00-2.39 1.2l-6.4-3.2a3.05 3.05 0 000-4l6.4-3.2A3 3 0 1015 5a2.9 2.9 0 00.06.58l-6.4 3.2a3 3 0 100 6.44l6.4 3.2A3 3 0 1018 16z" />
                    </ShareIcon>
                  </span>
                </button>
                {shareMenuOpen && (
                  <div className="absolute right-0 top-10 z-40 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                    <div className="mb-1 flex items-center justify-between px-1 py-1">
                      <p className="text-xs font-bold text-gray-700">Choisir une plateforme</p>
                      {copied && (
                        <span className="text-[11px] font-semibold text-green-700">
                          Lien copié
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodedText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShareMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <span aria-hidden className="text-[#25D366]">
                          <ShareIcon>
                            <path d="M20.52 3.48A11.9 11.9 0 0012.03 0C5.42 0 .05 5.36.05 11.98c0 2.11.55 4.18 1.6 6.01L0 24l6.17-1.62a11.9 11.9 0 005.86 1.5h.01c6.61 0 11.98-5.36 11.98-11.98 0-3.2-1.25-6.22-3.5-8.42zm-8.49 18.38h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.22-3.66.96.98-3.57-.24-.37a9.87 9.87 0 01-1.53-5.3c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.9 7c0 5.46-4.44 9.9-9.93 9.9zm5.43-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15s-.76.97-.93 1.16c-.17.2-.34.22-.64.08-.3-.15-1.24-.46-2.37-1.47a8.86 8.86 0 01-1.64-2.04c-.17-.3-.02-.46.12-.6.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.08-.8.37s-1.05 1.02-1.05 2.48 1.08 2.88 1.23 3.08c.15.2 2.11 3.22 5.1 4.51.71.3 1.27.49 1.7.63.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.56-.35z" />
                          </ShareIcon>
                        </span>
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShareMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <span aria-hidden className="text-[#1877F2]">
                          <ShareIcon>
                            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.5h3.05V9.4c0-3.03 1.8-4.7 4.56-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.5h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
                          </ShareIcon>
                        </span>
                        <span>Facebook</span>
                      </a>
                      <a
                        href={`https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=145634995501895&redirect_uri=${encodedUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShareMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <span aria-hidden className="text-[#0084FF]">
                          <ShareIcon>
                            <path d="M12 0C5.37 0 0 5 0 11.17c0 3.51 1.74 6.64 4.46 8.69V24l3.98-2.18c1.07.3 2.2.46 3.56.46 6.63 0 12-5 12-11.17S18.63 0 12 0zm1.19 14.98l-3.06-3.26-5.97 3.26 6.57-6.98 3.09 3.26 5.93-3.26-6.56 6.98z" />
                          </ShareIcon>
                        </span>
                        <span>Messenger</span>
                      </a>
                      <a
                        href={`mailto:?subject=${encodeURIComponent(
                          product.title
                        )}&body=${encodedText}`}
                        onClick={() => setShareMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <span aria-hidden className="text-gray-600">
                          <ShareIcon>
                            <path d="M2 4h20a1 1 0 011 1v14a1 1 0 01-1 1H2a1 1 0 01-1-1V5a1 1 0 011-1zm10 8L3.74 6.5v11h16.52v-11L12 12zm0-2 8.26-4.5H3.74L12 10z" />
                          </ShareIcon>
                        </span>
                        <span>Email</span>
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          await openWithCopiedLink(
                            'https://www.tiktok.com/upload?lang=fr'
                          );
                          setShareMenuOpen(false);
                        }}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <span aria-hidden className="text-black">
                          <ShareIcon>
                            <path d="M21.5 9.3a7.5 7.5 0 01-4.7-1.6v7.1a6.3 6.3 0 11-5.4-6.2v3a3.3 3.3 0 102.4 3.2V0h3a4.5 4.5 0 004.7 4.4v4.9z" />
                          </ShareIcon>
                        </span>
                        <span>TikTok</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await openWithCopiedLink('https://www.instagram.com/');
                          setShareMenuOpen(false);
                        }}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <span aria-hidden className="text-[#E1306C]">
                          <ShareIcon>
                            <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.9A3.85 3.85 0 003.9 7.75v8.5A3.85 3.85 0 007.75 20.1h8.5a3.85 3.85 0 003.85-3.85v-8.5a3.85 3.85 0 00-3.85-3.85h-8.5zm8.95 1.43a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.9a3.1 3.1 0 100 6.2 3.1 3.1 0 000-6.2z" />
                          </ShareIcon>
                        </span>
                        <span>Instagram</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await copyLink();
                          setShareMenuOpen(false);
                        }}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <span aria-hidden className="text-gray-600">
                          <ShareIcon>
                            <path d="M10.6 13.4a1 1 0 010-1.4l3.4-3.4a3 3 0 114.2 4.2l-4.1 4.1a5 5 0 11-7.1-7.1l3.2-3.2a1 1 0 111.4 1.4L8.4 11.2a3 3 0 104.2 4.2l4.1-4.1a1 1 0 00-1.4-1.4l-3.4 3.4a1 1 0 01-1.4 0z" />
                          </ShareIcon>
                        </span>
                        <span>Copier lien</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                {listingCategoryDisplayLabel(product)}
              </span>

              {product.subCategory && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                  {product.subCategory}
                </span>
              )}

              {product.subSubCategory && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                  {product.subSubCategory}
                </span>
              )}

              {product.isFeatured === true &&
                typeof product.featuredUntil === 'string' &&
                new Date(product.featuredUntil).getTime() > Date.now() && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                    Boostée
                  </span>
                )}

              {product.sellerType === 'pro' && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  Vendeur Pro
                </span>
              )}

              {!isTerrainListing &&
                !isHouseSaleListing &&
                !isLocationListing && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                  {conditionDisplayLabel(product.condition)}
                </span>
              )}

              {product.status === 'sold' && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  Vendu
                </span>
              )}
            </div>
          </div>

          {/* IMAGE — z-0 pour que le bandeau prix (-mt) reste au-dessus (z-10) et ne soit pas masqué */}
          <div className="relative z-0 mt-3 md:px-4">
            <div className="relative overflow-hidden md:rounded-2xl">
              <button
                type="button"
                onClick={() => openGalleryAt(selectedImage || productImages[0])}
                className="block w-full"
              >
                <img
                  src={selectedImage || productImages[0]}
                  alt={product.title}
                  className="h-[260px] w-full cursor-zoom-in object-cover md:h-[360px]"
                />
              </button>
              <ListingFavoriteButton
                id={product.id}
                title={product.title}
                price={favoritePriceLabel}
                image={selectedImage || productImages[0]}
                category={listingCategoryDisplayLabel(product)}
                condition={
                  isTerrainListing || isHouseSaleListing || isLocationListing
                    ? undefined
                    : conditionDisplayLabel(product.condition)
                }
                className="pointer-events-auto absolute bottom-2 right-2 z-30 min-h-11 min-w-11"
              />
            </div>
          </div>

          {/* PRICE — tout le bloc z-10 en pointer-events-none sauf prix / devise / texte, sinon la zone transparente au-dessus de la photo vole les clics du cœur. */}
          <div className="pointer-events-none relative z-10 px-4">
            <div className="-mt-8 flex flex-wrap items-end gap-2">
              <div className="pointer-events-auto inline-block rounded-r-2xl bg-green-700 px-4 py-3 shadow-lg">
                <p className="text-2xl font-extrabold text-white">
                  {formatPriceForVisitor(
                    product.price,
                    product.priceCurrency ?? 'KMF',
                    displayCurrency
                  )}
                  {listingPriceDisplaySuffix(product) !== '' && (
                    <span className="text-lg font-bold">
                      {listingPriceDisplaySuffix(product)}
                    </span>
                  )}
                </p>
              </div>
              <div className="pointer-events-auto rounded-xl border border-white/80 bg-white/95 p-0.5 shadow-md backdrop-blur-sm">
                <DisplayCurrencyToggle />
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              Conversion indicative : 1&nbsp;€ = 491,96775&nbsp;KMF (parité officielle).
            </p>
          </div>

          {/* INFOS */}
          <div className="grid gap-4 px-4 py-5 text-sm md:grid-cols-2">
            {!isTerrainListing &&
              !isHouseSaleListing &&
              !isLocationListing && (
              <p>
                <strong>État :</strong>{' '}
                {conditionDisplayLabel(product.condition)}
              </p>
            )}

            {isTerrainListing && (
              <>
                {product.terrainSetting && (
                  <p>
                    <strong>Terrain :</strong> {product.terrainSetting}
                  </p>
                )}
                <p>
                  <strong>Surface :</strong>{' '}
                  {product.terrainAreaMode === 'dimensions' &&
                  product.terrainLengthM &&
                  product.terrainWidthM
                    ? `${product.terrainLengthM} m × ${product.terrainWidthM} m`
                    : product.terrainAreaM2
                    ? `${product.terrainAreaM2} m²`
                    : 'Non précisée'}
                </p>
              </>
            )}

            {isHouseSaleListing && (
              <>
                {product.houseLengthM != null &&
                  product.houseWidthM != null && (
                    <p>
                      <strong>Dimensions au sol :</strong>{' '}
                      {product.houseLengthM} m (L) × {product.houseWidthM} m (l)
                    </p>
                  )}
                {product.houseRoomCount != null && (
                  <p>
                    <strong>Nombre de pièces :</strong>{' '}
                    {product.houseRoomCount}
                  </p>
                )}
                {product.houseLevels && (
                  <p>
                    <strong>Niveaux :</strong> {product.houseLevels}
                  </p>
                )}
                <p>
                  <strong>Surface maison :</strong> {product.houseAreaM2} m²
                </p>
              </>
            )}

            <p>
              <strong>Localisation :</strong>{' '}
              {product.location || 'Non précisé'}
            </p>

            {!isOwner && product.phone && product.phone.trim() !== '' && (
              <p>
                <strong>Téléphone :</strong>{' '}
                <a href={`tel:${product.phone}`} className="text-green-700">
                  {product.phone}
                </a>
              </p>
            )}
          </div>

          {/* MINI IMAGES */}
          {productImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto px-4 pb-2">
              {productImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => openGalleryAt(img)}
                  className={`rounded-xl border ${
                    selectedImage === img
                      ? 'border-green-700'
                      : 'border-gray-200'
                  }`}
                >
                  <img
                    src={img}
                    className="h-16 w-20 object-cover"
                    alt=""
                  />
                </button>
              ))}
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="border-t px-4 py-5 md:px-5">
            <h2 className="font-bold">Description :</h2>
            <p className="mt-2 text-sm">
              {product.description || 'Aucune description'}
            </p>
          </div>

          <TransactionFeedbackSection
            listing={product}
            onListingRefresh={reloadListing}
          />

          {/* ACTIONS */}
          <div className="space-y-3 px-4 pb-5">
            {isOwner ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-3">
                <Link
                  href={`/annonces/${product.id}/edit`}
                  className="block w-full rounded-2xl bg-gray-900 py-4 text-center font-bold text-white"
                >
                  ✏️ Modifier
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (!product || !currentUser || product.sellerId !== currentUser.id)
                      return;
                    const nextStatus = product.status === 'sold' ? 'available' : 'sold';
                    const updated = updateMarketplaceItem(product.id, {
                      status: nextStatus,
                    });
                    if (updated) setProduct(updated);
                  }}
                  className={`w-full rounded-2xl py-4 text-center font-bold text-white ${
                    product.status === 'sold' ? 'bg-amber-600' : 'bg-green-700'
                  }`}
                >
                  {product.status === 'sold'
                    ? '↩️ Remettre disponible'
                    : '✅ Marquer comme vendu'}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full rounded-2xl bg-red-600 py-4 text-center font-bold text-white"
                >
                  🗑️ Supprimer
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`grid grid-cols-1 gap-3 md:gap-3 ${
                    canCall || canWhatsApp ? 'md:grid-cols-2' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={openConversation}
                    className="w-full rounded-2xl bg-green-700 py-4 font-bold text-white"
                  >
                    💬 Contacter le vendeur
                  </button>

                  {canCall ? (
                    <a
                      href={`tel:${publicPhone}`}
                      className="block w-full rounded-2xl border border-green-700 py-4 text-center font-bold text-green-700"
                    >
                      📞 Appeler
                    </a>
                  ) : canWhatsApp ? (
                    <a
                      href={whatsappHref!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={whatsappButtonClass}
                    >
                      <WhatsAppGlyph className="h-5 w-5 text-[#25D366]" />
                      WhatsApp
                    </a>
                  ) : null}
                </div>

                {showWhatsAppBelow && (
                  <div className="flex justify-center">
                    <a
                      href={whatsappHref!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${whatsappButtonClass} max-w-sm px-4`}
                    >
                      <WhatsAppGlyph className="h-5 w-5 text-[#25D366]" />
                      WhatsApp
                    </a>
                  </div>
                )}
              </>
            )}
          </div>

          <BottomNav />
        </div>
      </ProductMobileShell>
      {isGalleryOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95"
          onClick={() => setIsGalleryOpen(false)}
          role="presentation"
        >
          <div
            className="pointer-events-auto absolute left-0 right-0 top-0 z-[110] flex justify-between gap-2 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top,0px))]"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            role="toolbar"
            aria-label="Actions galerie"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsGalleryOpen(false);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="min-h-[44px] min-w-[44px] rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void saveCurrentImage();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="min-h-[44px] min-w-[44px] rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
            >
              Enregistrer
            </button>
          </div>
          {productImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrevImage();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="pointer-events-auto absolute left-3 top-1/2 z-[105] -translate-y-1/2 rounded-full bg-white/20 px-3 py-2 text-2xl text-white backdrop-blur-sm"
                aria-label="Photo précédente"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNextImage();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="pointer-events-auto absolute right-3 top-1/2 z-[105] -translate-y-1/2 rounded-full bg-white/20 px-3 py-2 text-2xl text-white backdrop-blur-sm"
                aria-label="Photo suivante"
              >
                ›
              </button>
            </>
          )}
          <div
            className="flex h-full w-full items-center justify-center p-4 pt-20"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage || productImages[0]}
              alt={product.title}
              className="max-h-[85vh] max-w-[96vw] object-contain"
            />
          </div>
          {productImages.length > 1 && (
            <p className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-1/2 z-[105] -translate-x-1/2 rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {selectedImageIndex + 1} / {productImages.length}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

export default function AnnonceDetailPage() {
  return (
    <Suspense fallback={null}>
      <AnnonceDetailPageContent />
    </Suspense>
  );
}