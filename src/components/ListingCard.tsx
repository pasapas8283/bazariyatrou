'use client';

import { useRouter } from 'next/navigation';
import ListingFavoriteButton from './ListingFavoriteButton';
import { getConditionBadgeClass } from '../lib/marketplace-conditions';
import { getCategoryLabel } from '../lib/marketplace-categories';

type ListingCardProps = {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  badgeLabel?: string;
  condition?: string;
  isFeatured?: boolean;
  sellerType?: 'standard' | 'pro';
};

export default function ListingCard({
  id,
  title,
  price,
  image,
  category,
  badgeLabel,
  condition,
  isFeatured,
  sellerType,
}: ListingCardProps) {
  const router = useRouter();
  const hideCondition = category === getCategoryLabel('location');
  const go = () => {
    void router.push(`/annonces/detail?id=${encodeURIComponent(id)}`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
      className="cursor-pointer"
    >
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="relative">
          <img
            src={image || 'https://placehold.co/600x400?text=Annonce'}
            alt={title}
            className="h-32 w-full object-cover"
          />

          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-gray-800 shadow-sm">
              {badgeLabel ?? category}
            </span>
            {isFeatured && (
              <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold text-yellow-800 shadow-sm">
                Boostée
              </span>
            )}
            {sellerType === 'pro' && (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-800 shadow-sm">
                Pro
              </span>
            )}
          </div>

          <ListingFavoriteButton
            id={id}
            title={title}
            price={price}
            image={image || 'https://placehold.co/600x400?text=Annonce'}
            category={category}
            condition={condition}
            className="absolute right-2 top-2 z-10 h-9 w-9 border-0 shadow-sm"
          />
        </div>

        <div className="p-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
            {title}
          </h3>

          <p className="mt-1 text-lg font-black text-green-900">{price}</p>

          {condition && !hideCondition && (
            <div className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getConditionBadgeClass(
                  condition
                )}`}
              >
                {condition}
              </span>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
