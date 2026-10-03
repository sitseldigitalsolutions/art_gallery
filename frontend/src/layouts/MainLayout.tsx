import { motion } from 'motion/react';
import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChatWidget } from './ChatWidget';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { PageSkeleton } from './PageSkeleton';
import { useMotionPrefs, useSiteConfig } from '@/features/site/SiteConfigContext';
import { prefetchPublicPages } from '@/routes/prefetch';

export function MainLayout() {
  const location = useLocation();
  const { config } = useSiteConfig();
  const motionPrefs = useMotionPrefs();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  // After the first page is interactive, quietly download the other public pages so navigation is instant.
  useEffect(() => prefetchPublicPages(), []);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Navbar />
      {/* No exit animation: the new page renders immediately (an exit fade made pages flash blank). */}
      <motion.main
        id="main"
        key={location.pathname}
        initial={motionPrefs.pageTransitions ? { opacity: 0.4, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionPrefs.pageTransitions ? 0.3 : 0, ease: 'easeOut' }}
        className="flex-1"
      >
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </motion.main>
      <Footer />
      {config.footer.showChatWidget && config.contact.email && <ChatWidget />}
    </div>
  );
}

/** Pages without a dark hero get a dark spacer so the transparent navbar stays legible. */
export function NavSpacer() {
  return <div className="h-20 bg-ink" aria-hidden />;
}
