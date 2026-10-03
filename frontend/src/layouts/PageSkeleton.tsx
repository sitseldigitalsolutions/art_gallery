import { motion } from 'motion/react';

/** Shown inside the normal layout while a page's code loads — never a blank white screen. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="relative h-72 overflow-hidden bg-ink">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand/40 blur-3xl" aria-hidden />
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-magenta/25 blur-3xl" aria-hidden />
        <div className="container-x relative pt-32">
          <div className="h-10 w-64 rounded-xl bg-white/10" />
          <div className="mt-4 h-4 w-96 max-w-full rounded bg-white/10" />
        </div>
      </div>
      <div className="container-x grid grid-cols-2 gap-5 py-10 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-light to-gray-100" style={{ height: [280, 220, 320, 250][i % 4] }}>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
