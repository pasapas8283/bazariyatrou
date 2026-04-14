# Preparation mobile (Android/iOS) avec Capacitor

## 1) Installer les dependances Capacitor

```bash
npm install @capacitor/core @capacitor/cli
```

## 2) Configurer les variables

Copier `.env.mobile.example` vers `.env.local` et ajuster:

- `CAP_SERVER_URL` : URL HTTPS publique de l'app (obligatoire en production)
- `ADMIN_PASSWORD` : mot de passe admin serveur

Exemple:

```bash
CAP_SERVER_URL=https://votre-domaine.com
ADMIN_PASSWORD=mot-de-passe-fort
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

## Notes importantes

- Le mode mobile charge l'app via `CAP_SERVER_URL`.
- L'URL doit etre HTTPS et disponible publiquement.
- Pensez a incrementer la version avant chaque publication store.
