# Preparation mobile (Android/iOS) avec Capacitor

## 1) Installer les dependances Capacitor

```bash
npm install @capacitor/core @capacitor/cli
```

## 2) Configurer les variables

Copier `.env.production.local.example` vers `.env.production.local` (à la racine du projet) et ajuster si besoin:

- `CAP_SERVER_URL` / `NEXT_PUBLIC_CAP_API_ORIGIN` : URL HTTPS du **serveur API** (Render), utilisée au build Capacitor pour les `fetch` depuis l’APK.
- `BZY_SHARED_BETA=0` : obligatoire pour générer le dossier `out/` (APK statique).
- L’interface s’affiche **depuis les fichiers dans l’APK** (plus de chargement de toute la page depuis Render dans la WebView, ce qui evite les erreurs HTTP 502/503 au demarrage).

Exemple (service actuel) :

```env
BZY_SHARED_BETA=0
CAP_SERVER_URL=https://bazariyatrou-2.onrender.com
NEXT_PUBLIC_CAP_API_ORIGIN=https://bazariyatrou-2.onrender.com
```

## 3) Ajouter les plateformes natives

```bash
npm run mobile:add:android
npm run mobile:add:ios
```

## 4) Synchroniser les changements web -> natif

```bash
npm run mobile:sync
```

## 5) Ouvrir les projets natifs

Android Studio:

```bash
npm run mobile:android
```

Xcode:

```bash
npm run mobile:ios
```

## 6) Build de distribution

- Android: Generer un `AAB` (Play Store) ou `APK` (test) depuis Android Studio.
- iOS: Generer un build archive depuis Xcode puis publier sur App Store Connect.

### APK de test sur telephone (sideload)

Sans fichier `android/keystore.properties`, `assembleRelease` produit souvent un APK **non signe** : l’installation peut echouer sur les telephones (« Application non installee »).

- **Recommande pour tests entre amis** : APK **debug**, signe automatiquement :

  ```bash
  npm run mobile:android:apk
  ```

  Fichier : `android/app/build/outputs/apk/debug/app-debug.apk`

- **Release signee** : creer un keystore + `keystore.properties`, puis `gradlew assembleRelease` (ou Android Studio).

### Si l’installation echoue encore

- Desinstaller une ancienne version de l’app si la **signature** a change (debug vs release).
- Autoriser l’installation pour l’app utilisee (Fichiers, Chrome, Telegram…) : **Sources inconnues**.
- Android **7.0+** requis ici (`minSdk 24`).

### L’APK s’installe mais « ne s’ouvre pas » (ecran blanc / rien)

1. **Serveur Render endormi (gratuit)** : le premier chargement peut prendre **30–90 secondes**. Attendre, ou ouvrir `https://bazariyatrou-2.onrender.com` dans **Chrome sur le telephone** une fois pour « reveiller » le service, puis rouvrir l’app.
2. Apres tout changement de `capacitor.config.ts` : `npm run mobile:sync` puis regénérer l’APK.
3. Verifier que `CAP_SERVER_URL` etait bien defini au moment du `mobile:sync` (voir `android/app/src/main/assets/capacitor.config.json` → `server.url`).
4. **Deboguer la WebView** (build debug) : sur le PC, Chrome → `chrome://inspect` → inspecter la WebView → onglet **Console** / **Network** pour voir erreurs (certificat, 404, timeout).
5. Mettre a jour **Android System WebView** et **Chrome** depuis le Play Store sur le telephone.

### Erreur `net::ERR_HTTP_RESPONSE_CODE_FAILURE` dans la WebView

Cela veut dire que **le serveur a répondu avec un code HTTP d’erreur** (pas un probleme SSL classique).

- **502 / 503** : tres frequent sur Render gratuit quand l’instance **dort** ou redemarre. **Réveillez** le site dans Chrome mobile, attendez que la page s’affiche, puis relancez l’app. Pour limiter la casse, utilisez un **ping gratuit** (UptimeRobot, cron-job.org, etc.) vers votre URL toutes les 5–10 minutes.
- **403** : parfois lie a l’**User-Agent** ; le projet ajoute un `appendUserAgent` de type Chrome — refaites `mobile:sync` + rebuild APK apres mise a jour.
- Verifiez sur le telephone que **la meme URL** s’ouvre bien dans **Chrome** (pas seulement dans l’APK).

## Notes importantes

- Le mode mobile charge l'app via `CAP_SERVER_URL`.
- L'URL doit etre HTTPS et disponible publiquement.
- Pensez a incrementer la version avant chaque publication store.

### Build Next pour Capacitor

- Il faut un export statique (`output: export`), donc **`BZY_SHARED_BETA` ne doit pas valoir `1`** au moment du build (sinon Next genere du `standalone` sans dossier `out/`).
- Commande recommandee (ignore `.env.production` avec `BZY_SHARED_BETA=1` et retire temporairement `src/app/api` le temps du build) :
  ```bash
  npm run build:capacitor
  ```
- Alternative PowerShell : `$env:BZY_SHARED_BETA = "0"` puis `npm run build`.
- Ou creer `.env.production.local` avec `BZY_SHARED_BETA=0` (prioritaire sur `.env.production`).
- Les routes `/api/*` ne sont pas utilisees dans l'APK quand `CAP_SERVER_URL` pointe vers le serveur ; elles restent dans le depot pour Render.
