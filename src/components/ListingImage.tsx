import Image from 'next/image';

const FALLBACK = 'https://placehold.co/600x400?text=Annonce';

type ListingImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
};

/** Affiche data:/blob: avec <img> (WebView Capacitor) ; URLs http(s) via next/image. */
export default function ListingImage({
  src,
  alt,
  width = 600,
  height = 400,
  fill = false,
  sizes,
  className,
}: ListingImageProps) {
  const resolved = src?.trim() || FALLBACK;
  const fillClass = fill ? 'absolute inset-0 h-full w-full' : '';
  const mergedClass = [fillClass, className].filter(Boolean).join(' ');

  if (resolved.startsWith('data:') || resolved.startsWith('blob:')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        className={mergedClass || undefined}
        loading="lazy"
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}
