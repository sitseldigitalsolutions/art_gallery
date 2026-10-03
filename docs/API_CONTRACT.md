# API Contract — `/api/v1`

Envelope: success `{ success: true, data, meta? }`, error `{ success: false, error: { code, message, details? } }`.
Lists return `data: T[]` and `meta: { page, pageSize, total, totalPages }`. Money fields are **numbers** (rupees, 2dp) in responses.
Auth: `Authorization: Bearer <accessToken>`; refresh token is an httpOnly cookie (`ag_rt`, path `/api/v1/auth`) → `POST /auth/refresh` (send `withCredentials`).
Private images (custom-art source/preview/final) are returned as **short-lived signed URLs** (`/api/v1/files/private?...`), never permanent.

## Shared shapes

```ts
type Ref = { id: string; name: string; slug: string };
type ArtistMini = { id: string; slug: string; displayName: string; avatarUrl: string | null };

type ArtworkCard = {
  id; slug; title; type; format: 'ORIGINAL'|'PRINT'|'DIGITAL'; status;
  price: number; discountPrice: number | null; currency: string;
  imageUrl: string | null;      // primary large image
  thumbnailUrl: string | null;  // ~640px
  imageWidth: number | null; imageHeight: number | null; // primary image dims (masonry)
  orientation: 'PORTRAIT'|'LANDSCAPE'|'SQUARE'|'PANORAMIC' | null;
  dominantColor: string | null; isCustomizable: boolean; isFeatured: boolean;
  ratingAverage: number; ratingCount: number; available: boolean; // quantity - reserved > 0 (DIGITAL always true)
  artist: ArtistMini; category: Ref | null; style: Ref | null; medium: Ref | null;
};

type ArtworkDetail = ArtworkCard & {
  description; images: { id; url; thumbUrl; width; height; isPrimary; altText }[];
  theme: Ref | null; tags: Ref[]; yearCreated; widthCm; heightCm; depthCm; sku;
  licenseInfo; copyrightInfo; availableQuantity: number; collections: Ref[];
  artist: ArtistMini & { bio; followerCount; acceptsCustomArt: boolean; gallery: { name; slug } | null };
  isWishlisted: boolean; viewCount: number; publishedAt;
};

type ArtistCard = {
  id; slug; displayName; type; avatarUrl; coverImageUrl; bio; city; country;
  followerCount; artworkCount; ratingAverage: number; ratingCount; isFeatured; acceptsCustomArt;
  customArtBasePrice: number | null; styles: Ref[];
};

type GalleryCard = { id; slug; name; tagline; coverImageUrl; artworkCount; artist: ArtistMini };
type CollectionCard = { id; slug; name; description; coverImageUrl; isFeatured; artworkCount; previewImages: string[]; artist: ArtistMini | null };
type TaxonomyItem = { id; name; slug; description?; imageUrl?; artworkCount: number; availableForCustomArt?: boolean };
```

## Auth (`/auth`) — implemented
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | /auth/register | `{fullName,email,phone?,password}` | `{accessToken,user}` |
| POST | /auth/register/artist | customer fields + `{displayName, artistType, bio, description, artistStatement, yearsOfExperience, country, state, city, address, website, socialLinks{instagram,...}, primaryCategoryId, styleIds[], mediumIds[], specializations[], awards[], acceptsCustomArt}` | `{accessToken,user}` (artist status PENDING_APPROVAL) |
| POST | /auth/login | `{email,password}` | `{accessToken,user}` |
| POST | /auth/refresh | cookie | `{accessToken,user}` |
| POST | /auth/logout | cookie | `{loggedOut}` |
| GET | /auth/me | – | `AuthUser {id,email,fullName,roles[],artistId,artistStatus}` |
| POST | /auth/change-password | `{currentPassword,newPassword}` | |

## Catalog (workstream A)
- `GET /home` → `{ banners[{id,title,subtitle,imageUrl,linkUrl}], featuredArtworks, trendingArtworks, newArtworks: ArtworkCard[], featuredArtists, newArtists: ArtistCard[], featuredGalleries: GalleryCard[], popularCollections: CollectionCard[], categories, styles, mediums, themes: TaxonomyItem[], testimonials[{id,rating,body,userName,artworkTitle,artworkSlug,createdAt}], stats{artworks,artists,customers,completedCustomArt}, recentlyViewed: ArtworkCard[], recommended: ArtworkCard[] }` (auth optional; last two empty when anonymous)
- `GET /search/suggest?q=` → `{ artworks[{slug,title,thumbnailUrl}], artists[{slug,displayName,avatarUrl}], categories: Ref[], styles: Ref[] }`
- `GET /categories | /styles | /mediums | /themes` → `TaxonomyItem[]` (`/styles?customArt=true` filters to custom-art styles). ADMIN: `POST /<tax>`, `PATCH /<tax>/:id`, `DELETE /<tax>/:id` (soft: isActive=false if used).
- `GET /artworks` query: `q, category, style, medium, theme (slugs), artist (slug), gallery (slug), color, minPrice, maxPrice, orientation, format, type, size (small|medium|large by longest cm side <40, 40–90, >90), customizable=true, featured=true, sort=newest|price_asc|price_desc|trending|popular, page, pageSize` → `ArtworkCard[]` (public: APPROVED/SOLD_OUT of APPROVED artists only)
- `GET /artworks/:idOrSlug` → `ArtworkDetail` (auth optional; records recently viewed + viewCount)
- `GET /artworks/:id/related` → `{ moreFromArtist: ArtworkCard[], similar: ArtworkCard[] }`
- Seller (ARTIST, APPROVED to submit; drafts allowed while pending): `GET /artists/me/artworks?status=&page=` · `GET /artists/me/artworks/:id` (full incl. private fields except file key; `hasDigitalFile`) · `POST /artworks` (JSON → DRAFT) · `PATCH /artworks/:id` · `DELETE /artworks/:id` (→ ARCHIVED) · `POST /artworks/:id/images` (multipart `images` ≤8) · `DELETE /artworks/:id/images/:imageId` · `PATCH /artworks/:id/images/:imageId/primary` · `POST /artworks/:id/digital-file` (multipart `file`, private) · `POST /artworks/:id/submit` (→ PENDING_REVIEW, needs ≥1 image)
  - artwork body: `{title, description, type, format, categoryId, styleId, mediumId, themeId, tags: string[], yearCreated, widthCm, heightCm, depthCm, orientation, dominantColor, price, discountPrice, quantity, isCustomizable, licenseInfo, copyrightInfo, collectionIds[]}`. Editing an APPROVED artwork's content sends it back to PENDING_REVIEW.
- `GET /artists?q&style&featured&customArt=true&sort=popular|newest|rating&page` → `ArtistCard[]`
- `GET /artists/:slug` → `ArtistCard & { profile{description,artistStatement,yearsOfExperience,website,socialLinks,specializations,awards}, mediums: Ref[], gallery: GalleryCard|null, isFollowing, soldCount, featuredArtworks: ArtworkCard[] }`
- `GET /artists/:slug/artworks?page&sold=true` → `ArtworkCard[]`
- Artist self: `GET /artists/me` (own profile incl. status, approvals history) · `PATCH /artists/me` · `POST /artists/me/avatar` (multipart `image`) · `POST /artists/me/cover` (multipart `image`) · `GET /artists/me/dashboard` → `{ status, counts{draft,pending,approved,rejected,soldOut,total}, followers, totalSales, ordersCount, pendingCustomRequests, earnings{gross,net,pending,available}, recentOrders[], recentRequests[] }`
- `GET /galleries?page` → `GalleryCard[]` · `GET /galleries/:slug` → `GalleryCard & { description, artist: ArtistCard, collections: CollectionCard[], artworks: ArtworkCard[] }` · `PATCH /galleries/me` (ARTIST) · `POST /galleries/me/cover`
- `GET /collections?featured&artist&page` → `CollectionCard[]` · `GET /collections/:slug` → `CollectionCard & { artworks: ArtworkCard[] }` · ARTIST/ADMIN: `GET /artists/me/collections`, `POST /collections {name,description,isPublished,artworkIds[]}`, `PATCH /collections/:id`, `DELETE /collections/:id`, `POST /collections/:id/items {artworkId}`, `DELETE /collections/:id/items/:artworkId`, `POST /collections/:id/cover` (multipart `image`). Artists may only add their own artworks.
- Wishlist (auth): `GET /wishlist` → `{ artworks: ArtworkCard[], artists: ArtistCard[], galleries: GalleryCard[], collections: CollectionCard[] }` · `GET /wishlist/ids` → `{ ARTWORK: string[], ARTIST: string[], GALLERY: string[], COLLECTION: string[] }` · `POST /wishlist {itemType,targetId}` · `DELETE /wishlist/:itemType/:targetId`
- Follows (auth): `POST /follows/:artistId` · `DELETE /follows/:artistId` · `GET /follows` → `ArtistCard[]`
- Reviews: `GET /reviews/artwork/:artworkId?page` → `[{id,rating,title,body,verifiedPurchase,createdAt,user{fullName},images[]}]` + meta.summary · `POST /reviews/artwork/:artworkId {rating,title,body}` (only buyers whose order item is DELIVERED/DIGITAL_AVAILABLE or order COMPLETED) · `GET /reviews/artist/:artistId` · `POST /reviews/artist/:artistId {rating, body}` (must have purchased from artist or completed custom art)
- Users: `GET /users/me` · `PATCH /users/me {fullName, phone}` · `POST /users/me/avatar` · `GET/POST /users/me/addresses` · `PATCH/DELETE /users/me/addresses/:id` · `GET /users/me/recently-viewed`
- Notifications (auth): `GET /notifications?page` · `GET /notifications/unread-count` → `{count}` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all`
- `GET /files/private?k&u&exp&sig` — streams a private file for a valid signature.
- `POST /reports {targetType: ARTWORK|USER|ARTIST|REVIEW, targetId, reason, details}` (auth)

## Custom Art (workstream B)
- `GET /custom-art/artists?styleId=` → `ArtistCard[]` (APPROVED, acceptsCustomArt; style match preferred)
- `POST /custom-art/requests` multipart: `photos` (1–5 images, JPEG/PNG/WebP), fields `artistId, styleId, selectedArtworkId?, title?, instructions, options (JSON string: {background, clothing, colors, text, pose, effects, lighting, theme, other}), requestedDimensions?, requestedFormat (ORIGINAL|PRINT|DIGITAL), budget?`
- `GET /custom-art/requests?as=customer|artist|admin&status=&page=` → `CustomArtSummary[]`:
  `{ id, requestNumber, status, title, requestedFormat, budget, quotedPrice, currency, revisionCount, maxRevisions, createdAt, updatedAt, artist: ArtistMini, customer: {id, fullName}, style: Ref|null, sourceThumbUrl, latestPreviewUrl, paymentStatus: string|null }`
- `GET /custom-art/requests/:id` → summary + `{ instructions, options, requestedDimensions, artistMessage, customerMessage, dueDate, selectedArtwork: ArtworkCard|null, images[{id,kind,url,createdAt,isAiGenerated}], revisions[{revisionNumber,feedback,createdAt}], statusHistory[{fromStatus,toStatus,actorRole,note,createdAt}], allowedActions: string[], order: {id, orderNumber, paymentStatus, status}|null, inCart: boolean }`
  - `allowedActions` ⊆ `review, accept, reject, start, preview, revision, approve, addToCart, final, complete, cancel`
- `PATCH /:id/review` (artist) · `PATCH /:id/accept {quotedPrice, artistMessage?, dueDate?, maxRevisions?}` · `PATCH /:id/reject {reason}` · `PATCH /:id/start` · `POST /:id/preview` (multipart `images` ≤4 + `message`) · `POST /:id/revision {feedback}` (customer) · `PATCH /:id/approve {message?}` (customer) · `POST /:id/final` (multipart `images` ≤4 + `message`; requires an active order) · `PATCH /:id/complete` (customer/admin) · `PATCH /:id/cancel {reason}`
  (all under `/custom-art/requests`)

## Commerce (workstream B)
- `GET /cart` → `{ items[{id, quantity, unitPrice, lineTotal, available, artwork: ArtworkCard|null, customArt: {id, requestNumber, title, quotedPrice, artist: ArtistMini, previewUrl}|null}], subtotal, shippingFee, total, currency, itemCount, requiresShipping }`
- `POST /cart/items {artworkId?|customArtRequestId?, quantity?}` · `PATCH /cart/items/:id {quantity}` · `DELETE /cart/items/:id`
- `GET /payments/methods` → `[{ method:'COD'|'MANUAL', label, description, available, reason? }]` (COD only when every item ships physically)
- `POST /orders/checkout {addressId? , shippingAddress?{fullName,phone,line1,line2,city,state,postalCode,country}, paymentMethod, notes?}` → `OrderDetail`
- `GET /orders?page` → `[{id, orderNumber, status, paymentStatus, paymentMethod, total, currency, placedAt, itemCount, previewImage}]`
- `GET /orders/:id` → `{ ...summary, subtotal, shippingFee, shippingAddress, notes, items[{id, titleSnapshot, imageSnapshot, format, fulfillmentType, fulfillmentStatus, unitPrice, quantity, lineTotal, artist: ArtistMini, artworkSlug, customArtRequestId, canReview}], shipments[{artist: ArtistMini, carrier, trackingNumber, status, shippedAt, deliveredAt}], payments[{method,status,amount,createdAt}], downloads[{id, orderItemId, title, remaining, expiresAt}] }`
- `POST /orders/:id/cancel` (customer, only PENDING/CONFIRMED and unpaid)
- `POST /downloads/:accessId/link` → `{ url, expiresInSeconds }` (counts a download; enforces limit/expiry)
- Seller: `GET /artists/me/orders?status&page` → `[{orderId, orderNumber, placedAt, status, paymentStatus, paymentMethod, customer{fullName}, shippingAddress|null, items[{id,titleSnapshot,imageSnapshot,format,fulfillmentType,fulfillmentStatus,quantity,lineTotal,artistAmount}], shipment|null}]` · `PATCH /artists/me/orders/:orderId/shipment {carrier, method, trackingNumber, packagingInfo, status}` · `PATCH /artists/me/order-items/:id/fulfillment {status}`
- `GET /artists/me/earnings` → `{ totals{grossSales, commission, net, pending, available, settled, customArtNet}, monthly[{month:'2026-09', gross, net, orders}], ledger[{id,type,status,amount,description,createdAt}], settlements[{id,amount,status,reference,createdAt,completedAt}] }`

## Admin (workstream B) — role ADMIN
- `GET /admin/dashboard` → `{ counts{artists, pendingArtists, customers, artworks, publishedArtworks, pendingArtworks, orders, customRequests, openReports}, revenue{gross, commission, payouts}, recentOrders[], pendingArtists[], pendingArtworks[] }`
- `GET /admin/users?q&role&status&page` · `PATCH /admin/users/:id/status {status, reason}` (deleted accounts cannot be reactivated)
- `POST /admin/users {role: CUSTOMER|ARTIST|ADMIN, fullName, email, phone?, password, displayName (artist), artistType, bio, city, state, country, acceptsCustomArt, approveNow}` → 201; artists get ARTIST+CUSTOMER roles, profile and gallery; approved immediately unless `approveNow=false`. Audited.
- `DELETE /admin/users/:id {reason}` → anonymised soft delete: status DELETED, PII removed (email freed), sessions revoked, addresses/cart/follows removed; artists set INACTIVE with artworks ARCHIVED; open custom-art requests cancelled (other party notified). Orders, payments, commissions and ledger are kept. Cannot delete yourself or the last active admin. Audited.
- `GET /admin/artists?status&q&page` · `GET /admin/artists/:id` · `PATCH /admin/artists/:id/status {status, reason}` · `PATCH /admin/artists/:id/featured {isFeatured}` · `PATCH /admin/artists/:id/commission {percentage|null}`
- `GET /admin/artworks?status&q&artistId&page` · `PATCH /admin/artworks/:id/moderate {action: APPROVE|REJECT|SUSPEND|RESTORE|ARCHIVE, reason}` · `PATCH /admin/artworks/:id/featured {isFeatured}`
- `GET /admin/orders?status&paymentStatus&q&page` · `GET /admin/orders/:id` · `PATCH /admin/orders/:id/status {status}`
- `GET /admin/payments?status&page` · `PATCH /admin/payments/:id/confirm {reference?}` · `PATCH /admin/payments/:id/fail {reason}`
- `GET /admin/commissions` · `POST /admin/commissions {scope, targetId?, percentage}` · `PATCH /admin/commissions/:id {percentage,isActive}` · `DELETE /admin/commissions/:id`
- `GET /admin/settlements?status&artistId` · `GET /admin/settlements/balances` → `[{artist: ArtistMini, available, pending}]` · `POST /admin/settlements {artistId, method, reference?, note?}` (settles full available balance) · `PATCH /admin/settlements/:id/complete {reference}`
- `GET /admin/reviews?status&page` · `PATCH /admin/reviews/:kind(artwork|artist)/:id {status}`
- `GET /admin/reports?status&page` · `PATCH /admin/reports/:id {status, resolution}`
- `GET|POST /admin/banners` · `PATCH|DELETE /admin/banners/:id` · `POST /admin/banners/:id/image` (multipart `image`)
- `GET /admin/settings` · `PUT /admin/settings/:key {value}`
- `GET /admin/audit-logs?entityType&actorId&action&page`
- Custom art for admin: `GET /custom-art/requests?as=admin`

## Site configuration (theme, homepage layout, hero carousel, content)
- `GET /site-config` (public) → complete `SiteConfig` (defaults merged; schema: `backend/src/modules/site-config/site-config.schema.ts`).
- `PUT /admin/site-config` (ADMIN) full config → saved config. Hex colours only; links must be `/path`, `https://` or `mailto:` (no `javascript:`/`data:`). Audited with the list of changed sections.
- `POST /admin/site-config/reset` (ADMIN) → defaults.
- `homeSections` order = homepage order; unknown/duplicate ids are dropped and missing ones appended.
- The generic `PUT /admin/settings/:key` refuses `site.config`.

## Analytics — ADMIN
- `GET /analytics/overview?from&to&artistId&categoryId` → `{ totals{artists, customers, artworks, publishedArtworks, pendingArtworks, orders, grossSales, platformCommission, artistPayouts, customRequests, completedCustomArt}, salesByDay[{date, gross, commission, orders}], topStyles[{name,count}], topCategories[{name,count}], topArtists[{id,displayName,gross}], trendingArtworks[{id,slug,title,views,sales}], topCustomStyles[{name,count}] }`
- `GET /analytics/export?type=sales|orders|artists|custom-art&from&to` → CSV download
