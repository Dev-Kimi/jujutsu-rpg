import { BindingVow } from '../types';

export type BonusPercent = { pvPct: number; cePct: number; pePct: number };

const clamp = (val: number, min = -50, max = 50) => Math.max(min, Math.min(max, val));

const classifyBonus = (text: string): 'adv' | 'dis' => {
  const t = (text || '').toLowerCase();
  if ((/(^|\s)-/.test(text)) || /\b(desvantagem|penalidade|reduz|redução|diminui|malus)\b/.test(t)) return 'dis';
  if ((/(^|\s)\+/.test(text)) || /\b(vantagem|bônus|bonus|aumenta|melhora|incrementa)\b/.test(t)) return 'adv';
  return 'adv';
};

export const computeVoteBonus = (vows: BindingVow[] | undefined): BonusPercent => {
  const active = (vows || []).filter(v => v.isActive);
  let advCount = 0;
  let disCount = 0;

  active.forEach(v => {
    (v.bonuses || []).forEach(b => {
      const kind = classifyBonus(b);
      if (kind === 'adv') advCount += 1;
      else disCount += 1;
    });
  });

  // Mapping: each advantage increases PV +2%, CE +3%, PE +1%
  // each disadvantage decreases PV/CE/PE by -1%
  const pvPct = clamp((advCount * 2) - (disCount * 1));
  const cePct = clamp((advCount * 3) - (disCount * 1));
  const pePct = clamp((advCount * 1) - (disCount * 1));

  return { pvPct, cePct, pePct };
};

export const combineBonuses = (auto: BonusPercent, manual: BonusPercent | null, manualActive: boolean): BonusPercent => {
  if (!manualActive || !manual) return auto;
  return {
    pvPct: clamp(manual.pvPct),
    cePct: clamp(manual.cePct),
    pePct: clamp(manual.pePct)
  };
};

export const isActiveBonus = (b: BonusPercent): boolean => {
  return !!(b.pvPct || b.cePct || b.pePct);
};

const STORAGE_PREFIX = 'jjk_bonus_overrides_';
export const loadManualBonus = (charId: string): { active: boolean; values: BonusPercent } | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + charId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const active = !!parsed.active;
    const values: BonusPercent = {
      pvPct: clamp(Number(parsed.values?.pvPct || 0)),
      cePct: clamp(Number(parsed.values?.cePct || 0)),
      pePct: clamp(Number(parsed.values?.pePct || 0)),
    };
    return { active, values };
  } catch {
    return null;
  }
};

export const saveManualBonus = (charId: string, active: boolean, values: BonusPercent) => {
  try {
    const payload = { active, values };
    localStorage.setItem(STORAGE_PREFIX + charId, JSON.stringify(payload));
  } catch {
    // ignore
  }
};

export const clearManualBonus = (charId: string) => {
  try {
    localStorage.removeItem(STORAGE_PREFIX + charId);
  } catch {
    // ignore
  }
};

export const applyBonusToStats = (base: { pv: number; ce: number; pe: number }, bonus: BonusPercent) => {
  const pv = Math.floor(base.pv * (1 + (bonus.pvPct / 100)));
  const ce = Math.floor(base.ce * (1 + (bonus.cePct / 100)));
  const pe = Math.floor(base.pe * (1 + (bonus.pePct / 100)));
  return { pv, ce, pe };
};

export const notifyBonusesUpdated = (bonus: BonusPercent) => {
  try {
    const ev = new CustomEvent('bonusesUpdated', { detail: bonus });
    window.dispatchEvent(ev);
  } catch {
    // ignore
  }
};
