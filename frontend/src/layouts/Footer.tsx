import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FacebookFilled, InstagramFilled, PinterestFilled, WhatsAppOutlined, XOutlined, YoutubeFilled } from '@ant-design/icons';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { catalogApi } from '@/features/artworks/api';
import { SmartLink, useSiteConfig } from '@/features/site/SiteConfigContext';
import type { SiteConfig } from '@/lib/siteConfig';
import { Logo } from './Navbar';

const SOCIAL: Array<{ key: keyof SiteConfig['social']; label: string; icon: ReactNode }> = [
  { key: 'instagram', label: 'Instagram', icon: <InstagramFilled /> },
  { key: 'facebook', label: 'Facebook', icon: <FacebookFilled /> },
  { key: 'twitter', label: 'X (Twitter)', icon: <XOutlined /> },
  { key: 'youtube', label: 'YouTube', icon: <YoutubeFilled /> },
  { key: 'pinterest', label: 'Pinterest', icon: <PinterestFilled /> },
  { key: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppOutlined /> },
];

export function Footer() {
  const { config } = useSiteConfig();
  const { branding, contact, social, footer } = config;
  const categories = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: () => catalogApi.taxonomy('categories'), staleTime: 600_000 });
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const socials = SOCIAL.filter((s) => social[s.key]);

  return (
    <footer className="relative overflow-hidden bg-ink text-white/70">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-magenta/10 blur-3xl" aria-hidden />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          {footer.newsletterEnabled && contact.email && (
            <>
              <p className="mb-3 text-sm text-white">Sign up for new arrivals, artist drops and exclusive previews</p>
              {subscribed ? (
                <p className="rounded-full bg-white/10 px-5 py-3 text-sm text-white">
                  Thank you! We will open your mail app so you can confirm your subscription.
                </p>
              ) : (
                <form
                  className="flex max-w-md items-center rounded-full bg-white p-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!/^\S+@\S+\.\S+$/.test(email)) return;
                    // No newsletter backend yet: hand off to the user's mail client honestly.
                    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Newsletter subscription')}&body=${encodeURIComponent(`Please subscribe ${email} to the ${branding.siteName} newsletter.`)}`;
                    setSubscribed(true);
                  }}
                >
                  <label htmlFor="newsletter" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none"
                  />
                  <button className="btn-brand !py-2">Submit</button>
                </form>
              )}
            </>
          )}
          <div className={footer.newsletterEnabled && contact.email ? 'mt-10' : ''}>
            <Logo />
            {footer.about && (
              <>
                <h4 className="mt-6 text-sm font-semibold text-white">About</h4>
                <p className="mt-2 max-w-md whitespace-pre-line text-sm leading-relaxed">{footer.about}</p>
              </>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <h4 className="mb-4 text-sm font-semibold text-white">Categories</h4>
          <ul className="space-y-2 text-sm">
            {(categories.data ?? []).slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to={`/gallery?category=${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/categories" className="text-brand-light hover:text-white">
                All categories →
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <h4 className="mb-4 text-sm font-semibold text-white">For Artists</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/register/artist" className="hover:text-white">
                Join as an Artist
              </Link>
            </li>
            <li>
              <Link to="/login?next=/seller" className="hover:text-white">
                Artist Login
              </Link>
            </li>
            <li>
              <Link to="/galleries" className="hover:text-white">
                Galleries
              </Link>
            </li>
            <li>
              <Link to="/create-your-art" className="hover:text-white">
                Custom Photo-to-Art
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <h4 className="mb-4 text-sm font-semibold text-white">Contact us</h4>
          <ul className="space-y-3 text-sm">
            {contact.address && (
              <li className="flex items-center gap-2">
                <MapPin size={15} className="shrink-0" /> {contact.address}
              </li>
            )}
            {contact.phone && (
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0" />
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="hover:text-white">
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.hours && (
              <li className="flex items-center gap-2">
                <Clock size={15} className="shrink-0" /> {contact.hours}
              </li>
            )}
            {contact.email && (
              <li className="flex items-center gap-2">
                <Mail size={15} className="shrink-0" />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-white">
                  {contact.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} {branding.siteName}. {footer.copyright}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about#privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            {socials.length > 0 && (
              <span className="flex items-center gap-3 text-base">
                {socials.map((s) => (
                  <SmartLink key={s.key} href={social[s.key]} aria-label={s.label} className="transition hover:-translate-y-0.5 hover:text-white">
                    {s.icon}
                  </SmartLink>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
