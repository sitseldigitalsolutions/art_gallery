# Architecture — MyMoons Art & Gallery Marketplace

## 1. System overview

```
┌─────────────────────────────┐        HTTPS (JSON, multipart)        ┌──────────────────────────────────────────┐
│  frontend/  (React + Vite)  │ ───────────────────────────────────▶  │  backend/  (Node.js + TypeScript)        │
│  • Public gallery (Tailwind │   Authorization: Bearer <access JWT>  │  adapters/express  | adapters/hapi       │
│    + Motion)                │   ag_rt httpOnly refresh cookie       │        └──────┬───────┘                  │
│  • Seller & Admin dashboards│ ◀───────────────────────────────────  │     bootstrap/pipeline (rate limit →     │
│    (Ant Design)             │   { success, data, meta }             │     authenticate → RBAC → CSRF → handler)│
└─────────────────────────────┘                                       │     modules/* (framework-independent)    │
                                                                      │     providers/ storage | payment | ai    │
                                                                      └──────┬───────────────┬───────────────────┘
                                                                             │ Prisma        │ StorageProvider
                                                                       ┌─────▼─────┐   ┌─────▼──────────────────┐
                                                                       │  MySQL 8  │   │ local uploads/ or S3   │
                                                                       └───────────┘   │  public/  │  private/  │
                                                                                       └────────────────────────┘
```

* **frontend/** and **backend/** are fully separate projects (own `package.json`, own Dockerfile).
* `BACKEND_FRAMEWORK=express|hapi` — both adapters consume the *same* route table (`RouteDef[]`) and the same
  `executeRoute()` pipeline, so business logic never imports Express or Hapi.
* `DATABASE_TYPE` / `ORM_PROVIDER` — `mysql/prisma` is implemented. Other combinations fail fast at boot with
  a clear message rather than silently mixing stores (see §6).

## 2. Request pipeline (`src/bootstrap/pipeline.ts`)

1. **Rate limit** per route tier (`default`, `auth`, `upload`, `strict`).
2. **Authenticate** — verify access JWT (HS256, issuer/audience pinned), then *reload* user, roles and artist
   from the DB (suspensions take effect immediately; nothing about identity is trusted from the client).
3. **Authorize** — `route.roles` (RBAC). Ownership (seller isolation, customer ⇄ artist on custom-art) is enforced
   in each service by deriving `artistId`/`userId` from the session; foreign resources return **404** (no IDOR oracle).
4. **CSRF** — cookie-authenticated endpoints (`/auth/refresh`, `/auth/logout`) require a whitelisted `Origin`,
   on top of `SameSite=Lax` cookies. All other endpoints use Bearer tokens (not auto-sent by browsers).
5. **Handler** — zod-validated input, Prisma (parameterised — no SQL string building), envelope response.

## 3. Roles

| Role | How obtained | Capabilities |
|---|---|---|
| ADMIN | seeded | everything; overrides seller restrictions; every mutation audited |
| ARTIST | `/auth/register/artist` (status `PENDING_APPROVAL`) | own artworks/gallery/collections/orders/requests/earnings only; can publish only when `APPROVED` |
| CUSTOMER | `/auth/register` (artists also get it) | browse, wishlist, follow, cart, orders, custom-art requests, reviews of purchases |

## 4. Data model (MySQL via Prisma — `backend/prisma/schema.prisma`)

```
User ─┬─< UserRole >─ Role ─< RolePermission >─ Permission
      ├─< Session (hashed refresh tokens, rotation + reuse detection)
      ├── CustomerProfile, ─< CustomerAddress, ─< Wishlist ─< WishlistItem(type,targetId)
      ├─< ArtistFollow >── Artist
      ├─< RecentlyViewedArtwork >── Artwork
      ├── Cart ─< CartItem ─(artwork | customArtRequest)
      └─< Order ─┬─< OrderItem ── Commission (immutable snapshot)
                 │      ├─< DownloadAccess ─< DownloadLog
                 │      └─< ArtistLedger (append-only)
                 ├─< Payment
                 └─< Shipment (one per artist per order)

Artist ─┬── ArtistProfile, ArtistAddress, ─< ArtistDocument, ─< ArtistApproval (history)
        ├── Gallery ─< GalleryImage, ─< GalleryCollection >── ArtworkCollection
        ├─< Artwork ─┬─< ArtworkImage, ── ArtworkInventory, ─< ArtworkApproval (history)
        │            ├── ArtworkCategory / ArtworkStyle / ArtworkMedium / ArtworkTheme
        │            ├─< ArtworkTagOnArtwork >── ArtworkTag
        │            ├─< CollectionItem >── ArtworkCollection
        │            └─< ArtworkReview ─< ReviewImage
        ├─< ArtistReview
        ├─< CustomArtRequest ─┬─< CustomArtImage (SOURCE/REFERENCE/PREVIEW/FINAL — always private)
        │                     ├─< CustomArtRevision
        │                     └─< CustomArtStatusHistory
        └─< Settlement ─< SettlementTransaction

CommissionRule(scope GLOBAL|ARTIST|CATEGORY|ARTWORK|CUSTOM_ART), Banner, Promotion, FeaturedArtwork,
FeaturedArtist, Report, Notification, NotificationTemplate, AuditLog, SystemSetting
```

## 5. Custom Photo-to-Art workflow

```
REQUESTED ─► ARTIST_REVIEWING ─► ACCEPTED ─► IN_PROGRESS ─► PREVIEW_READY ─► CUSTOMER_APPROVED ─► FINALIZING ─► COMPLETED
   │ customer upload     artist      artist quote   artist        ▲     │ customer         (add to cart,     artist uploads   customer
   │ (private, EXIF      opens       (quotedPrice)  starts        │     ▼                   checkout)         final file       confirms
   │  stripped)                                                  REVISION_REQUESTED (≤ maxRevisions)
   └─► REJECTED (artist/admin)        CANCELLED: customer before work starts; admin any time
```
`src/modules/custom-art/state-machine.ts` is the single source of truth (pure, unit-tested). Every transition writes
`CustomArtStatusHistory`, notifies the other party, and returns `allowedActions` to drive the UI.

## 6. Extensibility seams

| Seam | Interface | Implemented | Planned |
|---|---|---|---|
| HTTP framework | `RouteDef` + `executeRoute` | Express 5, Hapi 21 | – |
| Database | `connectDatabase()` adapter switch | MySQL + Prisma | MySQL + Drizzle, MongoDB + Prisma/Mongoose (repository layer to be extracted per module) |
| Storage | `StorageProvider` | Local disk, S3-compatible | – |
| Payments | `PaymentProvider` | COD, Manual confirmation | Razorpay, Stripe, PayU (stubs refuse to run) |
| AI images | `ImageGenerationProvider` | `none` | any provider; outputs flagged `isAiGenerated` and labelled "AI preview" |
| Malware scan | `FileScanner` | heuristic (exec headers, embedded scripts) + full re-encode | ClamAV / cloud AV |
| Rate limit store | in-memory | ✔ | Redis when `REDIS_ENABLED=true` |

## 7. File storage & privacy

```
uploads/public/artworks|artists|galleries|reviews|site     → served at /media/* (immutable names, nosniff)
uploads/private/custom-art/source|preview|final            → NEVER served statically
uploads/private/digital-art, artist-documents              → only via signed URL / authorized endpoint
```
* Every image upload is content-validated (allow-listed MIME, libvips decode, min/max dimensions,
  decompression-bomb pixel limit, scanner hook) and **re-encoded** to WebP — this strips EXIF/GPS from customers'
  personal photos and neutralises polyglot files. Filenames are server-generated; client paths/URLs are never trusted.
* Private files are delivered through `GET /api/v1/files/private?k&u&exp&sig` — HMAC-SHA256 over key+user+expiry,
  10-minute default lifetime (60 s for digital downloads, which are additionally counted and limited).

## 8. Money

Amounts are `DECIMAL(12,2)`; all arithmetic happens in integer paise (`utils/money.ts`). Commission is resolved by
specificity (artwork → artist → category → global; custom art: artist → custom-art → global → env default), stored
as an immutable `Commission` row per order item, and mirrored into the append-only `ArtistLedger`
(`SALE_CREDIT` +gross, `COMMISSION_DEBIT` −commission; `PENDING → AVAILABLE` on payment confirmation → `SETTLED`).
