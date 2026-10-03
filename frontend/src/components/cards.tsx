import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { money, compact, initials, plural } from '@/lib/format';
import type { ArtistCard, ArtworkCard, CollectionCard, GalleryCard, WishlistItemType } from '@/lib/types';
import { useWishlist } from '@/features/wishlist/useWishlist';
import { ArtImage } from './ui';

export function HeartButton({ type, id, className, light }: { type: WishlistItemType; id: string; className?: string; light?: boolean }) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(type, id);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.8 }}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(type, id);
      }}
      className={clsx(
        'grid h-9 w-9 place-items-center rounded-full backdrop-blur transition',
        light ? 'bg-white/90 text-ink hover:bg-white' : 'bg-black/30 text-white hover:bg-black/50',
        className,
      )}
    >
      <Heart size={17} className={clsx(saved && 'fill-magenta text-magenta')} />
    </motion.button>
  );
}

export function PriceTag({ price, discountPrice, currency, className }: { price: number; discountPrice: number | null; currency: string; className?: string }) {
  const hasDiscount = discountPrice !== null && discountPrice < price;
  return (
    <span className={clsx('inline-flex items-baseline gap-2', className)}>
      <span className="font-semibold" data-testid="price">
        {money(hasDiscount ? discountPrice : price, currency)}
      </span>
      {hasDiscount && (
        <s className="text-xs opacity-60" data-testid="original-price">
          {money(price, currency)}
        </s>
      )}
    </span>
  );
}

/** Gallery-style artwork tile: image first, details revealed on hover. */
export function ArtworkTile({ artwork, variant = 'masonry', priority }: { artwork: ArtworkCard; variant?: 'masonry' | 'square'; priority?: boolean }) {
  const ratio =
    variant === 'square' ? '4 / 5' : artwork.imageWidth && artwork.imageHeight ? `${artwork.imageWidth} / ${artwork.imageHeight}` : '4 / 5';
  return (
    <motion.article whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} className="group relative">
      <Link to={`/artworks/${artwork.slug}`} className="block overflow-hidden rounded-2xl shadow-[0_12px_40px_-18px_rgba(11,10,18,.45)]">
        <ArtImage
          src={artwork.thumbnailUrl ?? artwork.imageUrl}
          alt={`${artwork.title} by ${artwork.artist.displayName}`}
          aspect={ratio}
          eager={priority}
          imgClassName="transition-transform duration-[1.2s] ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 translate-y-3 p-4 text-white transition-transform duration-500 group-hover:translate-y-0">
          <div className="mb-2 flex flex-wrap gap-1.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            {artwork.category && <span className="rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{artwork.category.name}</span>}
            {artwork.isCustomizable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                <Sparkles size={10} /> Customizable
              </span>
            )}
          </div>
          <h3 className="line-clamp-1 text-base font-semibold">{artwork.title}</h3>
          <p className="text-xs text-white/70">{artwork.artist.displayName}</p>
          <div className="mt-2 flex items-center justify-between">
            <PriceTag price={artwork.price} discountPrice={artwork.discountPrice} currency={artwork.currency} className="text-sm" />
            {!artwork.available ? (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase">Sold</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                Order <ArrowRight size={12} />
              </span>
            )}
          </div>
        </div>
      </Link>
      <HeartButton type="ARTWORK" id={artwork.id} className="absolute right-3 top-3" />
    </motion.article>
  );
}

export function Avatar({ src, name, size = 48, className }: { src: string | null | undefined; name: string; size?: number; className?: string }) {
  return src ? (
    <img src={src} alt={name} width={size} height={size} className={clsx('shrink-0 rounded-full object-cover', className)} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-label={name}
      className={clsx('grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-magenta font-semibold text-white', className)}
      style={{ width: size, height: size, fontSize: size / 2.8 }}
    >
      {initials(name)}
    </span>
  );
}

export function ArtistPortrait({ artist }: { artist: ArtistCard }) {
  return (
    <motion.article whileHover={{ y: -6 }} className="group">
      <Link to={`/artists/${artist.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl">
          <ArtImage
            src={artist.avatarUrl ?? artist.coverImageUrl}
            alt={artist.displayName}
            aspect="4 / 5"
            imgClassName="transition-transform duration-[1.2s] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 flex translate-y-4 items-center justify-between p-4 text-xs text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-flex items-center gap-1">
              <Users size={13} /> {compact(artist.followerCount)} followers
            </span>
            <span>{artist.artworkCount} works</span>
          </div>
          {artist.acceptsCustomArt && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand">
              <Sparkles size={10} /> Custom art
            </span>
          )}
        </div>
        <h3 className="mt-3 font-medium text-ink">{artist.displayName}</h3>
        {(artist.city || artist.styles.length > 0) && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            {artist.city && (
              <>
                <MapPin size={12} /> {artist.city}
                {artist.styles.length > 0 && ' · '}
              </>
            )}
            {artist.styles.slice(0, 2).map((s) => s.name).join(', ')}
          </p>
        )}
      </Link>
    </motion.article>
  );
}

export function CollectionTile({ collection }: { collection: CollectionCard }) {
  const cover = collection.coverImageUrl ?? collection.previewImages[0] ?? null;
  return (
    <motion.article whileHover={{ y: -6 }} className="group relative">
      <Link to={`/collections/${collection.slug}`} className="block overflow-hidden rounded-2xl">
        <ArtImage src={cover} alt={collection.name} aspect="1 / 1" imgClassName="transition-transform duration-[1.2s] group-hover:scale-110" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="text-lg font-semibold">{collection.name}</h3>
          <p className="text-xs text-white/70">
            {plural(collection.artworkCount, 'artwork')}{collection.artist ? ` · ${collection.artist.displayName}` : ' · Curated'}
          </p>
          <span className="mt-3 inline-flex translate-y-2 items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            Details <ArrowRight size={12} />
          </span>
        </div>
      </Link>
      <HeartButton type="COLLECTION" id={collection.id} className="absolute right-3 top-3" />
    </motion.article>
  );
}

export function GalleryTile({ gallery }: { gallery: GalleryCard }) {
  return (
    <motion.article whileHover={{ y: -6 }} className="group">
      <Link to={`/galleries/${gallery.slug}`} className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <ArtImage src={gallery.coverImageUrl} alt={gallery.name} aspect="16 / 10" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
        <div className="flex items-center gap-3 p-4">
          <Avatar src={gallery.artist.avatarUrl} name={gallery.artist.displayName} size={40} />
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-ink">{gallery.name}</h3>
            <p className="truncate text-xs text-gray-500">{gallery.tagline ?? plural(gallery.artworkCount, 'artwork')}</p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function ArtworkMasonry({ artworks }: { artworks: ArtworkCard[] }) {
  return (
    <div className="masonry">
      {artworks.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 200px 0px' }}
          transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
        >
          <ArtworkTile artwork={a} priority={i < 4} />
        </motion.div>
      ))}
    </div>
  );
}
