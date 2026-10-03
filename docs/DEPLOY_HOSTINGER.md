# Deploy the backend (API) on Hostinger

Only the **backend** runs on Hostinger. The frontend can be hosted anywhere (Vercel, Netlify, Hostinger static hosting…) and talks to the API over HTTPS.

> Hostinger runs Node.js apps on **Business / Cloud** web hosting plans (hPanel → *Websites* → *Add website* → **Node.js Apps**) and on any **VPS**. Single/Premium shared plans cannot run Node.js — check your plan first. Field names in hPanel may differ slightly from the ones below.

## 1. Database (once)

1. hPanel → **Databases → phpMyAdmin** → open your empty database → **Import** → `database/art_gallery_full.sql`.
2. In hPanel → **Databases → MySQL databases**, note the database **name**, **user**, **host** and set a **new password**.

## 2. Create the Node.js app

| Setting | Value |
|---|---|
| Source | GitHub repo `sitseldigitalsolutions/art_gallery`, branch `main` (or upload a zip of the `backend/` folder) |
| Framework / preset | **Express.js** (or "Other") |
| Node.js version | **20** or **22** |
| **Root directory** | `backend` |
| Install / build command | `npm run build` (after Hostinger installs packages; `npm ci && npm run build` if you set the command yourself) |
| **Entry file** (root file) | `server.js` |
| Start command (if asked) | `npm start` |

What these do:
- `backend/server.js` is the root entry file — it starts the compiled API in `backend/dist/`.
- `npm run build` runs `prisma generate` (database client for the server's OS) and compiles TypeScript to `dist/`.
- Build tools (TypeScript, Prisma CLI, type definitions) are regular dependencies, so the build also works when the host installs production packages only.
- The app listens on the `PORT` Hostinger provides automatically.

## 3. Environment variables

Add these in the app's **Environment variables** section (copy the secret values from your local, git-ignored `backend/.env.production`):

```env
NODE_ENV=production
BACKEND_FRAMEWORK=express
DATABASE_TYPE=mysql
ORM_PROVIDER=prisma
# host = the "Host" shown in hPanel → MySQL databases (often localhost); URL-encode special characters in the password (@ → %40)
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME

# Public URL of THIS API (images are served from <API_PUBLIC_URL>/media/...)
API_PUBLIC_URL=https://artgalleryapi.mymoonsgallery.com
# Where the frontend is hosted (comma-separate several). Used for CORS and CSRF checks.
FRONTEND_URL=https://mymoonsgallery.com,https://www.mymoonsgallery.com
# lax  = frontend and API on the same site (mymoonsgallery.com + api.mymoonsgallery.com)
# none = frontend on a different domain (e.g. *.vercel.app) — required for login to survive page reloads
COOKIE_SAMESITE=lax

JWT_ACCESS_SECRET=<64+ random characters>
JWT_REFRESH_SECRET=<64+ random characters>
FILE_SIGNING_SECRET=<64+ random characters>

STORAGE_PROVIDER=local
# Absolute path OUTSIDE the app folder so uploads survive redeploys
LOCAL_UPLOAD_DIR=/home/YOUR_HOSTINGER_USER/art-gallery-uploads
MAX_UPLOAD_MB=15

PAYMENT_PROVIDER=cod
DEFAULT_CURRENCY=INR
DEFAULT_COUNTRY=IN
DEFAULT_TIMEZONE=Asia/Kolkata
COMMISSION_DEFAULT_PERCENTAGE=10
AI_PROVIDER=none
SEED_DEMO=false
```

Generate a secret locally with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
The API refuses to start in production with placeholder secrets.

## 4. Images

**Quick fix for an existing database** whose image links point to the wrong host: run `database/fix-image-urls.sql` in phpMyAdmin (SQL tab). It rewrites every stored image URL to `https://artgalleryapi.mymoonsgallery.com/media/...` and is safe to run more than once.

**Upload the image files:** `database/art-gallery-uploads.zip` (created locally, not in git) contains `public/` and `private/`. In hPanel → File Manager, open the folder used as `LOCAL_UPLOAD_DIR` (or the app's `uploads/` folder if you did not set it), upload the zip and **Extract** it there so you get `<folder>/public/artworks/...`. Test: `https://artgalleryapi.mymoonsgallery.com/media/artworks/<file>.webp` should show an image.


The images are not in git. Upload the contents of your local `backend/uploads/` folder (both `public/` and `private/`) to the folder set in `LOCAL_UPLOAD_DIR` (hPanel → **File Manager**, or SFTP). Keep `private/` private — never put it inside `public_html`.

The image URLs inside `art_gallery_full.sql` start with `https://mymoonsgallery.com/media/`. If your API runs on a different address (for example `https://artgalleryapi.mymoonsgallery.com`), regenerate the SQL so they match:

```bash
cd backend
EXPORT_PUBLIC_URL=https://artgalleryapi.mymoonsgallery.com npx tsx prisma/export-production.ts
```

## 5. Point a domain at the API

Attach a domain or subdomain (recommended: `api.mymoonsgallery.com`) to the Node.js app and enable **SSL**. Then check:

- `https://artgalleryapi.mymoonsgallery.com/health` → `{"status":"ok", "database": {"status":"up"}, ...}`
- `https://artgalleryapi.mymoonsgallery.com/api/v1/artworks?pageSize=1` → artworks JSON

## 6. Frontend settings

Build the frontend with the API address:

```bash
cd frontend
VITE_API_URL=https://artgalleryapi.mymoonsgallery.com/api/v1 npm run build   # upload frontend/dist
```

The frontend is a single-page app: configure the host to serve `index.html` for unknown paths (see `frontend/nginx.conf`; on Hostinger static hosting add an `.htaccess` rewrite to `index.html`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| App exits with "Invalid environment configuration" | A required variable is missing — the log lists which one. |
| `/health` shows `database: down` | Wrong `DATABASE_URL` host/user/password, or the password has unencoded special characters. |
| CORS error in the browser | Add the exact frontend origin (scheme + host, no trailing slash) to `FRONTEND_URL`. |
| Logged out after every page reload | Frontend is on another domain → set `COOKIE_SAMESITE=none` (HTTPS only). |
| Images 404 | Upload `uploads/public` into `LOCAL_UPLOAD_DIR`, and make sure image URLs match `API_PUBLIC_URL`. |
| Build fails with `Cannot find type definition file for 'node'` | Use the latest code from `main` (build tools are regular dependencies now) and redeploy. |
