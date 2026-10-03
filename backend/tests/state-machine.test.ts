import { describe, expect, it } from 'vitest';
import type { CustomArtStatus } from '@prisma/client';
import {
  allowedNextStatuses,
  assertTransition,
  canRequestRevision,
  canTransition,
  type Actor,
} from '../src/modules/custom-art/state-machine.js';

describe('custom art state machine', () => {
  it('walks the full happy path with the right actors', () => {
    const steps: Array<[CustomArtStatus, CustomArtStatus, Actor]> = [
      ['REQUESTED', 'ARTIST_REVIEWING', 'ARTIST'],
      ['ARTIST_REVIEWING', 'ACCEPTED', 'ARTIST'],
      ['ACCEPTED', 'IN_PROGRESS', 'ARTIST'],
      ['IN_PROGRESS', 'PREVIEW_READY', 'ARTIST'],
      ['PREVIEW_READY', 'REVISION_REQUESTED', 'CUSTOMER'],
      ['REVISION_REQUESTED', 'PREVIEW_READY', 'ARTIST'],
      ['PREVIEW_READY', 'CUSTOMER_APPROVED', 'CUSTOMER'],
      ['CUSTOMER_APPROVED', 'FINALIZING', 'ARTIST'],
      ['FINALIZING', 'COMPLETED', 'CUSTOMER'],
    ];
    for (const [from, to, actor] of steps) expect(canTransition(from, to, actor), `${from}->${to} by ${actor}`).toBe(true);
  });

  it('prevents each side from performing the other side steps', () => {
    expect(canTransition('REQUESTED', 'ACCEPTED', 'CUSTOMER')).toBe(false);
    expect(canTransition('PREVIEW_READY', 'CUSTOMER_APPROVED', 'ARTIST')).toBe(false);
    expect(canTransition('IN_PROGRESS', 'CANCELLED', 'CUSTOMER')).toBe(false);
    expect(() => assertTransition('COMPLETED', 'IN_PROGRESS', 'ADMIN')).toThrow();
  });

  it('treats terminal states as final and lets admin cancel active work', () => {
    expect(allowedNextStatuses('COMPLETED', 'ADMIN')).toEqual([]);
    expect(allowedNextStatuses('REJECTED', 'ARTIST')).toEqual([]);
    expect(canTransition('IN_PROGRESS', 'CANCELLED', 'ADMIN')).toBe(true);
  });

  it('limits revisions', () => {
    expect(canRequestRevision(0, 2)).toBe(true);
    expect(canRequestRevision(2, 2)).toBe(false);
  });
});
