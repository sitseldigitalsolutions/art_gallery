import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import HomePage from '@/features/home/HomePage';
import { pageImports } from './prefetch';
// Public pages load on demand (and are prefetched in the background); the homepage stays in the main bundle.
const named = <K extends keyof typeof pageImports, N extends string>(key: K, name: N) =>
  lazy(() => pageImports[key]().then((m) => ({ default: (m as unknown as Record<N, ComponentType>)[name] })));
const GalleryPage = lazy(pageImports.gallery);
const ArtworkDetailPage = lazy(pageImports.artwork);
const ArtistsPage = named('artists', 'ArtistsPage');
const ArtistDetailPage = named('artists', 'ArtistDetailPage');
const CategoriesPage = named('galleries', 'CategoriesPage');
const CollectionDetailPage = named('galleries', 'CollectionDetailPage');
const CollectionsPage = named('galleries', 'CollectionsPage');
const GalleriesPage = named('galleries', 'GalleriesPage');
const GalleryDetailPage = named('galleries', 'GalleryDetailPage');
const CreateYourArtPage = lazy(pageImports.createArt);
const MyCustomArtDetail = named('myCustomArt', 'MyCustomArtDetail');
const MyCustomArtList = named('myCustomArt', 'MyCustomArtList');
const CartPage = lazy(pageImports.cart);
const CheckoutPage = lazy(pageImports.checkout);
const OrderDetailPage = named('orders', 'OrderDetailPage');
const OrdersList = named('orders', 'OrdersList');
const WishlistPage = lazy(pageImports.wishlist);
const AccountHome = named('account', 'AccountHome');
const AccountLayout = named('account', 'AccountLayout');
const ArtistRegisterPage = named('auth', 'ArtistRegisterPage');
const LoginPage = named('auth', 'LoginPage');
const RegisterPage = named('auth', 'RegisterPage');
const AboutPage = named('static', 'AboutPage');
const ForbiddenPage = named('static', 'ForbiddenPage');
const NotFoundPage = named('static', 'NotFoundPage');
import { FullPageLoader, RequireAuth, RequireRole } from './guards';

// Dashboards (Ant Design + charts) are split into their own chunks.
const SellerLayout = lazy(() => import('@/features/seller/SellerLayout'));
const SellerOverview = lazy(() => import('@/features/seller/SellerOverview'));
const SellerPublicRedirect = lazy(() => import('@/features/seller/SellerOverview').then((m) => ({ default: m.SellerPublicRedirect })));
const SellerArtworks = lazy(() => import('@/features/seller/SellerArtworks'));
const ArtworkEditor = lazy(() => import('@/features/seller/ArtworkEditor'));
const sellerPage = (name: 'SellerCollections' | 'SellerCustomArt' | 'SellerOrders' | 'SellerEarnings' | 'SellerProfile') =>
  lazy(() => import('@/features/seller/SellerPages').then((m) => ({ default: m[name] })));
const SellerCollections = sellerPage('SellerCollections');
const SellerCustomArt = sellerPage('SellerCustomArt');
const SellerOrders = sellerPage('SellerOrders');
const SellerEarnings = sellerPage('SellerEarnings');
const SellerProfile = sellerPage('SellerProfile');

const AdminLayout = lazy(() => import('@/features/admin/AdminLayout'));
const AdminOverview = lazy(() => import('@/features/admin/AdminOverview'));
const AdminAppearance = lazy(() => import('@/features/admin/AdminAppearance'));
const mod = (name: 'AdminArtists' | 'AdminArtworks' | 'AdminUsers' | 'AdminCustomArt' | 'AdminOrders' | 'AdminPayments') =>
  lazy(() => import('@/features/admin/AdminModeration').then((m) => ({ default: m[name] })));
const content = (name: 'AdminCommissions' | 'AdminSettlements' | 'AdminReviews' | 'AdminReports' | 'AdminTaxonomy' | 'AdminBanners' | 'AdminSettings' | 'AdminAuditLogs') =>
  lazy(() => import('@/features/admin/AdminContent').then((m) => ({ default: m[name] })));
const AdminArtists = mod('AdminArtists');
const AdminArtworks = mod('AdminArtworks');
const AdminUsers = mod('AdminUsers');
const AdminCustomArt = mod('AdminCustomArt');
const AdminOrders = mod('AdminOrders');
const AdminPayments = mod('AdminPayments');
const AdminCommissions = content('AdminCommissions');
const AdminSettlements = content('AdminSettlements');
const AdminReviews = content('AdminReviews');
const AdminReports = content('AdminReports');
const AdminTaxonomy = content('AdminTaxonomy');
const AdminBanners = content('AdminBanners');
const AdminSettings = content('AdminSettings');
const AdminAuditLogs = content('AdminAuditLogs');

const auth = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>;

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="artworks/:slug" element={<ArtworkDetailPage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="artists/:slug" element={<ArtistDetailPage />} />
          <Route path="galleries" element={<GalleriesPage />} />
          <Route path="galleries/:slug" element={<GalleryDetailPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:slug" element={<CollectionDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="create-your-art" element={<CreateYourArtPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="cart" element={auth(<CartPage />)} />
          <Route path="checkout" element={auth(<CheckoutPage />)} />
          <Route element={auth(<AccountLayout />)}>
            <Route path="account" element={<AccountHome />} />
            <Route path="account/orders" element={<OrdersList />} />
            <Route path="account/orders/:id" element={<OrderDetailPage />} />
            <Route path="account/custom-art" element={<MyCustomArtList />} />
            <Route path="account/custom-art/:id" element={<MyCustomArtDetail />} />
            <Route path="wishlist" element={<WishlistPage />} />
          </Route>
        </Route>

        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="register/artist" element={<ArtistRegisterPage />} />

        <Route
          path="seller"
          element={
            <RequireRole role="ARTIST">
              <SellerLayout />
            </RequireRole>
          }
        >
          <Route index element={<SellerOverview />} />
          <Route path="artworks" element={<SellerArtworks />} />
          <Route path="artworks/new" element={<ArtworkEditor />} />
          <Route path="artworks/:id" element={<ArtworkEditor />} />
          <Route path="collections" element={<SellerCollections />} />
          <Route path="custom-art" element={<SellerCustomArt />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="earnings" element={<SellerEarnings />} />
          <Route path="profile" element={<SellerProfile />} />
          <Route path="preview" element={<SellerPublicRedirect />} />
        </Route>

        <Route
          path="admin"
          element={
            <RequireRole role="ADMIN">
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="artists" element={<AdminArtists />} />
          <Route path="artworks" element={<AdminArtworks />} />
          <Route path="custom-art" element={<AdminCustomArt />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="commissions" element={<AdminCommissions />} />
          <Route path="settlements" element={<AdminSettlements />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="taxonomy" element={<AdminTaxonomy />} />
          <Route path="appearance" element={<AdminAppearance />} />
          <Route path="settings/site" element={<AdminAppearance />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        <Route path="forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
