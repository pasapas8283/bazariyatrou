# Beta Partagee (Version Test Reelle)

Ce projet peut tourner en 2 modes:

- `APK local` (actuel): build statique (`output: export`)
- `beta partagee`: serveur Next en ligne (`output: standalone`)

En mode beta partagee, tous les testeurs voient les memes annonces/messages
(base commune sur le serveur).

## 1) Variables d'environnement

Creer un fichier `.env.production`:

```env
BZY_SHARED_BETA=1
NODE_ENV=production
ADMIN_PASSWORD=change-me-now

# Emplacement du fichier DB serveur (persistent disk)
BZY_DB_FILE=/data/bazariyatrou-db.json
```

> `BZY_DB_FILE` doit pointer vers un disque persistant sur la plateforme.

## 2) Build et run serveur

```bash
npm install
npm run build
npm run start:shared
```

## 3) Deploiement recommande (Railway / Render / VPS)

Exigences:

- Service Node.js
- Commande build: `npm run build`
- Commande start: `npm run start`
- Port expose par la plateforme
- Volume persistant monte sur `/data`

## 4) Verification multi-utilisateur

1. Ouvrir l'URL publique sur 2 telephones differents.
2. Compte A publie une annonce.
3. Compte B recharge `Annonces` et ouvre l'annonce.
4. Compte B contacte le vendeur et envoie un message.
5. Compte A recoit la conversation.

Si c'est OK, la beta partagee est prete pour tests amis.
