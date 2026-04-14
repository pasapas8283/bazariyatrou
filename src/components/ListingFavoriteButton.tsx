'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  readFavorites,
  toggleFavoriteItem,
  type FavoriteItem,
} from '../lib/favorites-storage';

type ListingFavoriteButtonProps = {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  condition?: string;
  /** Positionnement (ex. `absolute bottom-3 right-3 z-10`) */
  className?: string;
};

/** Ignore les clics de souris synthétiques ~300 ms après un tap tactile. */
const IGNORE_CLICK_AFTER_TOUCH_MS = 500;

export default function ListingFavoriteButton({
  id,
  title,
  price,
  image,
  category,
  condition,
  className = '',
}: ListingFavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const lastTouchToggleAt = useRef(0);

  useEffect(() => {
    const favorites = readFavorites();
    setIsFavorite(
      favorites.some((item) => item.id === id || item.title === title)
    );
  }, [id, title]);

  const performToggle = useCallback(() => {
    const payload: FavoriteItem = {
      id,
      title,
      price,
      image,
      category,
      condition,
    };
    const nowFavorite = toggleFavoriteItem(payload);
    setIsFavorite(nowFavorite);

    void fetch(`/api/listings/${encodeURIComponent(id)}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: nowFavorite ? 'add' : 'remove' }),
    }).catch(() => {
      /* favori local conservé */
    });
  }, [id, title, price, image, category, condition]);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    e.preventDefault();
    e.stopPropagation();
    lastTouchToggleAt.current = Date.now();
    performToggle();
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (Date.now() - lastTouchToggleAt.current < IGNORE_CLICK_AFTER_TOUCH_MS) {
      return;
    }
    performToggle();
  };

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 shadow-md backdrop-blur-sm [touch-action:manipulation] ${className}`}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <span
        className={`text-lg leading-none ${
          isFavorite ? 'text-red-500' : 'text-gray-400'
        }`}
      >
        {isFavorite ? '♥' : '♡'}
      </span>
    </button>
  );
}
