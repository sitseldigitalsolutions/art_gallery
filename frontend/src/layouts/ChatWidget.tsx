import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useSiteConfig } from '@/features/site/SiteConfigContext';

/** "Chat with us" pill. There is no live-chat backend, so messages are handed to the visitor's mail client. */
export function ChatWidget() {
  const { config } = useSiteConfig();
  const contactEmail = config.contact.email;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-3xl bg-white shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Message from ${name || 'a visitor'}`)}&body=${encodeURIComponent(message)}`;
              setOpen(false);
            }}
          >
            <div className="bg-gradient-to-r from-brand to-magenta p-4 text-white">
              <p className="font-semibold">Talk to our art team</p>
              <p className="text-xs text-white/80">We usually reply within a day.</p>
            </div>
            <div className="space-y-3 p-4">
              <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
              <textarea
                className="input min-h-24"
                required
                placeholder="How can we help? Ask about an artwork, a custom portrait, shipping…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-label="Message"
              />
              <button className="btn-brand w-full">
                <Send size={15} /> Send via email
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-xl ring-1 ring-black/5"
      >
        {open ? <X size={16} /> : <MessageCircle size={16} className="text-brand" />}
        Chat with us
      </motion.button>
    </div>
  );
}
