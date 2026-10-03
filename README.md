# MyMoons Gallery — Art & Gallery Marketplace

A multi-vendor marketplace for original art, prints and digital work, built around **"Turn Your Photo Into Art"**: customers upload a photo, pick a style and an artist, and follow the commission through quote → preview → revision → approval → delivery.

```
ART/
├── backend/            Node.js + TypeScript API (Express or Hapi) · Prisma · MySQL
│   ├── prisma/         schema.prisma · migrations/ · seed.ts · art-generator.ts
│   ├── src/
│   │   ├── config/     env validation (zod)
│   │   ├── bootstrap/  route table, framework-neutral pipeline, health
│   │   ├── adapters/   express/ · hapi/
│   │   ├── modules/    auth, artists, galleries, artworks, taxonomy, collections, home,
│   │   │               wishlist, follows, reviews, users, notifications, files, reports,
│   │   │               custom-art, cart, orders, payments, downloads, finance, admin, analytics
│   │   ├── providers/  storage (local/S3) · payment (COD/manual + stubs) · ai (pluggable)
│   │   ├── middleware/ authenticate, rate-limit
│   │   └── shared/     errors, validation, image security, serializers, audit
│   └── tests/          vitest + supertest integration tests (real MySQL)
├── frontend/           React 19 + Vite + Tailwind v4 + Ant Design + Motion + TanStack Query
│   ├── src/features/   home, artworks, artists, galleries, collections, custom-art, cart,
│   │                   checkout, orders, wishlist, account, auth, seller, admin
│   └── e2e/            Playwright browser tests
├── docs/               ARCHITECTURE.md · API_CONTRACT.md
├── docker-compose.yml
└── DEVELOPMENT_STATUS.md
```

## Quick start (local)

Requires Node 22+ and Docker.

```bash
# 1. Database
docker compose up -d mysql

# 2. API  →  http://localhost:4000  (health: /health)
cd backend
cp .env.example .env        # then set JWT_* and FILE_SIGNING_SECRET to long random values
npm install
npx prisma migrate deploy
npm run seed                # roles, taxonomy, admin + demo gallery (generated original artwork)
npm run dev

# 3. Web  →  http://localhost:5173
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

### Demo accounts (created by the seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@artgallery.local | Admin@12345 (`SEED_ADMIN_*` in `.env`) |
| Artist | artist@artgallery.local | Artist@12345 |
| Customer | customer@artgallery.local | Customer@12345 |

The seed generates placeholder images procedurally (`prisma/art-generator.ts`). To swap in real, topic-matched artwork (public domain / Creative Commons from Wikimedia Commons, with credits stored on each artwork):

```bash
cd backend
npm run images:topics -- plan          # search + contact sheet at uploads/topic-images/contact-sheet.jpg (review it!)
npm run images:topics -- apply         # public: artworks, categories, styles, collections, galleries, banners
                                       # private: custom-art source/preview/final + digital download files
npm run images:topics -- cleanup --yes # delete old files no longer referenced
```

## Commands

| | backend | frontend |
|---|---|---|
| Dev server | `npm run dev` | `npm run dev` |
| Type check | `npm run typecheck` | `npm run typecheck` |
| Lint | `npm run lint` | `npm run lint` |
| Unit/integration tests | `npm test` (uses DB `art_gallery_test`; override with `TEST_DATABASE_URL`) | `npm test` |
| Browser E2E | – | `npx playwright install chromium` once, then `npm run test:e2e` (needs seeded dev DB) |
| Build | `npm run build` | `npm run build` |

## Configuration

See `backend/.env.example`. Key switches:

* `BACKEND_FRAMEWORK=express|hapi` — same routes and business logic either way.
* `DATABASE_TYPE=mysql` + `ORM_PROVIDER=prisma` — the implemented adapter (others fail fast with a clear message).
* `STORAGE_PROVIDER=local|s3` — public media vs. **private** customer photos and digital files (signed URLs only).
* `PAYMENT_PROVIDER=cod` — COD and manual bank/UPI confirmation; Razorpay/Stripe/PayU are interface stubs.
* `AI_PROVIDER=none` — the `ImageGenerationProvider` seam for future AI previews.

## Deployment

### Docker (VPS)
```bash
docker compose --profile app up -d --build     # mysql + api (:4000) + web (:5173 → nginx)
```
Set real values in `backend/.env` first. The API container runs `prisma migrate deploy` on start. Mount a persistent volume for `uploads/` (already declared), or use S3.

### Database import (Hostinger phpMyAdmin)

Ready-made SQL files are in `database/` (MySQL 8 and MariaDB 10.5+ compatible, tested on both):

| File | Use |
|---|---|
| `database/art_gallery_full.sql` | All 64 tables **plus** the demo catalogue (artists, 50 artworks, collections, orders, custom-art requests, site settings) |
| `database/art_gallery_schema.sql` | Tables only — then create your admin with `npm run seed` (set `SEED_DEMO=false`) |

1. hPanel → Databases → phpMyAdmin → open your (empty) database.
2. **Import** → choose `art_gallery_full.sql` → **Import**.
3. Upload `backend/uploads/` to the API server so image URLs (`https://mymoonsgallery.com/media/...`) resolve.
4. Every account in the file has a **new random password** — they are in `database/production-credentials.local.txt` on the machine that generated the export (never committed). Change them after first login.

Regenerate the files from your local database with `cd backend && npx tsx prisma/export-production.ts` (options: `EXPORT_PUBLIC_URL`, `EXPORT_ADMIN_EMAIL`).

### Hostinger (mymoonsgallery.com)

**Backend only on Hostinger?** Follow [docs/DEPLOY_HOSTINGER.md](docs/DEPLOY_HOSTINGER.md): root directory `backend`, build `npm ci --include=dev && npm run build`, entry file `server.js`.

`backend/.env.production` (git-ignored, local only) is prepared for your Hostinger database (host `localhost` when the API runs on the Hostinger server).
1. **Rotate the database password in hPanel first** (it was shared in chat), then update `DATABASE_URL` (URL-encode special characters, e.g. `@` → `%40`).
2. Deploy the API on a plan that runs Node.js (Hostinger VPS, or a Node.js-enabled hosting plan): `npm ci && npx prisma generate && npm run build && npx prisma migrate deploy && node dist/index.js`, with `.env.production` as `.env`.
3. Build the frontend with `VITE_API_URL=https://<api-host>/api/v1 npm run build` and upload `frontend/dist/` (SPA fallback to `index.html`; see `frontend/nginx.conf`).
4. Set `FRONTEND_URL` and `API_PUBLIC_URL` to the live URLs. For a production seed, set a strong `SEED_ADMIN_PASSWORD`; the demo content is only meant for development.

Read **DEVELOPMENT_STATUS.md → "Before production"** before going live.
