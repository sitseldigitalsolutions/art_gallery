/**
 * Lazily-loaded public pages. The same import functions are used by the router (React.lazy)
 * and by the background prefetch, so each page chunk is downloaded only once.
 */
export const pageImports = {
  gallery: () => import('@/features/artworks/GalleryPage'),
  artwork: () => import('@/features/artworks/ArtworkDetailPage'),
  artists: () => import('@/features/artists/ArtistsPages'),
  galleries: () => import('@/features/galleries/GalleriesPages'),
  createArt: () => import('@/features/custom-art/CreateYourArtPage'),
  myCustomArt: () => import('@/features/custom-art/MyCustomArtPages'),
  cart: () => import('@/features/cart/CartPage'),
  checkout: () => import('@/features/checkout/CheckoutPage'),
  orders: () => import('@/features/orders/OrdersPages'),
  wishlist: () => import('@/features/wishlist/WishlistPage'),
  account: () => import('@/features/account/AccountPages'),
  auth: () => import('@/features/auth/AuthPages'),
  static: () => import('@/features/static/StaticPages'),
};

// Most visited first.
const PREFETCH_ORDER: Array<keyof typeof pageImports> = ['gallery', 'artwork', 'artists', 'galleries', 'createArt', 'auth', 'static', 'cart', 'wishlist'];

let started = false;

/** Download page chunks in the background once the browser is idle (skipped on data-saver connections). */
export function prefetchPublicPages() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData || conn?.effectiveType === '2g') return;
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(cb) : setTimeout(cb, 1500);
  let i = 0;
  const next = () => {
    const key = PREFETCH_ORDER[i++];
    if (!key) return;
    pageImports[key]()
      .catch(() => undefined)
      .finally(() => idle(next));
  };
  setTimeout(() => idle(next), 1000);
}
