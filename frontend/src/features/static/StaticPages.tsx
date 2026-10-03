import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Brush, Lock, Palette, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { PageHero, Reveal } from '@/components/ui';

export function AboutPage() {
  const values = [
    { icon: Brush, title: 'Artists first', text: 'Every piece is listed by the artist who made it. Artists keep the majority of every sale.' },
    { icon: Sparkles, title: 'Your story, painted', text: 'Commission a real artist to turn a cherished photo into a painting, with previews and revisions.' },
    { icon: ShieldCheck, title: 'Curated & moderated', text: 'Artists and artworks are reviewed before they appear in the gallery.' },
    { icon: Lock, title: 'Private by design', text: 'Photos you upload for commissions are never public and are shared only with your chosen artist.' },
    { icon: Palette, title: 'Every style', text: 'From Madhubani and mandala to pop art and anime — discover art across traditions.' },
    { icon: Users, title: 'A community', text: 'Follow artists, save favourites and be first to see new work.' },
  ];
  return (
    <>
      <PageHero title="About MyMoons Gallery" subtitle="An online gallery for independent artists — and for the stories people want told in paint." />
      <div className="container-x py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06} className="card p-6">
              <v.icon className="mb-3 text-brand" />
              <h3 className="font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{v.text}</p>
            </Reveal>
          ))}
        </div>
        <section id="privacy" className="mx-auto mt-20 max-w-3xl space-y-4 text-sm leading-relaxed text-gray-600">
          <h2 className="section-title">Privacy</h2>
          <p>
            We collect only what we need to run the gallery: your account details, orders, and the photos you upload for custom artwork. Uploaded photos are
            stored privately, stripped of location metadata, and accessible only through short-lived secure links issued to you, the artist you choose, and our
            moderation team.
          </p>
          <p>We do not sell your data. You can ask us to delete your account and uploaded photos at any time by contacting us.</p>
        </section>
        <div className="mt-16 flex justify-center gap-3">
          <Link to="/gallery" className="btn-outline">
            Explore Gallery
          </Link>
          <Link to="/register/artist" className="btn-brand">
            Join as an artist
          </Link>
        </div>
      </div>
    </>
  );
}

export function NotFoundPage({ code = '404', message = 'This room of the gallery doesn’t exist.' }: { code?: string; message?: string }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink text-center text-white">
      <div className="hero-fallback absolute inset-0 opacity-40" aria-hidden />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative px-6">
        <p className="font-script text-9xl">{code}</p>
        <p className="mt-4 text-white/70">{message}</p>
        <Link to="/" className="btn-brand mt-8">
          Back to the gallery
        </Link>
      </motion.div>
    </section>
  );
}

export function ForbiddenPage() {
  return <NotFoundPage code="403" message="You don’t have access to this area." />;
}
