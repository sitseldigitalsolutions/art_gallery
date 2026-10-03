import type { CustomArtStatus } from '@prisma/client';

export type Actor = 'CUSTOMER' | 'ARTIST' | 'ADMIN';

/**
 * Allowed custom-art transitions and who may perform them.
 *
 * REQUESTED ─► ARTIST_REVIEWING ─► ACCEPTED ─► IN_PROGRESS ─► PREVIEW_READY ─► CUSTOMER_APPROVED ─► FINALIZING ─► COMPLETED
 *     │               │                │             ▲               │
 *     └──► REJECTED ◄─┘                │             └── REVISION_REQUESTED (customer, limited by maxRevisions)
 *  (CANCELLED reachable from any non-terminal state by customer before work starts, or by admin at any time)
 */
const TRANSITIONS: Record<CustomArtStatus, Partial<Record<CustomArtStatus, Actor[]>>> = {
  REQUESTED: {
    ARTIST_REVIEWING: ['ARTIST'],
    ACCEPTED: ['ARTIST'],
    REJECTED: ['ARTIST', 'ADMIN'],
    CANCELLED: ['CUSTOMER', 'ADMIN'],
  },
  ARTIST_REVIEWING: {
    ACCEPTED: ['ARTIST'],
    REJECTED: ['ARTIST', 'ADMIN'],
    CANCELLED: ['CUSTOMER', 'ADMIN'],
  },
  ACCEPTED: {
    IN_PROGRESS: ['ARTIST'],
    CANCELLED: ['CUSTOMER', 'ADMIN'],
  },
  IN_PROGRESS: {
    PREVIEW_READY: ['ARTIST'],
    CANCELLED: ['ADMIN'],
  },
  PREVIEW_READY: {
    REVISION_REQUESTED: ['CUSTOMER'],
    CUSTOMER_APPROVED: ['CUSTOMER'],
    CANCELLED: ['ADMIN'],
  },
  REVISION_REQUESTED: {
    IN_PROGRESS: ['ARTIST'],
    PREVIEW_READY: ['ARTIST'],
    CANCELLED: ['ADMIN'],
  },
  CUSTOMER_APPROVED: {
    FINALIZING: ['ARTIST'],
    CANCELLED: ['ADMIN'],
  },
  FINALIZING: {
    COMPLETED: ['CUSTOMER', 'ADMIN'],
    CANCELLED: ['ADMIN'],
  },
  COMPLETED: {},
  REJECTED: {},
  CANCELLED: {},
};

export const TERMINAL_STATUSES: CustomArtStatus[] = ['COMPLETED', 'REJECTED', 'CANCELLED'];

export function canTransition(from: CustomArtStatus, to: CustomArtStatus, actor: Actor): boolean {
  return TRANSITIONS[from]?.[to]?.includes(actor) ?? false;
}

export function allowedNextStatuses(from: CustomArtStatus, actor: Actor): CustomArtStatus[] {
  return (Object.entries(TRANSITIONS[from] ?? {}) as [CustomArtStatus, Actor[]][])
    .filter(([, actors]) => actors.includes(actor))
    .map(([to]) => to);
}

export class TransitionError extends Error {
  constructor(
    public readonly from: CustomArtStatus,
    public readonly to: CustomArtStatus,
    public readonly actor: Actor,
  ) {
    super(`A ${actor.toLowerCase()} cannot move a request from ${from} to ${to}`);
  }
}

export function assertTransition(from: CustomArtStatus, to: CustomArtStatus, actor: Actor) {
  if (!canTransition(from, to, actor)) throw new TransitionError(from, to, actor);
}

/** Revision requests are only allowed while the customer still has revisions left. */
export function canRequestRevision(revisionCount: number, maxRevisions: number) {
  return revisionCount < maxRevisions;
}
