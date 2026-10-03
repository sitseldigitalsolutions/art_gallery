import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChatWidget } from './ChatWidget';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { useMotionPrefs, useSiteConfig } from '@/features/site/SiteConfigContext';

export function MainLayout() {
  const location = useLocation();
  const { config } = useSiteConfig();
  const motionPrefs = useMotionPrefs();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          id="main"
          key={location.pathname}
          initial={motionPrefs.pageTransitions ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={motionPrefs.pageTransitions ? { opacity: 0, y: -8 } : { opacity: 1 }}
          transition={{ duration: motionPrefs.pageTransitions ? 0.35 : 0 }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      {config.footer.showChatWidget && config.contact.email && <ChatWidget />}
    </div>
  );
}

/** Pages without a dark hero get a dark spacer so the transparent navbar stays legible. */
export function NavSpacer() {
  return <div className="h-20 bg-ink" aria-hidden />;
}
