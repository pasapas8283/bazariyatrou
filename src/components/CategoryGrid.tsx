import { useMemo } from 'react';
import { HOME_CATEGORIES } from '../lib/marketplace-categories';

type CategoryGridProps = {
  category: string;
  setCategory: (value: string) => void;
};

export default function CategoryGrid({
  category,
  setCategory,
}: CategoryGridProps) {
  const orderedCategories = useMemo(() => HOME_CATEGORIES, []);

  return (
    <div className="px-4 py-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {orderedCategories.map((item) => {
          const active = category === item.label;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setCategory(item.label)}
              className={`whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {item.icon} {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}