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

  let pvPct = 0;
  let cePct = 0;
  let pePct = 0;

  active.forEach(v => {
    (v.bonuses || []).forEach(raw => {
      const text = (raw || '').toLowerCase();

      const matches = text.match(/([+-]?\d+)\s*%/g);
      if (!matches) return;

      matches.forEach(m => {
        const numMatch = m.match(/([+-]?\d+)\s*%/);
        if (!numMatch) return;
        const value = Number(numMatch[1] || 0);
        if (!value) return;

        const appliesPv = /\bpv\b|\bvida\b/.test(text);
        const appliesCe = /\bce\b|\benergia\b/.test(text);
        const appliesPe = /\bpe\b|\besforc[oo]\b/.test(text);

        if (appliesPv) pvPct += value;
        if (appliesCe) cePct += value;
        if (appliesPe) pePct += value;
      });
    });
  });

  return {
    pvPct: clamp(pvPct),
    cePct: clamp(cePct),
    pePct: clamp(pePct)
  };
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
