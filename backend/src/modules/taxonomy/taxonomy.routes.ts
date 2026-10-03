import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { isAdmin } from '../../middleware/authenticate.js';
import { audit } from '../../shared/audit.js';
import { notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { parse } from '../../shared/validation.js';
import { publicArtworkWhere } from '../../shared/serializers.js';
import { slugify } from '../../utils/slug.js';

/**
 * Categories, styles, mediums and themes share one generic implementation.
 * Public GET lists active items with public artwork counts; ADMIN manages them.
 */
type Kind = 'categories' | 'styles' | 'mediums' | 'themes';

// Prisma delegates differ slightly per model; a narrow structural type keeps this generic and type-safe enough.
interface Delegate {
  findMany(args: unknown): Promise<Array<Record<string, unknown> & { _count?: { artworks: number } }>>;
  findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  create(args: unknown): Promise<Record<string, unknown> & { id: string }>;
  update(args: unknown): Promise<Record<string, unknown> & { id: string }>;
  delete(args: unknown): Promise<unknown>;
}

const delegates: Record<Kind, Delegate> = {
  categories: prisma.artworkCategory as unknown as Delegate,
  styles: prisma.artworkStyle as unknown as Delegate,
  mediums: prisma.artworkMedium as unknown as Delegate,
  themes: prisma.artworkTheme as unknown as Delegate,
};

const richKinds: Kind[] = ['categories', 'styles']; // have description + imageUrl

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().url().max(500).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
  availableForCustomArt: z.boolean().optional(),
});

function sanitize(kind: Kind, input: Partial<z.infer<typeof bodySchema>>) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined || input.name !== undefined) data.slug = slugify(input.slug || input.name!);
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (richKinds.includes(kind)) {
    if (input.description !== undefined) data.description = input.description;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  }
  if (kind === 'styles' && input.availableForCustomArt !== undefined) data.availableForCustomArt = input.availableForCustomArt;
  return data;
}

function routesFor(kind: Kind): RouteDef[] {
  const d = delegates[kind];
  const entity = kind.slice(0, -1);
  return [
    {
      method: 'GET',
      path: `/${kind}`,
      auth: 'optional',
      handler: async (ctx) => {
        const includeInactive = isAdmin(ctx.user) && ctx.query.all === 'true';
        const where: Record<string, unknown> = includeInactive ? {} : { isActive: true };
        if (kind === 'styles' && ctx.query.customArt === 'true') where.availableForCustomArt = true;
        const rows = await d.findMany({
          where,
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: { _count: { select: { artworks: { where: publicArtworkWhere } } } },
        });
        return ok(
          rows.map(({ _count, ...r }) => ({
            ...r,
            description: r.description ?? null,
            imageUrl: r.imageUrl ?? null,
            artworkCount: _count?.artworks ?? 0,
          })),
        );
      },
    },
    {
      method: 'POST',
      path: `/${kind}`,
      roles: ['ADMIN'],
      handler: async (ctx) => {
        const input = parse(bodySchema, ctx.body);
        const row = await d.create({ data: sanitize(kind, input) });
        await audit(ctx.user, `${entity.toUpperCase()}_CREATED`, entity, row.id, { name: input.name }, { ip: ctx.ip });
        return created(row);
      },
    },
    {
      method: 'PATCH',
      path: `/${kind}/:id`,
      roles: ['ADMIN'],
      handler: async (ctx) => {
        const input = parse(bodySchema.partial(), ctx.body);
        if (!(await d.findUnique({ where: { id: ctx.params.id } }))) throw notFound(entity);
        const row = await d.update({ where: { id: ctx.params.id }, data: sanitize(kind, input) });
        await audit(ctx.user, `${entity.toUpperCase()}_UPDATED`, entity, row.id, input, { ip: ctx.ip });
        return ok(row);
      },
    },
    {
      method: 'DELETE',
      path: `/${kind}/:id`,
      roles: ['ADMIN'],
      handler: async (ctx) => {
        const existing = await d.findUnique({ where: { id: ctx.params.id }, include: { _count: { select: { artworks: true } } } });
        if (!existing) throw notFound(entity);
        const used = ((existing._count as { artworks: number } | undefined)?.artworks ?? 0) > 0;
        if (used) {
          // Referenced by artworks: deactivate instead of breaking history.
          await d.update({ where: { id: ctx.params.id }, data: { isActive: false } });
        } else {
          await d.delete({ where: { id: ctx.params.id } });
        }
        await audit(ctx.user, `${entity.toUpperCase()}_${used ? 'DEACTIVATED' : 'DELETED'}`, entity, ctx.params.id, undefined, { ip: ctx.ip });
        return ok({ id: ctx.params.id, deleted: !used, deactivated: used });
      },
    },
  ];
}

export const taxonomyRoutes: RouteDef[] = [
  ...routesFor('categories'),
  ...routesFor('styles'),
  ...routesFor('mediums'),
  ...routesFor('themes'),
  {
    method: 'GET',
    path: '/tags',
    handler: async (ctx) => {
      const q = typeof ctx.query.q === 'string' ? ctx.query.q.slice(0, 50) : undefined;
      const tags = await prisma.artworkTag.findMany({
        where: q ? { name: { contains: q } } : {},
        orderBy: { artworks: { _count: 'desc' } },
        take: 30,
        select: { id: true, name: true, slug: true },
      });
      return ok(tags);
    },
  },
];
