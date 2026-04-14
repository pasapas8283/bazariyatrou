import { copyFileSync, existsSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const launcherIconPath = join(root, 'public', 'app-launcher-icon.png');
const launcherIconPathInIcons = join(root, 'public', 'icons', 'app-launcher-icon.png');
const iconPath = join(root, 'public', 'icon.png');
const iconPathInIcons = join(root, 'public', 'icons', 'icon.png');
const launcherSvgPath = join(root, 'public', 'icons', 'app-launcher-icon.svg');
const svgIconPath = join(root, 'public', 'icons', 'icon-512.svg');
const dest = join(root, 'android', 'app', 'src', 'main', 'res', 'drawable', 'app_icon.png');
const legacyDest = join(root, 'android', 'app', 'src', 'main', 'res', 'drawable', 'app_brand_logo.png');
const invalidDest = join(root, 'android', 'app', 'src', 'main', 'res', 'drawable', 'app_brand_logo.png.png');

/**
 * L'icone launcher doit toujours etre une image carree.
 * On nettoie les anciens noms de fichiers pour eviter les inversions logo/icone.
 */
if (existsSync(invalidDest)) unlinkSync(invalidDest);
if (existsSync(legacyDest)) unlinkSync(legacyDest);

async function main() {
  const pngSource =
    [launcherIconPath, launcherIconPathInIcons, iconPath, iconPathInIcons].find((p) => existsSync(p)) ??
    null;

  if (pngSource) {
    copyFileSync(pngSource, dest);
    const relative = pngSource.replace(`${root}\\`, '').replaceAll('\\', '/');
    console.log(`Icone Android : ${relative} -> res/drawable/app_icon.png`);
    return;
  }

  if (existsSync(launcherSvgPath) || existsSync(svgIconPath)) {
    const sharp = (await import('sharp')).default;
    const source = existsSync(launcherSvgPath) ? launcherSvgPath : svgIconPath;
    await sharp(source).resize(512, 512).png().toFile(dest);
    console.log(
      `Icone Android : ${source.includes('app-launcher-icon.svg') ? 'public/icons/app-launcher-icon.svg' : 'public/icons/icon-512.svg'} (512x512 PNG) -> res/drawable/app_icon.png`
    );
    return;
  }

  console.error(
    'sync-android-logo: ajoutez public/app-launcher-icon.png (carre), public/icons/app-launcher-icon.svg, ou public/icons/icon-512.svg.'
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
