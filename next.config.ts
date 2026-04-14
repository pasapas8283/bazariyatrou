import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Évite que Turbopack prenne un `package-lock.json` dans un dossier parent (ex. `C:\\Users\\…`). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isSharedBeta = process.env.BZY_SHARED_BETA === "1";

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  reactCompiler: true,
  /**
   * - APK local: export statique
   * - Beta partagée: serveur Next (standalone) pour API + données communes
   */
  output: isSharedBeta ? "standalone" : "export",
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
