import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import HomePage from '@/features/home/HomePage';
import GalleryPage from '@/features/artworks/GalleryPage';
import ArtworkDetailPage from '@/features/artworks/ArtworkDetailPage';
import { ArtistDetailPage, ArtistsPage } from '@/features/artists/ArtistsPages';
import { CategoriesPage, CollectionDetailPage, CollectionsPage, GalleriesPage, GalleryDetailPage } from '@/features/galleries/GalleriesPages';
import CreateYourArtPage from '@/features/custom-art/CreateYourArtPage';
import { MyCustomArtDetail, MyCustomArtList } from '@/features/custom-art/MyCustomArtPages';
import CartPage from '@/features/cart/CartPage';
import CheckoutPage from '@/features/checkout/CheckoutPage';
import { OrderDetailPage, OrdersList } from '@/features/orders/OrdersPages';
import WishlistPage from '@/features/wishlist/WishlistPage';
import { AccountHome, AccountLayout } from '@/features/account/AccountPages';
import { ArtistRegisterPage, LoginPage, RegisterPage } from '@/features/auth/AuthPages';
import { AboutPage, ForbiddenPage, NotFoundPage } from '@/features/static/StaticPages';
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
