'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import {
  readMarketplaceItems,
  writeMarketplaceItems,
} from '../../../../lib/marketplace-storage';
import {
  HOUSE_SALE_LEVEL_OPTIONS,
  type HouseSaleLevel,
  type MarketplaceItem,
  type PriceCurrency,
} from '../../../../types/marketplace';
import {
  getPublishCategoryOptions,
  getCategoryFromPublishLabel,
  getCategoryLabel,
} from '../../../../lib/marketplace-categories';
import {
  getPublishConditionOptions,
  getConditionFromPublishLabel,
  getConditionLabel,
} from '../../../../lib/marketplace-conditions';
import { normalizeItem, normalizePrice } from '../../../../lib/marketplace-normalizers';
import { getCurrentUser } from '../../../../lib/auth-storage';
import { readPlatformSettings } from '../../../../lib/platform-settings-storage';
import {
  getSubCategoryOptions,
  MODE_SUBSUBCATEGORIES,
  supportsSecondLevelSubcategories,
  supportsSubcategories,
} from '../../../../lib/marketplace-subcategories';
import {
  CITIES_BY_ISLAND,
  getSortedCitiesByIsland,
  ISLAND_OPTIONS,
} from '../../../../lib/comoros-locations';

function splitLocation(location: string) {
  const [city = 'Ville', island = 'Île'] = location.split(',').map((v) => v.trim());

  const knownIsland = Object.keys(CITIES_BY_ISLAND).includes(island)
    ? island
    : 'Île';
  const knownCity =
    knownIsland !== 'Île' && CITIES_BY_ISLAND[knownIsland].includes(city)
      ? city
      : knownIsland !== 'Île' && city && city !== 'Ville'
      ? 'Autre'
      : 'Ville';

  return {
    city: knownCity,
    island: knownIsland,
    customCity: knownCity === 'Autre' ? city : '',
  };
}

export default function ModifierAnnoncePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<MarketplaceItem | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceCurrency, setPriceCurrency] = useState<PriceCurrency>('KMF');
  const [category, setCategory] = useState('Catégories');
  const [condition, setCondition] = useState('État');
  const [subCategory, setSubCategory] = useState('');
  const [subSubCategory, setSubSubCategory] = useState('');
  const [island, setIsland] = useState('Île');
  const [city, setCity] = useState('Ville');
  const [customCity, setCustomCity] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [images, setImages] = useState(['']);
  const [houseAreaM2, setHouseAreaM2] = useState('');
  const [houseLengthM, setHouseLengthM] = useState('');
  const [houseWidthM, setHouseWidthM] = useState('');
  const [houseRoomCount, setHouseRoomCount] = useState('');
  const [houseLevels, setHouseLevels] = useState<HouseSaleLevel | ''>('');
  const [submitted, setSubmitted] = useState(false);
  const formatPriceForInput = (digits: string) =>
    digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  useEffect(() => {
    const items = readMarketplaceItems();
    const found = items.find((entry) => entry.id === id) ?? null;

    if (!found) return;

    const currentUser = getCurrentUser();
    if (!currentUser || found.sellerId !== currentUser.id) {
      alert("Vous n'avez pas l'autorisation de modifier cette annonce.");
      router.push('/mes-annonces');
      return;
    }

    const { city, island, customCity } = splitLocation(found.location);

    setItem(found);
    setTitle(found.title);
    setDescription(found.description ?? '');
    setPrice(String(found.price));
    const isTerrainImmobilier =
      found.category === 'immobilier' &&
      (found.terrainSetting ||
        found.terrainAreaMode ||
        found.terrainAreaM2 != null ||
        found.terrainLengthM != null ||
        found.terrainWidthM != null);
    const isHouseImmobilier =
      found.category === 'immobilier' &&
      !isTerrainImmobilier &&
      (found.houseAreaM2 != null ||
        found.houseLengthM != null ||
        found.houseRoomCount != null ||
        found.houseLevels);
    setCategory(
      found.publishCategoryLabel?.trim() ||
        (isHouseImmobilier ? 'Vente maison' : '') ||
        (isTerrainImmobilier ? 'Terrain' : '') ||
        getCategoryLabel(found.category)
    );
    setCondition(getConditionLabel(found.condition));
    setSubCategory(found.subCategory ?? '');
    setSubSubCategory(found.subSubCategory ?? '');
    setIsland(island);
    setCity(city);
    setCustomCity(customCity);
    const pub = (found.phone ?? '').trim();
    const cp = (found.contactPhone ?? '').trim();
    setPhone(found.phone ?? '');
    setWhatsappPhone(cp && cp !== pub ? cp : '');
    setImages(found.images?.length > 0 ? found.images : ['']);
    setHouseAreaM2(found.houseAreaM2 ? String(found.houseAreaM2) : '');
    setHouseLengthM(
      found.houseLengthM != null ? String(found.houseLengthM) : ''
    );
    setHouseWidthM(found.houseWidthM != null ? String(found.houseWidthM) : '');
    setHouseRoomCount(
      found.houseRoomCount != null ? String(found.houseRoomCount) : ''
    );
    setHouseLevels(found.houseLevels ?? '');
  }, [id, router]);

  const updateImage = (index: number, value: string) => {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  };

  const applyImageFile = (index: number, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateImage(index, reader.result as string);
    reader.readAsDataURL(file);
  };

  const addImageField = () => {
    setImages([...images, '']);
  };

  const removeImageField = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated.length ? updated : ['']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!item) return;

    const hasTitleError = !title.trim();
    const hasPriceError = !price.trim();
    const hasCategoryError = category === 'Catégories';
    const categoryValue = getCategoryFromPublishLabel(category);
    const hasSubCategoryError =
      supportsSubcategories(categoryValue) && !subCategory;
    const hasSubSubCategoryError =
      supportsSecondLevelSubcategories(categoryValue) && !subSubCategory;
    const isHouseSaleCategory = category.trim().toLowerCase() === 'vente maison';
    const isLocationCategory = categoryValue === 'location';
    const isEmploiCategory = categoryValue === 'emploi';
    const isTerrainCategory = category.trim().toLowerCase() === 'terrain';
    const hasConditionError =
      !isLocationCategory &&
      !isHouseSaleCategory &&
      !isTerrainCategory &&
      !isEmploiCategory &&
      condition === 'État';
    const hasIslandError = island === 'Île';
    const hasCityError = city === 'Ville';
    const hasCustomCityError = city === 'Autre' && !customCity.trim();
    const hasHouseAreaM2Error = isHouseSaleCategory && Number(houseAreaM2) <= 0;
    const hasHouseLengthError =
      isHouseSaleCategory && Number(houseLengthM) <= 0;
    const hasHouseWidthError = isHouseSaleCategory && Number(houseWidthM) <= 0;
    const hasHouseRoomCountError =
      isHouseSaleCategory &&
      (!Number.isFinite(Number(houseRoomCount)) ||
        Number(houseRoomCount) < 1);
    const hasHouseLevelsError =
      isHouseSaleCategory && !String(houseLevels).trim();

    if (
      hasTitleError ||
      hasPriceError ||
      hasCategoryError ||
      hasSubCategoryError ||
      hasSubSubCategoryError ||
      hasConditionError ||
      hasIslandError ||
      hasCityError ||
      hasCustomCityError ||
      hasHouseAreaM2Error ||
      hasHouseLengthError ||
      hasHouseWidthError ||
      hasHouseRoomCountError ||
      hasHouseLevelsError
    ) {
      return;
    }

    const currentUser = getCurrentUser();
    const hasContactHint =
      phone.trim() ||
      whatsappPhone.trim() ||
      (currentUser?.phone && currentUser.phone.trim());
    if (!hasContactHint) {
      const proceed = window.confirm(
        'Vous n’avez pas indiqué de numéro (téléphone ou WhatsApp). C’est fortement recommandé. Vous pouvez quand même enregistrer. Continuer ?'
      );
      if (!proceed) return;
    }

    const cleanedImages = images
      .map((img) => img.trim())
      .filter((img) => img !== '');

    const cityValue = city === 'Autre' ? customCity.trim() : city;

    const publicNumber = phone.trim();
    const whatsappContact = (
      whatsappPhone.trim() ||
      phone.trim() ||
      currentUser?.phone ||
      ''
    ).trim();
    const settings = readPlatformSettings();

    const updates = {
      title: title.trim(),
      description: description.trim(),
      price: normalizePrice(price),
      priceCurrency,
      category: categoryValue,
      publishCategoryLabel:
        category !== 'Catégories' ? category.trim() : undefined,
      condition:
        isHouseSaleCategory ||
        category.trim().toLowerCase() === 'terrain' ||
        isEmploiCategory
          ? 'good'
          : getConditionFromPublishLabel(condition),
      location: `${cityValue}, ${island}`,
      images:
        cleanedImages.length > 0
          ? cleanedImages
          : ['https://placehold.co/600x400?text=Annonce'],
      phone:
        settings.showPhoneOnListings && publicNumber
          ? publicNumber
          : undefined,
      contactPhone: whatsappContact || undefined,
      subCategory: supportsSubcategories(categoryValue) ? subCategory : undefined,
      subSubCategory: supportsSecondLevelSubcategories(categoryValue)
        ? subSubCategory
        : undefined,
      houseAreaM2: isHouseSaleCategory ? Number(houseAreaM2) : undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(`/api/listings/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.id ? { 'x-bzy-user-id': currentUser.id } : {}),
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('patch failed');
      const data = await response.json();
      const updated = normalizeItem(data?.item ?? { ...item, ...updates });
      const updatedItems = readMarketplaceItems().map((entry) =>
        entry.id === item.id ? updated : entry
      );
      writeMarketplaceItems(updatedItems);
    } catch {
      alert('Impossible de modifier pour le moment. Réessaie.');
      return;
    }

    alert('Annonce modifiée avec succès.');
    router.push('/mes-annonces');
  };

  const fieldClass =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-100';

  const errorClass =
    'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100';

  const houseSaleMeasuresInvalid =
    submitted &&
    category.trim().toLowerCase() === 'vente maison' &&
    (Number(houseLengthM) <= 0 ||
      Number(houseWidthM) <= 0 ||
      !Number.isFinite(Number(houseRoomCount)) ||
      Number(houseRoomCount) < 1 ||
      !String(houseLevels).trim());

  const houseSaleCellInner =
    'w-full min-w-0 border-0 bg-transparent px-1.5 py-2.5 text-[11px] text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 sm:px-2 sm:text-sm';

  if (!item) {
    return (
      <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
        <MobileShell>
          <div className="min-h-full bg-white p-5">
            <p className="text-base font-medium text-gray-600">
              Annonce introuvable.
            </p>
          </div>
        </MobileShell>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <Link href="/mes-annonces" className="text-2xl font-bold text-gray-900">
              ‹
            </Link>

            <h1 className="text-lg font-extrabold text-gray-900">
              Modifier l’annonce
            </h1>

            <div className="w-6" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-5 pt-4">
            <div>
              <input
                type="text"
                placeholder="Titre de l’annonce"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${fieldClass} ${
                  submitted && !title.trim() ? errorClass : ''
                }`}
              />
            </div>

            <div>
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${fieldClass} min-h-[96px] resize-none`}
              />
            </div>

            {category.trim().toLowerCase() === 'vente maison' && (
              <div
                className={`grid w-full grid-cols-4 divide-x divide-gray-200 overflow-hidden rounded-2xl border ${
                  houseSaleMeasuresInvalid
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-gray-50 focus-within:border-green-700 focus-within:bg-white'
                }`}
              >
                <div className="relative min-w-0">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="m"
                    value={houseLengthM}
                    onChange={(e) => setHouseLengthM(e.target.value)}
                    className={`${houseSaleCellInner} pr-7 sm:pr-8`}
                    aria-label="Longueur maison en mètres"
                  />
                  <span
                    className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 sm:right-2 sm:text-sm"
                    aria-hidden
                  >
                    L
                  </span>
                </div>
                <div className="relative min-w-0">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="m"
                    value={houseWidthM}
                    onChange={(e) => setHouseWidthM(e.target.value)}
                    className={`${houseSaleCellInner} pr-7 sm:pr-8`}
                    aria-label="Largeur maison en mètres"
                  />
                  <span
                    className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 sm:right-2 sm:text-sm"
                    aria-hidden
                  >
                    l
                  </span>
                </div>
                <div className="flex min-w-0 items-center">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Pièces"
                    value={houseRoomCount}
                    onChange={(e) => setHouseRoomCount(e.target.value)}
                    className={houseSaleCellInner}
                    aria-label="Nombre de pièces"
                  />
                </div>
                <div className="flex min-w-0 items-center">
                  <select
                    value={houseLevels}
                    onChange={(e) =>
                      setHouseLevels(e.target.value as HouseSaleLevel | '')
                    }
                    className={`${houseSaleCellInner} cursor-pointer`}
                    aria-label="Niveaux de la maison"
                  >
                    <option value="">Niveau</option>
                    {HOUSE_SALE_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Prix
              </label>
              <div
                className={`flex items-stretch gap-2 rounded-2xl border p-1.5 focus-within:ring-2 focus-within:ring-green-100 ${
                  submitted && !price.trim()
                    ? 'border-red-500 bg-red-50 focus-within:border-red-500 focus-within:ring-red-100'
                    : 'border-gray-200 bg-gray-50 focus-within:border-green-700 focus-within:bg-white'
                }`}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Montant"
                  value={formatPriceForInput(price)}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^\d]/g, ''))
                  }
                  className="min-w-0 flex-1 rounded-xl border-0 bg-transparent px-3 py-3 text-base font-medium tabular-nums text-gray-900 outline-none placeholder:text-gray-400"
                />
                <select
                  value={priceCurrency}
                  onChange={(e) =>
                    setPriceCurrency(e.target.value as PriceCurrency)
                  }
                  className="w-20 shrink-0 self-stretch rounded-xl border border-gray-200 bg-white px-1 py-2 text-center text-sm font-semibold text-gray-800 outline-none focus:border-green-700 sm:w-24"
                  aria-label="Devise du prix"
                >
                  <option value="KMF">KMF</option>
                  <option value="EUR">EUR €</option>
                </select>
              </div>
              <p className="mt-1.5 text-xs text-gray-600">
                Francs comoriens (KMF) ou euros, selon votre annonce.
              </p>
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubCategory('');
                  setSubSubCategory('');
                  setHouseLengthM('');
                  setHouseWidthM('');
                  setHouseRoomCount('');
                  setHouseLevels('');
                  setHouseAreaM2('');
                }}
                className={`${fieldClass} ${
                  submitted && category === 'Catégories' ? errorClass : ''
                }`}
              >
                <option>Catégories</option>
                {getPublishCategoryOptions().map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            {supportsSubcategories(getCategoryFromPublishLabel(category)) && (
              <>
                <div>
                  <select
                    value={subCategory}
                    onChange={(e) => {
                      setSubCategory(e.target.value);
                      setSubSubCategory('');
                    }}
                    className={`${fieldClass} ${
                      submitted && !subCategory ? errorClass : ''
                    }`}
                  >
                    <option value="">Sous-catégorie</option>
                    {getSubCategoryOptions(getCategoryFromPublishLabel(category)).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {supportsSecondLevelSubcategories(
                  getCategoryFromPublishLabel(category)
                ) && (
                  <div>
                    <select
                      value={subSubCategory}
                      onChange={(e) => setSubSubCategory(e.target.value)}
                      className={`${fieldClass} ${
                        submitted && !subSubCategory ? errorClass : ''
                      }`}
                    >
                      <option value="">Vêtements : Adulte / Enfant</option>
                      {MODE_SUBSUBCATEGORIES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {getCategoryFromPublishLabel(category) !== 'location' &&
              getCategoryFromPublishLabel(category) !== 'emploi' &&
              category.trim().toLowerCase() !== 'vente maison' &&
              category.trim().toLowerCase() !== 'terrain' && (
              <div>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={`${fieldClass} ${
                    submitted && condition === 'État' ? errorClass : ''
                  }`}
                >
                  <option>État</option>
                  {getPublishConditionOptions().map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}

            {category.trim().toLowerCase() === 'vente maison' && (
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Surface maison (m²)"
                  value={houseAreaM2}
                  onChange={(e) => setHouseAreaM2(e.target.value)}
                  className={`${fieldClass} ${
                    submitted && Number(houseAreaM2) <= 0 ? errorClass : ''
                  }`}
                />
              </div>
            )}

            <div>
              <select
                value={island}
                onChange={(e) => {
                  setIsland(e.target.value);
                  setCity('Ville');
                  setCustomCity('');
                }}
                className={`${fieldClass} ${
                  submitted && island === 'Île' ? errorClass : ''
                }`}
              >
                <option>Île</option>
                {ISLAND_OPTIONS.map((islandOption) => (
                  <option key={islandOption}>{islandOption}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={island === 'Île'}
                className={`${fieldClass} ${
                  island === 'Île' ? 'cursor-not-allowed bg-gray-100' : ''
                } ${submitted && city === 'Ville' ? errorClass : ''}`}
              >
                <option>Ville</option>
                {island !== 'Île' &&
                  getSortedCitiesByIsland(island).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                {island !== 'Île' && <option>Autre</option>}
              </select>
            </div>

            {city === 'Autre' && (
              <div>
                <input
                  type="text"
                  placeholder="Saisir la ville"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className={`${fieldClass} ${
                    submitted && !customCity.trim() ? errorClass : ''
                  }`}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Téléphone
              </label>
              <input
                type="tel"
                placeholder="Ex. 321 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
                autoComplete="tel"
              />
              <p className="mt-1.5 text-xs text-gray-600">
                Affiché sur l’annonce si vos paramètres le permettent (appel
                direct).
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Numéro WhatsApp
              </label>
              <input
                type="tel"
                placeholder="Ex. 269 321 00 00 (avec indicatif pays)"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className={fieldClass}
                autoComplete="tel"
              />
              <p className="mt-1.5 text-xs text-gray-600">
                Utilisé pour le bouton WhatsApp. Laisser vide pour réutiliser le
                numéro « Téléphone » ou celui de votre profil.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="mx-auto grid w-full max-w-xs grid-cols-[1fr_2.5rem] gap-x-3 gap-y-3">
                {images.map((img, index) =>
                  img ? (
                    <div
                      key={index}
                      className="col-span-2 flex items-center justify-center gap-3"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        aria-label="Supprimer la photo"
                        title="Supprimer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                          aria-hidden
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <Fragment key={index}>
                      <input
                        type="file"
                        id={`modifier-gallery-${index}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          applyImageFile(index, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                      <input
                        type="file"
                        id={`modifier-camera-${index}`}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          applyImageFile(index, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                      <label
                        htmlFor={`modifier-gallery-${index}`}
                        className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-2 text-center text-sm font-semibold text-gray-800"
                      >
                        Choisir une photo
                      </label>
                      <label
                        htmlFor={`modifier-camera-${index}`}
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-lg leading-none"
                        aria-label="Prendre une photo"
                        title="Prendre une photo"
                      >
                        📷
                      </label>
                    </Fragment>
                  )
                )}
                <button
                  type="button"
                  onClick={addImageField}
                  className="col-span-2 flex h-10 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm font-semibold text-gray-700"
                >
                  Ajouter une photo
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-green-700 py-4 text-base font-bold text-white hover:bg-green-800"
            >
              Enregistrer les modifications
            </button>
          </form>
        </div>
      </MobileShell>
    </main>
  );
}