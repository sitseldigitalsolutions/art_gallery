import { describe, expect, it } from 'vitest';
import { computeLine, resolveCommission, type CommissionRuleLike } from '../src/modules/finance/commission.js';
import { splitCommission } from '../src/utils/money.js';

const rule = (scope: CommissionRuleLike['scope'], targetId: string | null, percentage: number, isActive = true): CommissionRuleLike => ({
  id: `${scope}-${targetId}`,
  scope,
  targetId,
  percentage,
  isActive,
});

describe('commission', () => {
  it('matches the spec example: 10,000 at 10% gives 1,000 platform and 9,000 artist', () => {
    expect(splitCommission(1_000_000, 10)).toEqual({ grossMinor: 1_000_000, commissionMinor: 100_000, artistMinor: 900_000 });
    expect(computeLine('10000.00', 1, 10)).toEqual({ grossMinor: 1_000_000, commissionMinor: 100_000, artistMinor: 900_000 });
  });

  it('never loses a paisa to rounding', () => {
    const s = splitCommission(33_333, 12.5);
    expect(s.commissionMinor + s.artistMinor).toBe(33_333);
    expect(computeLine('999.99', 3, 7.5).grossMinor).toBe(299_997);
  });

  it('resolves the most specific rule for artwork sales', () => {
    const rules = [rule('GLOBAL', null, 12), rule('CATEGORY', 'cat1', 9), rule('ARTIST', 'a1', 8), rule('ARTWORK', 'w1', 5)];
    expect(resolveCommission(rules, { kind: 'ARTWORK', artistId: 'a1', artworkId: 'w1', categoryId: 'cat1' }).percentage).toBe(5);
    expect(resolveCommission(rules, { kind: 'ARTWORK', artistId: 'a1', artworkId: 'w2', categoryId: 'cat1' }).percentage).toBe(8);
    expect(resolveCommission(rules, { kind: 'ARTWORK', artistId: 'a2', artworkId: 'w2', categoryId: 'cat1' }).percentage).toBe(9);
    expect(resolveCommission(rules, { kind: 'ARTWORK', artistId: 'a2', artworkId: 'w2', categoryId: 'x' }).percentage).toBe(12);
    expect(resolveCommission([], { kind: 'ARTWORK', artistId: 'a2' }, 10)).toEqual({ scope: 'GLOBAL', ruleId: null, percentage: 10 });
  });

  it('uses artist, then custom-art, then global precedence for custom art and ignores inactive rules', () => {
    const rules = [rule('GLOBAL', null, 12), rule('CUSTOM_ART', null, 15), rule('ARTIST', 'a1', 8, false)];
    expect(resolveCommission(rules, { kind: 'CUSTOM_ART', artistId: 'a1' }).percentage).toBe(15);
    rules[2].isActive = true;
    expect(resolveCommission(rules, { kind: 'CUSTOM_ART', artistId: 'a1' }).percentage).toBe(8);
  });

  it('rejects invalid inputs', () => {
    expect(() => splitCommission(-1, 10)).toThrow();
    expect(() => splitCommission(100, 101)).toThrow();
  });
});
