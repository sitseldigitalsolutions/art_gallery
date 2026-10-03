# Development Status

_Last updated: 2026-10-03_

**Overall:** feature-complete MVP running locally end to end (API + web + seeded MySQL). **Not yet production-ready**; see "Before production".

## Verification (actually executed on 2026-10-03)

| Check | Command | Result |
|---|---|---|
| Migrations | `npx prisma migrate dev` | ✅ `20261003075232_init` |
| Seed | `npm run seed` (run twice) | ✅ idempotent: 49 artworks, 11 artists, 21 orders, 8 custom-art requests |
| Backend typecheck | `cd backend && npm run typecheck` | ✅ 0 errors |
| Backend lint | `npm run lint` | ✅ 0 errors / 0 warnings |
| Backend tests | `npm test` (real MySQL `art_gallery_test`) | ✅ 8 files, **71 passed** |
| Frontend typecheck / lint | `npm run typecheck`, `npm run lint` | ✅ |
| Frontend tests | `npm test` (vitest + RTL) | ✅ 6 files, **17 passed** |
| Frontend build | `npm run build` | ✅ |
| Browser E2E | `npm run test:e2e` (Playwright, Chromium) | ✅ **2 passed**: digital purchase via bank transfer; photo-to-art upload → artist quote/preview → revision → approval → cart |
| Express adapter | live smoke test | ✅ |
| Hapi adapter | `BACKEND_FRAMEWORK=hapi` live smoke test (health, artworks, admin dashboard, media) | ✅ |
| Visual review | headless screenshots of home, gallery, artwork detail, wizard, seller + admin dashboards | ✅ reviewed; fixes applied (below) |

### Integration fixes made during verification
- `/auth/refresh` was in the strict login rate-limit tier and runs on every page load, so normal browsing would hit 429. It now uses the default tier.
- The admin artist filter requested `pageSize=100` while the cap was 60 (400 error). The shared cap is now 100.
- Create Your Art stepper labels were invisible over the dark header. It's now on a white card.
- The seller overview read the wrong field for a request's customer name.
- Pluralisation ("1 works"), and the home grids no longer end in half-empty rows.
- Production seed no longer adds demo content unless `SEED_DEMO=true`.

## Phases

| Phase | Status | Notes |
|---|---|---|
| 1 Foundation | ✅ | Separate `backend/` + `frontend/`, Docker MySQL, env validation, Dockerfiles, compose |
| 2 Auth & RBAC | ✅ | JWT + rotating refresh cookie with reuse detection, lockout, artist approval, server-side RBAC, seller isolation (404 on foreign resources) |
| 3 Artist / Gallery | ✅ | Profiles, galleries, artwork CRUD + images + private digital file, approval workflow, taxonomy, collections |
| 4 Customer gallery | ✅ | Home (real data), search, filters, details, artists, collections, wishlist, follow, reviews |
| 5 Custom Photo-to-Art | ✅ | State machine, private EXIF-stripped photos, signed URLs, previews, revisions, final delivery, history |
| 6 Commerce | ✅ | Cart, checkout, COD / manual payment, shipments, limited signed digital downloads |
| 7 Marketplace finance | ✅ | Commission rules, immutable commission snapshot, append-only ledger, settlements, analytics, CSV |
| 8 Security & testing | 🟡 | 71 API + 17 UI + 2 E2E tests. Broader E2E (artist registration → admin approval in UI) and an external security review are pending |
| 9 Production | 🟡 | Dockerfiles, health checks, structured logs. Monitoring, CI and the actual Hostinger deployment are pending |

### Admin account management (2026-10-03)
- Admins can create customer, artist (optionally pre-approved, with profile + gallery) and admin accounts (Users → Create account, Artists → Add artist), with a generated strong starting password shown once to share.
- Admins can delete any account (Users and Artists pages): anonymised soft delete with reason + typed confirmation; financial records preserved; self-deletion blocked; audited.
- Tests: backend 84 passed (6 new), frontend 27 passed (4 new).

### Website configuration (2026-10-03)
- Admin → **Appearance** (`/admin/appearance`, ADMIN only): theme presets + custom colours, corner style, fonts (live preview across the site), homepage section show/hide/reorder (drag or arrows) with heading overrides, hero carousel (autoplay, interval, fade/slide/zoom/Ken Burns, darkness, height, search/particles, banner or fixed text, CTAs) with the banner manager embedded, branding, announcement bar, contact, social links, footer, animation on/off + intensity + page transitions.
- API: `GET /site-config`, `PUT /admin/site-config`, `POST /admin/site-config/reset` — zod-validated (hex colours, safe links only), audited, defaults merged; generic settings endpoint cannot write it.
- Tests: backend 78 passed (7 new), frontend 23 passed (6 new); typecheck, lint and build pass.

### Topic imagery (2026-10-03)
- Demo catalogue now uses real artwork images from Wikimedia Commons (public domain / CC), matched per category and style, each with its source credit in `copyrightInfo`. Every image was reviewed on a contact sheet (nudity, violence, ghost prints and duplicates excluded).
- Private custom-art files (source/preview/final) and digital deliverables were replaced through the same secure pipeline. Old files were deleted (346 files, 68.7 MB). All 256 public image URLs and the private signed URLs were verified.
- Stand-in "customer photos" are public-domain family/portrait paintings, so no real person's photo is used. Artist avatars stay stylised for the same reason.

## Known gaps / decisions

- **Database adapters:** only `mysql/prisma`. Other combos stop at boot with a clear error. Modules use Prisma directly; a repository layer is needed before Mongo/Drizzle.
- **Online payments:** Razorpay/Stripe/PayU are stubs (501). COD and manual bank/UPI with admin confirmation work.
- **AI image generation:** interface + `none` provider only (artists create work manually, by design).
- **Malware scanning:** heuristic scanner + full re-encode of every image; add ClamAV / cloud AV for production.
- **Rate limiting** is in-memory (single instance); Redis needed for multiple instances.
- **Search** uses `LIKE` matching; the FULLTEXT index isn't used yet.
- **Seeded image URLs** are absolute (`API_PUBLIC_URL` at seed time).
- Settlement payout method is stored as a `[METHOD]` prefix in `Settlement.note`.
- Not exposed yet: gallery image CRUD, artist portfolio-document upload, artwork image drag-reorder, taxonomy image upload (URL only), commission-rule target picker (ID input).
- No email delivery (in-app notifications only). Newsletter/chat buttons open the visitor's email client.
- Main JS bundle is ~810 KB (246 KB gzip); dashboards are lazy-loaded.

## Before production

1. **Rotate the Hostinger MySQL password** (it was shared in chat) and update `backend/.env.production`.
2. Real secrets for `JWT_*` / `FILE_SIGNING_SECRET` (the API refuses placeholders in production). A strong `SEED_ADMIN_PASSWORD`. Keep `SEED_DEMO=false`.
3. HTTPS; set `FRONTEND_URL` / `API_PUBLIC_URL` to the live domain (cookies become `secure` automatically).
4. S3-compatible storage or a backed-up persistent volume for `uploads/`.
5. CI running the test suites; extend E2E to artist registration + admin approval in the UI; external security review and `npm audit`.
6. Monitoring: uptime on `/health`, error tracking, log shipping.
