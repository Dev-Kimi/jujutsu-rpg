import { describe, it, expect } from 'vitest';
import { computeVoteBonus, combineBonuses, applyBonusToStats } from '../utils/bonus';

const mkVow = (bonuses: string[], isActive = true) => ({
  id: 'x',
  name: 'test',
  description: '',
  benefit: '',
  restriction: '',
  bonuses,
  isActive,
  skillModifiers: []
} as any);

describe('computeVoteBonus', () => {
  it('lê apenas porcentagens explícitas em PV/CE/PE', () => {
    const vows = [
      mkVow(['+10% PV', 'CE +5%']),
      mkVow(['-5% PE']),
      mkVow(['penalidade de movimento'], true),
    ];
    const res = computeVoteBonus(vows as any);
    expect(res.pvPct).toBe(10);
    expect(res.cePct).toBe(5);
    expect(res.pePct).toBe(-5);
  });

  it('desconsidera textos sem porcentagem ou sem PV/CE/PE', () => {
    const vows = [
      mkVow(['Vantagem: dano aumentado']),
      mkVow(['penalidade de movimento']),
    ];
    const res = computeVoteBonus(vows as any);
    expect(res.pvPct).toBe(0);
    expect(res.cePct).toBe(0);
    expect(res.pePct).toBe(0);
  });

  it('corta valores dentro de [-50, 50]', () => {
    const vows = new Array(100).fill(0).map(() => mkVow(['+10% PV', '+10% CE', '+10% PE']));
    const res = computeVoteBonus(vows as any);
    expect(res.pvPct).toBeLessThanOrEqual(50);
    expect(res.cePct).toBeLessThanOrEqual(50);
    expect(res.pePct).toBeLessThanOrEqual(50);
  });
});

describe('combineBonuses', () => {
  it('uses manual when active', () => {
    const auto = { pvPct: 10, cePct: 0, pePct: 0 };
    const manual = { pvPct: 5, cePct: -10, pePct: 3 };
    const eff = combineBonuses(auto, manual, true);
    expect(eff).toEqual(manual);
  });
  it('uses auto when manual inactive', () => {
    const auto = { pvPct: 10, cePct: 0, pePct: 0 };
    const eff = combineBonuses(auto, null, false);
    expect(eff).toEqual(auto);
  });
});

describe('applyBonusToStats', () => {
  it('applies percentage to base stats', () => {
    const base = { pv: 100, ce: 200, pe: 50 };
    const bonus = { pvPct: 10, cePct: -5, pePct: 0 };
    const res = applyBonusToStats(base, bonus);
    expect(res.pv).toBe(110);
    expect(res.ce).toBe(190);
    expect(res.pe).toBe(50);
  });
});
