'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSortedCitiesByIsland,
  ISLAND_OPTIONS,
} from '@/lib/comoros-locations';
import type { ImageSearchCandidate } from '@/lib/image-search-client';
import { findSimilarListingIds } from '@/lib/image-search-client';

type SearchBarProps = {
  query: string;
  setQuery: (value: string) => void;
  island: string;
  setIsland: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  imageSearchCandidates: ImageSearchCandidate[];
  imageSearchMatchIds: string[] | null;
  setImageSearchMatchIds: (ids: string[] | null) => void;
};

const selectClass =
  'rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-xs font-medium text-gray-800 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-200 sm:min-w-[7.5rem] sm:px-3 sm:text-sm';

export default function SearchBar({
  query,
  setQuery,
  island,
  setIsland,
  city,
  setCity,
  imageSearchCandidates,
  imageSearchMatchIds,
  setImageSearchMatchIds,
}: SearchBarProps) {
  const cities = island ? getSortedCitiesByIsland(island) : [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const showImageSearchRow =
    imageSearchMatchIds !== null || previewUrl !== null || imageBusy;

  const clearImageSearch = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setImageSearchMatchIds(null);
    setMenuOpen(false);
  }, [setImageSearchMatchIds]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const runImageSearch = useCallback(
    async (file: File | undefined) => {
      if (!file || !file.type.startsWith('image/')) return;
      setImageBusy(true);
      setMenuOpen(false);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      const nextPreview = URL.createObjectURL(file);
      previewUrlRef.current = nextPreview;
      setPreviewUrl(nextPreview);
      try {
        const ids = await findSimilarListingIds(file, imageSearchCandidates);
        setImageSearchMatchIds(ids.length > 0 ? ids : []);
      } catch {
        setImageSearchMatchIds([]);
      } finally {
        setImageBusy(false);
      }
    },
    [imageSearchCandidates, setImageSearchMatchIds]
  );

  const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void runImageSearch(e.target.files?.[0]);
    e.target.value = '';
  };

  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void runImageSearch(e.target.files?.[0]);
    e.target.value = '';
  };

  return (
    <div className="px-4 pt-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
        <div className="relative flex min-h-[46px] min-w-0 flex-1 items-center rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm sm:px-4 sm:py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (annonce, lieu, vendeur…)"
            className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden
            onChange={onGalleryChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            aria-hidden
            onChange={onCameraChange}
          />

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              disabled={imageBusy}
              onClick={() => setMenuOpen((o) => !o)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 outline-none transition hover:bg-gray-200/80 hover:text-gray-800 focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50"
              aria-label="Recherche par image"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {imageBusy ? (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"
                  aria-hidden
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-1 min-w-[13rem] rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50"
                  onClick={() => {
                    galleryInputRef.current?.click();
                  }}
                >
                  <span className="text-base" aria-hidden>
                    🖼️
                  </span>
                  Choisir une photo (galerie)
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50"
                  onClick={() => {
                    cameraInputRef.current?.click();
                  }}
                >
                  <span className="text-base" aria-hidden>
                    📷
                  </span>
                  Prendre une photo
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 sm:items-stretch">
          <select
            value={island}
            onChange={(e) => {
              setIsland(e.target.value);
              setCity('');
            }}
            className={`${selectClass} flex-1 sm:flex-none sm:min-w-[9.5rem]`}
            aria-label="Filtrer par île"
          >
            <option value="">Île</option>
            {ISLAND_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!island}
            title={!island ? 'Choisissez d’abord une île' : undefined}
            className={`${selectClass} flex-1 sm:flex-none sm:min-w-[9.5rem] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
            aria-label="Filtrer par ville"
          >
            <option value="">Ville</option>
            {cities.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showImageSearchRow && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-green-200 bg-green-50/80 px-3 py-2 text-xs text-gray-800 sm:text-sm">
          {previewUrl && (
            <img
              src={previewUrl}
              alt=""
              className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
            />
          )}
          <span className="min-w-0 flex-1 font-medium">
            {imageBusy
              ? 'Analyse de l’image…'
              : imageSearchMatchIds?.length === 0
                ? 'Recherche par image — aucune annonce assez proche.'
                : imageSearchMatchIds && imageSearchMatchIds.length > 0
                  ? `Recherche par image — ${imageSearchMatchIds.length} résultat(s) proche(s).`
                  : 'Recherche par image'}
          </span>
          <button
            type="button"
            onClick={clearImageSearch}
            disabled={imageBusy}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Effacer
          </button>
        </div>
      )}
    </div>
  );
}
