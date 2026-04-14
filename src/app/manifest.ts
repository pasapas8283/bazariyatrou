import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BazariYatrou',
    short_name: 'BazariYatrou',
    description: 'Marketplace local pour acheter et vendre facilement.',
    id: '/',
    scope: '/',
    start_url: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#ffffff',
    theme_color: '#15803d',
    orientation: 'portrait',
    lang: 'fr',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
