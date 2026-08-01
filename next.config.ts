import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Évite que Turbopack prenne un `package-lock.json` dans un dossier parent (ex. `C:\\Users\\…`). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isSharedBeta = process.env.BZY_SHARED_BETA === "1";
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CAP_API_ORIGIN:
      process.env.NEXT_PUBLIC_CAP_API_ORIGIN ||
      process.env.CAP_SERVER_URL ||
      "https://bazariyatrou-2.onrender.com",
  },
  turbopack: {
    root: projectRoot,
  },
  reactCompiler: true,
  /**
   * - `next dev` : pas d’export (sinon UUID dynamiques + /api cassés)
   * - APK Capacitor : export statique (BZY_SHARED_BETA=0)
   * - Beta partagée Render : standalone (BZY_SHARED_BETA=1)
   */
  ...(isDev
    ? {}
    : { output: isSharedBeta ? ("standalone" as const) : ("export" as const) }),
  images: {
    unoptimized: true,
  },
  /**
   * Ne pas fixer `allowedDevOrigins` par défaut : dès qu’il est défini, Next.js **bloque**
   * (403 sur /_next/*) toute origine qui ne matche pas la liste — y compris 127.0.0.1 ou le
   * nom de machine Windows, ce qui donne une page blanche.
   *
   * Pour autoriser explicitement le LAN en dev (liste stricte), dans `.env.local` :
   *   DEV_ALLOW_LAN_ORIGINS=1
   * puis ajuster les motifs ci-dessous si besoin.
   */
  ...(process.env.NODE_ENV !== "production" &&
  process.env.DEV_ALLOW_LAN_ORIGINS === "1"
    ? {
        allowedDevOrigins: [
          "127.0.0.1",
          "192.168.*.*",
          "10.*.*.*",
          "172.*.*.*",
        ],
      }
    : {}),
};

export default nextConfig;
