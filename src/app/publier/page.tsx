'use client';

import { useAuth } from '../../hooks/use-auth';
import Link from 'next/link';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import DesktopTopNav from '@/components/DesktopTopNav';
import SiteBrandLogo from '@/components/SiteBrandLogo';
import {
  HOUSE_SALE_LEVEL_OPTIONS,
  type HouseSaleLevel,
  type LocationRentalPeriod,
  type MarketplaceItem,
  type PriceCurrency,
  type TerrainPriceBasis,
} from '../../types/marketplace';
import {
  normalizeCategory,
  normalizeCondition,
  normalizePrice,
} from '../../lib/marketplace-normalizers';
import {
  getPublishCategoryOptions,
} from '../../lib/marketplace-categories';
import { getPublishConditionOptions } from '../../lib/marketplace-conditions';
import {
  getLocationRentalPeriodOptionsForSub,
  getSubCategoryOptions,
  MODE_SUBSUBCATEGORIES,
  supportsSecondLevelSubcategories,
  supportsSubcategories,
} from '../../lib/marketplace-subcategories';
import {
  getSortedCitiesByIsland,
  ISLAND_OPTIONS,
} from '../../lib/comoros-locations';
import { normalizeItem } from '../../lib/marketplace-normalizers';
import {
  readMarketplaceItems,
  writeMarketplaceItems,
} from '../../lib/marketplace-storage';
import { readPlatformSettings } from '../../lib/platform-settings-storage';

function PublishFormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function PublierPage() {
  /**
   * Ajuste facilement la hauteur de sécurité sous le bouton "Publier"
   * pour les barres de navigation Android / zones gestuelles iOS.
   */
  const MOBILE_SUBMIT_EXTRA_CLEARANCE = '4.5rem';

  const router = useRouter();
  const { currentUser } = useAuth();

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
  const [terrainSetting, setTerrainSetting] = useState('');
  const [terrainAreaMode, setTerrainAreaMode] = useState<'dimensions' | 'm2'>(
    'dimensions'
  );
  const [terrainLengthM, setTerrainLengthM] = useState('');
  const [terrainWidthM, setTerrainWidthM] = useState('');
  const [terrainAreaM2, setTerrainAreaM2] = useState('');
  const [terrainPriceBasis, setTerrainPriceBasis] =
    useState<TerrainPriceBasis>('total');
  const [locationRentalPeriod, setLocationRentalPeriod] = useState<LocationRentalPeriod>('month');
  const [houseAreaM2, setHouseAreaM2] = useState('');
  const [houseLengthM, setHouseLengthM] = useState('');
  const [houseWidthM, setHouseWidthM] = useState('');
  const [houseRoomCount, setHouseRoomCount] = useState('');
  const [houseLevels, setHouseLevels] = useState<HouseSaleLevel | ''>('');
  const [submitted, setSubmitted] = useState(false);

  const formatPriceForInput = (digits: string) =>
    digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  useEffect(() => {
    const settings = readPlatformSettings();
    if (settings.defaultIsland && settings.defaultIsland !== 'Île') {
      setIsland(settings.defaultIsland);
    }
    if (settings.autoFillPhoneInPublish && currentUser?.phone) {
      setPhone(currentUser.phone);
      setWhatsappPhone(currentUser.phone);
    }
  }, [currentUser]);

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

    if (!currentUser) {
      alert('Tu dois être connecté pour publier');
      router.push('/connexion');
      return;
    }

    const hasTitleError = !title.trim();
    const hasPriceError = !price.trim();
    const hasCategoryError = category === 'Catégories';
    const categoryValue = normalizeCategory(category);
    const isServicesCategory = categoryValue === 'services';
    const isEmploiCategory = categoryValue === 'emploi';
    const isLocationCategory = categoryValue === 'location';
    const hasSubCategoryError =
      supportsSubcategories(categoryValue) && !subCategory;
    const hasSubSubCategoryError =
      supportsSecondLevelSubcategories(categoryValue) && !subSubCategory;
    const isTerrainCategory = category.trim().toLowerCase() === 'terrain';
    const isHouseSaleCategory = category.trim().toLowerCase() === 'vente maison';
    const hasConditionError =
      !isTerrainCategory &&
      !isHouseSaleCategory &&
      !isServicesCategory &&
      !isEmploiCategory &&
      !isLocationCategory &&
      condition === 'État';
    const hasIslandError = island === 'Île';
    const hasCityError = city === 'Ville';
    const hasCustomCityError = city === 'Autre' && !customCity.trim();
    const hasTerrainSettingError = isTerrainCategory && !terrainSetting;
    const hasTerrainLengthError =
      isTerrainCategory &&
      terrainAreaMode === 'dimensions' &&
      Number(terrainLengthM) <= 0;
    const hasTerrainWidthError =
      isTerrainCategory &&
      terrainAreaMode === 'dimensions' &&
      Number(terrainWidthM) <= 0;
    const hasTerrainAreaM2Error =
      isTerrainCategory && terrainAreaMode === 'm2' && Number(terrainAreaM2) <= 0;
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
      hasTerrainSettingError ||
      hasTerrainLengthError ||
      hasTerrainWidthError ||
      hasTerrainAreaM2Error ||
      hasHouseAreaM2Error ||
      hasHouseLengthError ||
      hasHouseWidthError ||
      hasHouseRoomCountError ||
      hasHouseLevelsError
    ) {
      return;
    }

    const hasContactHint =
      phone.trim() ||
      whatsappPhone.trim() ||
      (currentUser.phone && currentUser.phone.trim());
    if (!hasContactHint) {
      const proceed = window.confirm(
        'Vous n’avez pas indiqué de numéro (téléphone ou WhatsApp). C’est fortement recommandé : les acheteurs pourront vous joindre plus facilement. Vous pouvez quand même publier. Continuer ?'
      );
      if (!proceed) return;
    }

    const cleanedImages = images
      .map((img) => img.trim())
      .filter((img) => img !== '');

    const cityValue = city === 'Autre' ? customCity.trim() : city;

    const settings = readPlatformSettings();
    const publicNumber = phone.trim();
    const whatsappContact = (
      whatsappPhone.trim() ||
      phone.trim() ||
      currentUser.phone ||
      ''
    ).trim();

    const resolvedContact = whatsappContact || publicNumber || undefined;

    const newItem: MarketplaceItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      price: normalizePrice(price),
      priceCurrency,
      category: categoryValue,
      publishCategoryLabel:
        category !== 'Catégories' ? category.trim() : undefined,
      condition:
        isTerrainCategory ||
        isHouseSaleCategory ||
        isServicesCategory ||
        isEmploiCategory
          ? 'good'
          : normalizeCondition(condition),
      location: `${cityValue}, ${island}`,
      images:
        cleanedImages.length > 0
          ? cleanedImages
          : ['https://placehold.co/600x400?text=Annonce'],
      sellerId: currentUser.id,
      sellerName: currentUser.firstName,
      createdAt: new Date().toISOString(),
      status: 'available',
      phone:
        settings.showPhoneOnListings
          ? publicNumber || resolvedContact
          : undefined,
      contactPhone: resolvedContact,
      subCategory: supportsSubcategories(categoryValue)
        ? subCategory
        : undefined,
      subSubCategory: supportsSecondLevelSubcategories(categoryValue)
        ? subSubCategory
        : undefined,
      terrainSetting: isTerrainCategory
        ? (terrainSetting as MarketplaceItem['terrainSetting'])
        : undefined,
      terrainAreaMode: isTerrainCategory ? terrainAreaMode : undefined,
      terrainLengthM:
        isTerrainCategory && terrainAreaMode === 'dimensions'
          ? Number(terrainLengthM)
          : undefined,
      terrainWidthM:
        isTerrainCategory && terrainAreaMode === 'dimensions'
          ? Number(terrainWidthM)
          : undefined,
      terrainAreaM2:
        isTerrainCategory && terrainAreaMode === 'm2'
          ? Number(terrainAreaM2)
          : undefined,
      terrainPriceBasis: isTerrainCategory ? terrainPriceBasis : undefined,
      locationRentalPeriod:
        isLocationCategory &&
        getLocationRentalPeriodOptionsForSub(subCategory)
          ? locationRentalPeriod
          : undefined,
      houseLengthM: isHouseSaleCategory ? Number(houseLengthM) : undefined,
      houseWidthM: isHouseSaleCategory ? Number(houseWidthM) : undefined,
      houseRoomCount: isHouseSaleCategory
        ? Math.round(Number(houseRoomCount))
        : undefined,
      houseLevels:
        isHouseSaleCategory && houseLevels
          ? (houseLevels as HouseSaleLevel)
          : undefined,
      houseAreaM2: isHouseSaleCategory ? Number(houseAreaM2) : undefined,
    };

    let created: MarketplaceItem | null = null;
    let publishedLocally = false;
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) throw new Error('create failed');
      const data = await response.json();
      created = normalizeItem(data?.item ?? newItem);
    } catch {
      // APK statique / hors backend: on garde un fallback local pour publier quand même.
      created = normalizeItem(newItem);
      publishedLocally = true;
    }

    if (!created) {
      alert('Impossible de publier pour le moment. Réessaie.');
      return;
    }

    const existing = readMarketplaceItems();
    const withoutDup = existing.filter((i) => i.id !== created.id);
    writeMarketplaceItems([created, ...withoutDup]);

    alert(
      publishedLocally
        ? 'Annonce publiée localement (serveur indisponible).'
        : 'Annonce publiée avec succès !'
    );

    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('Catégories');
    setSubCategory('');
    setSubSubCategory('');
    setCondition('État');
    setIsland('Île');
    setCity('Ville');
    setCustomCity('');
    setPhone('');
    setImages(['']);
    setTerrainSetting('');
    setTerrainAreaMode('dimensions');
    setTerrainLengthM('');
    setTerrainWidthM('');
    setTerrainAreaM2('');
    setTerrainPriceBasis('total');
    setLocationRentalPeriod('month');
    setHouseLengthM('');
    setHouseWidthM('');
    setHouseRoomCount('');
    setHouseLevels('');
    setHouseAreaM2('');
    setSubmitted(false);

    router.push('/');
  };

  const fieldClass =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-100';

  const errorClass =
    'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100';

  const locationPricePeriodOptions =
    normalizeCategory(category) === 'location'
      ? getLocationRentalPeriodOptionsForSub(subCategory)
      : null;

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

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <div className="mx-auto mb-0 w-full max-w-5xl md:mb-4">
        <DesktopTopNav />
      </div>
      <MobileShell>
        <div className="min-h-full bg-white">
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

          <div className="px-4 pt-5">
            <h1 className="text-[22px] font-extrabold">
              Publier une annonce
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-8 px-4 pt-4 md:space-y-10 md:px-6 md:pb-8"
            style={{
              paddingBottom: `max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + ${MOBILE_SUBMIT_EXTRA_CLEARANCE}))`,
            }}
          >
            <div className="space-y-4 md:space-y-5">
              {/* 1 — Catégorie */}
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubCategory('');
                  setSubSubCategory('');
                  setTerrainSetting('');
                  setTerrainAreaMode('dimensions');
                  setTerrainLengthM('');
                  setTerrainWidthM('');
                  setTerrainAreaM2('');
                  setTerrainPriceBasis('total');
                  setLocationRentalPeriod('month');
                  setHouseLengthM('');
                  setHouseWidthM('');
                  setHouseRoomCount('');
                  setHouseLevels('');
                  setHouseAreaM2('');
                }}
                className={fieldClass}
              >
                <option>Catégories</option>
                {getPublishCategoryOptions().map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>

              {/* 2 — Sous-catégorie(s) si besoin */}
              {supportsSubcategories(normalizeCategory(category)) && (
                <>
                  <select
                    value={subCategory}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSubCategory(v);
                      setSubSubCategory('');
                      const locOpts = getLocationRentalPeriodOptionsForSub(v);
                      if (locOpts) {
                        setLocationRentalPeriod((prev) =>
                          locOpts.some((o) => o.value === prev) ? prev : 'month'
                        );
                      }
                    }}
                    className={`${fieldClass} ${
                      submitted && !subCategory ? errorClass : ''
                    }`}
                  >
                    <option value="">
                      {normalizeCategory(category) === 'mode'
                        ? 'Homme / Femme'
                        : 'Sous-catégorie'}
                    </option>
                    {getSubCategoryOptions(normalizeCategory(category)).map(
                      (option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      )
                    )}
                  </select>

                  {supportsSecondLevelSubcategories(
                    normalizeCategory(category)
                  ) && (
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
                  )}
                </>
              )}

              {/* 3 — Île */}
              <select
                value={island}
                onChange={(e) => {
                  setIsland(e.target.value);
                  setCity('Ville');
                  setCustomCity('');
                }}
                className={fieldClass}
              >
                <option>Île</option>
                {ISLAND_OPTIONS.map((islandOption) => (
                  <option key={islandOption}>{islandOption}</option>
                ))}
              </select>

              {/* 4 — Ville */}
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={island === 'Île'}
                className={fieldClass}
              >
                <option>Ville</option>
                {island !== 'Île' &&
                  getSortedCitiesByIsland(island).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                {island !== 'Île' && <option>Autre</option>}
              </select>

              {city === 'Autre' && (
                <input
                  type="text"
                  placeholder="Saisir la ville"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className={`${fieldClass} ${
                    submitted && !customCity.trim() ? errorClass : ''
                  }`}
                />
              )}

              {/* 5 — Titre */}
              <input
                type="text"
                placeholder="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${fieldClass} ${
                  submitted && !title.trim() ? errorClass : ''
                }`}
              />

              {/* 6 — Description */}
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${fieldClass} min-h-[96px] resize-none`}
              />

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

              {category.trim().toLowerCase() === 'terrain' && (
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <select
                    value={terrainSetting}
                    onChange={(e) => setTerrainSetting(e.target.value)}
                    className={`${fieldClass} ${
                      submitted && !terrainSetting ? errorClass : ''
                    }`}
                  >
                    <option value="">Terrain : Campagne / Ville</option>
                    <option value="Campagne">Campagne</option>
                    <option value="Ville">Ville</option>
                  </select>

                  <select
                    value={terrainAreaMode}
                    onChange={(e) =>
                      setTerrainAreaMode(e.target.value as 'dimensions' | 'm2')
                    }
                    className={fieldClass}
                  >
                    <option value="dimensions">
                      Mesures : Longueur + Largeur
                    </option>
                    <option value="m2">Mesure : m²</option>
                  </select>

                  {terrainAreaMode === 'dimensions' ? (
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="relative min-w-0">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Longueur (m)"
                          value={terrainLengthM}
                          onChange={(e) => setTerrainLengthM(e.target.value)}
                          className={`${fieldClass} pr-10 ${
                            submitted && Number(terrainLengthM) <= 0
                              ? errorClass
                              : ''
                          }`}
                          aria-label="Longueur en mètres"
                        />
                        <span
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-normal text-gray-600"
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
                          placeholder="Largeur (m)"
                          value={terrainWidthM}
                          onChange={(e) => setTerrainWidthM(e.target.value)}
                          className={`${fieldClass} pr-10 ${
                            submitted && Number(terrainWidthM) <= 0
                              ? errorClass
                              : ''
                          }`}
                          aria-label="Largeur en mètres"
                        />
                        <span
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-normal text-gray-600"
                          aria-hidden
                        >
                          l
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative min-w-0">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Surface"
                        value={terrainAreaM2}
                        onChange={(e) => setTerrainAreaM2(e.target.value)}
                        className={`${fieldClass} pr-12 ${
                          submitted && Number(terrainAreaM2) <= 0
                            ? errorClass
                            : ''
                        }`}
                        aria-label="Surface en mètres carrés"
                      />
                      <span
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-normal text-gray-600"
                        aria-hidden
                      >
                        M²
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 7 — État si demandé */}
              {category.trim().toLowerCase() !== 'terrain' &&
                category.trim().toLowerCase() !== 'vente maison' &&
                normalizeCategory(category) !== 'services' &&
                normalizeCategory(category) !== 'emploi' &&
                normalizeCategory(category) !== 'location' && (
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className={fieldClass}
                  >
                    <option>État</option>
                    {getPublishConditionOptions().map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                )}

              {/* 8 — Prix */}
              <div>
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
                  {category.trim().toLowerCase() === 'terrain' && (
                    <select
                      value={terrainPriceBasis}
                      onChange={(e) =>
                        setTerrainPriceBasis(e.target.value as TerrainPriceBasis)
                      }
                      className="max-w-[5.25rem] shrink-0 self-stretch rounded-xl border border-gray-200 bg-white px-1 py-1 text-center text-[10px] font-semibold leading-tight text-gray-800 outline-none focus:border-green-700 sm:max-w-[6rem] sm:text-xs"
                      title="Portée du prix"
                      aria-label="Prix pour tout le terrain ou au mètre carré"
                    >
                      <option value="total">Total</option>
                      <option value="per-m2">Au m²</option>
                    </select>
                  )}
                  {locationPricePeriodOptions && (
                    <select
                      value={locationRentalPeriod}
                      onChange={(e) =>
                        setLocationRentalPeriod(
                          e.target.value as LocationRentalPeriod
                        )
                      }
                      className="max-w-[6.25rem] shrink-0 self-stretch rounded-xl border border-gray-200 bg-white px-1 py-1 text-center text-[10px] font-semibold leading-tight text-gray-800 outline-none focus:border-green-700 sm:max-w-[7rem] sm:text-xs"
                      title="Période du prix"
                      aria-label="Prix au mois, à la journée, à la nuit ou à l’heure"
                    >
                      {locationPricePeriodOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-gray-600">
                  {category.trim().toLowerCase() === 'terrain'
                    ? 'Terrain : indiquez si le montant est pour la parcelle entière ou au m².'
                    : locationPricePeriodOptions
                      ? 'Location : indiquez la période couverte par ce prix (mois, journée…).'
                      : 'Francs comoriens (KMF) ou euros (€).'}
                </p>
              </div>
            </div>

            {category.trim().toLowerCase() === 'vente maison' && (
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
            )}

            <PublishFormSection title="Contact">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-800">
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
                  <p className="text-xs text-gray-600">
                    Affiché sur l’annonce si la plateforme l’autorise.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-800">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex. 269 321 00 00 (indicatif pays)"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className={fieldClass}
                    autoComplete="tel"
                  />
                  <p className="text-xs text-gray-600">
                    Pour le bouton WhatsApp ; sinon repli sur le téléphone ou le
                    profil.
                  </p>
                </div>
              </div>
            </PublishFormSection>

            <PublishFormSection title="Photos">
              <div className="mx-auto grid w-full max-w-xs grid-cols-[1fr_2.5rem] gap-x-3 gap-y-3 md:mx-0 md:max-w-2xl">
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
                        id={`publier-gallery-${index}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          applyImageFile(index, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                      <input
                        type="file"
                        id={`publier-camera-${index}`}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          applyImageFile(index, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                      <label
                        htmlFor={`publier-gallery-${index}`}
                        className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-2 text-center text-sm font-semibold text-gray-800"
                      >
                        Choisir une photo
                      </label>
                      <label
                        htmlFor={`publier-camera-${index}`}
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
            </PublishFormSection>

            <div
              className="sticky bottom-0 z-20 -mx-4 bg-white/95 px-4 pb-3 pt-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0"
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
              }}
            >
              <button
                type="submit"
                className="w-full rounded-2xl bg-green-700 py-4 text-white"
              >
                Publier
              </button>
            </div>
          </form>
        </div>
      </MobileShell>
    </main>
  );
}