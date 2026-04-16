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

# Option gratuite: Supabase (remplace le fichier local)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
# Optionnel (defaut: app_state)
SUPABASE_STATE_TABLE=app_state
```

> `BZY_DB_FILE` doit pointer vers un disque persistant sur la plateforme.
> Si `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` sont definis, l'app utilise Supabase
> comme stockage partage (et ignore le fichier local).

## 2) Build et run serveur

```bash
npm install
npm run build
npm run start:shared
```

## 3) Deploiement recommande (Railway / Render / VPS)

Exigences:

- Service Node.js
- Commande build (Render / CI): `npm ci --include=dev && npm run build`  
  (ou `npm install && npm run build` si pas de `package-lock.json`)
- Commande start (mode standalone): `npm run start:shared`
- Port expose par la plateforme
- Volume persistant monte sur `/data`

### Render (resume)

- Option A: connecter le depot avec le fichier `render.yaml` a la racine (build + start + env de base).
- Option B: dans le dashboard, mettre **Build Command** a `npm ci --include=dev && npm run build` et **Start Command** a `npm run start:shared`.
- Si le build affiche `next: not found`, l'etape d'installation des dependances n'a pas tourne correctement ou les **devDependencies** (TypeScript, Tailwind, ESLint…) n'etaient pas installees avant `next build`.

## 3.1) Supabase (gratuit) - table SQL a creer

Dans Supabase SQL Editor, executer:

```sql
create table if not exists public.app_state (
  id int primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_state_updated_at on public.app_state;
create trigger trg_app_state_updated_at
before update on public.app_state
for each row execute function public.touch_updated_at();
```

Ensuite, ajouter sur Render:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STATE_TABLE=app_state` (optionnel)

> Important: garder `SUPABASE_SERVICE_ROLE_KEY` cote serveur uniquement (jamais dans le client mobile/web).

## 4) Verification multi-utilisateur

1. Ouvrir l'URL publique sur 2 telephones differents.
2. Compte A publie une annonce.
3. Compte B recharge `Annonces` et ouvre l'annonce.
4. Compte B contacte le vendeur et envoie un message.
5. Compte A recoit la conversation.

Si c'est OK, la beta partagee est prete pour tests amis.
