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
  it('classifies advantages and disadvantages and maps to percents', () => {
    const vows = [
      mkVow(['+10% PV', 'Vantagem: CE +5%']),
      mkVow(['Desvantagem: -5% PE']),
      mkVow(['penalidade de movimento'], true),
    ];
    const res = computeVoteBonus(vows as any);
    // 2 adv, 2 dis → PV: (2*2)-(2*1)=2; CE: (2*3)-2=4; PE: (2*1)-2=0
    expect(res.pvPct).toBe(2);
    expect(res.cePct).toBe(4);
    expect(res.pePct).toBe(0);
  });

  it('caps values within [-50, 50]', () => {
    const vows = new Array(100).fill(0).map(() => mkVow(['+adv']));
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
