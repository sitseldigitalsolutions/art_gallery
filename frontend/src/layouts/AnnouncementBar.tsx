import { AnimatePresence, motion } from 'motion/react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { SmartLink, useSiteConfig } from '@/features/site/SiteConfigContext';

const TONES = {
  brand: 'bg-gradient-to-r from-brand via-magenta to-brand text-white',
  dark: 'bg-ink-3 text-white',
  accent: 'bg-gradient-to-r from-sunset to-magenta text-white',
} as const;

const DISMISS_KEY = 'announcement-dismissed';

/** Admin-configured strip above the navbar; dismissal is remembered for the browser session per message. */
export function AnnouncementBar() {
  const { config } = useSiteConfig();
  const a = config.announcement;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === a.text;
    } catch {
      return false;
    }
  });
  const visible = a.enabled && !!a.text && !dismissed;

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={clsx('relative z-[55] overflow-hidden bg-[length:200%_100%] animate-gradient', TONES[a.tone])}
          role="region"
          aria-label="Announcement"
        >
          <div className="container-x flex items-center justify-center gap-2 py-2 pr-10 text-center text-xs font-semibold sm:text-sm">
            <Megaphone size={15} className="shrink-0" aria-hidden />
            {a.href ? (
              <SmartLink href={a.href} className="underline-offset-4 hover:underline">
                {a.text} →
              </SmartLink>
            ) : (
              <span>{a.text}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              try {
                sessionStorage.setItem(DISMISS_KEY, a.text);
              } catch {
                /* storage unavailable: dismiss for this page view only */
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-80 transition hover:bg-white/15 hover:opacity-100"
            aria-label="Dismiss announcement"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
