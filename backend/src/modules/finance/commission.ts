import type { CommissionScope } from '@prisma/client';
import { config } from '../../config/env.js';
import { prisma } from '../../database/prisma/client.js';
import { splitCommission, toMinor } from '../../utils/money.js';

export interface CommissionRuleLike {
  id: string;
  scope: CommissionScope;
  targetId: string | null;
  percentage: number;
  isActive: boolean;
}

export interface CommissionSubject {
  kind: 'ARTWORK' | 'CUSTOM_ART';
  artistId: string;
  artworkId?: string | null;
  categoryId?: string | null;
}

export interface ResolvedCommission {
  scope: CommissionScope;
  ruleId: string | null;
  percentage: number;
}

/**
 * Most specific active rule wins.
 *  Artwork sale:    ARTWORK → ARTIST → CATEGORY → GLOBAL → env default
 *  Custom art sale: ARTIST → CUSTOM_ART → GLOBAL → env default
 */
export function resolveCommission(
  rules: CommissionRuleLike[],
  subject: CommissionSubject,
  defaultPercentage = config.COMMISSION_DEFAULT_PERCENTAGE,
): ResolvedCommission {
  const active = rules.filter((r) => r.isActive);
  const find = (scope: CommissionScope, targetId: string | null | undefined) =>
    active.find((r) => r.scope === scope && (scope === 'GLOBAL' || scope === 'CUSTOM_ART' ? true : r.targetId === targetId));

  const order: Array<[CommissionScope, string | null | undefined]> =
    subject.kind === 'CUSTOM_ART'
      ? [
          ['ARTIST', subject.artistId],
          ['CUSTOM_ART', null],
          ['GLOBAL', null],
        ]
      : [
          ['ARTWORK', subject.artworkId],
          ['ARTIST', subject.artistId],
          ['CATEGORY', subject.categoryId],
          ['GLOBAL', null],
        ];

  for (const [scope, target] of order) {
    if (scope !== 'GLOBAL' && scope !== 'CUSTOM_ART' && !target) continue;
    const rule = find(scope, target);
    if (rule) return { scope, ruleId: rule.id, percentage: rule.percentage };
  }
  return { scope: 'GLOBAL', ruleId: null, percentage: defaultPercentage };
}

export async function loadCommissionRules(): Promise<CommissionRuleLike[]> {
  const rules = await prisma.commissionRule.findMany({ where: { isActive: true } });
  return rules.map((r) => ({ ...r, percentage: Number(r.percentage) }));
}

export function computeLine(unitPrice: number | string | { toString(): string }, quantity: number, percentage: number) {
  const grossMinor = toMinor(unitPrice) * quantity;
  return splitCommission(grossMinor, percentage);
}
