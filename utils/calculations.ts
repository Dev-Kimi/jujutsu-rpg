import { Attributes, Character, DEFAULT_SKILLS, DerivedStats, Origin, Item } from '../types';
import { MUNDANE_WEAPONS } from './equipmentData';

export interface BaseDiceProgression {
  utility: number;
  punch: number;
  medium: number;
  highDamage: number;
}

export const getBaseDiceByLevel = (level: number): BaseDiceProgression => {
  if (level >= 17 && level <= 20) {
    return { utility: 9, punch: 10, medium: 10, highDamage: 12 };
  } else if (level >= 13 && level <= 16) {
    return { utility: 7, punch: 8, medium: 8, highDamage: 10 };
  } else if (level >= 9 && level <= 12) {
    return { utility: 5, punch: 6, medium: 6, highDamage: 8 };
  } else if (level >= 5 && level <= 8) {
    return { utility: 3, punch: 4, medium: 4, highDamage: 6 };
  } else {
    return { utility: 1, punch: 2, medium: 2, highDamage: 4 };
  }
};
const LL_GAIN_TABLE = [
  2, 2, 2,
  3, 3, 3, 3,
  4, 4, 4, 4,
  5, 5, 5, 5,
  6, 6, 6, 6,
  7,
  8, 8, 8,
  9, 9, 9, 9,
  10, 10, 10
];

let rollAudioPool: HTMLAudioElement[] = [];
let rollAudioPoolIndex = 0;
let rollAudioPrimed = false;
let lastRollAudioAt = 0;
const getRollSoundUrl = () => `${import.meta.env.BASE_URL}sounds/rollsound.mp3`;

export const primeRollSound = () => {
  if (typeof window === 'undefined') return;
  try {
    if (rollAudioPool.length === 0) {
      const url = getRollSoundUrl();
      rollAudioPool = Array.from({ length: 3 }, () => {
        const a = new Audio(url);
        a.preload = 'auto';
        a.volume = 0.9;
        return a;
      });
    }

    for (const a of rollAudioPool) a.load?.();
    if (rollAudioPrimed) return;
    rollAudioPrimed = true;

    const a = rollAudioPool[0];
    const prevMuted = a.muted;
    const prevVolume = a.volume;
    try {
      a.muted = true;
      a.volume = 0;
      a.currentTime = 0;
    } catch {}
    const p = a.play();
    if (p && typeof (p as any).then === 'function') {
      (p as Promise<void>)
        .then(() => {
          a.pause();
          try {
            a.currentTime = 0;
            a.muted = prevMuted;
            a.volume = prevVolume;
          } catch {}
        })
        .catch(() => {});
    } else {
      a.pause();
      try {
        a.currentTime = 0;
        a.muted = prevMuted;
        a.volume = prevVolume;
      } catch {}
    }
  } catch {}
};

const playRollSound = () => {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastRollAudioAt < 120) return;
  lastRollAudioAt = now;
  try {
    primeRollSound();
    if (rollAudioPool.length === 0) return;
    const a = rollAudioPool[rollAudioPoolIndex % rollAudioPool.length];
    rollAudioPoolIndex += 1;
    a.muted = false;
    a.volume = 0.9;
    try {
      a.currentTime = 0;
    } catch {}
    a.play().catch(() => {});
  } catch {}
};
const getLLForLevel = (level: number): number => {
  if (level <= 0) return 0;
  const capped = Math.min(level, LL_GAIN_TABLE.length);
  let sum = 0;
  for (let i = 0; i < capped; i++) sum += LL_GAIN_TABLE[i];
  return sum;
};

export const calculateDerivedStats = (char: Character): DerivedStats => {
  const { level, origin, attributes } = char;
  const { VIG, INT, PRE } = attributes;

  const LL = getLLForLevel(level);

  const MaxPV = (15 + VIG * 5) + ((13 + VIG * 2) * level);
  const MaxCE = (INT * LL) + (level * 20) + 30;
  const MaxPE = Math.floor(PRE * level * 1.5) + Math.floor(LL / 2);

  // E. Movement
  let Movement = 0;
  if (origin === Origin.RestricaoCelestial) {
     Movement = 12; // Base HR
  } else {
     Movement = 9 + (level * 3);
  }

  // Projection Sorcery Speed Bonus
  const hasProjection = char.innateTechnique?.name === "Projeção de Feitiçaria" || char.techniques.some(t => t.name === "Projeção de Feitiçaria");
  if (hasProjection && char.projectionStacks) {
      const multiplier = 1 + (char.projectionStacks * 0.5); // +50% per stack
      Movement = Math.floor(Movement * multiplier);
  }

  return { LL, MaxPV, MaxCE, MaxPE, Movement };
};

export const rollDice = (sides: number, count: number): number => {
  playRollSound();
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += Math.floor(Math.random() * sides) + 1;
  }
  return sum;
};

/**
 * Extract critical threshold from weapon critical string (e.g., "19-20 / x2" returns 19, "x2" returns 20)
 */
export const getCriticalThreshold = (criticalStr: string): number => {
  if (!criticalStr) return 20; // Default critical on 20
  
  const match = criticalStr.match(/(\d+)-20/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return 20; // Default: critical on 20
};

/**
 * Get critical threshold for a weapon item
 */
export const getWeaponCriticalThreshold = (weaponItem: Item | undefined): number => {
  if (!weaponItem) return 20;
  
  // Check if it's a known mundane weapon
  const mundaneWeapon = MUNDANE_WEAPONS.find(mw => 
    weaponItem.name.toLowerCase().includes(mw.name.toLowerCase())
  );
  
  if (mundaneWeapon) {
    return getCriticalThreshold(mundaneWeapon.critical);
  }
  
  // Check description for critical info
  const descMatch = weaponItem.description.match(/cr[ií]tico[:\s]+(\d+)-20/i);
  if (descMatch) {
    return parseInt(descMatch[1]);
  }
  
  return 20; // Default
};

export const parseAbilityCost = (costStr: string): { pe: number, ce: number, isVariable: boolean } => {
  let pe = 0;
  let ce = 0;
  let isVariable = false;
  
  if (!costStr) return { pe: 0, ce: 0, isVariable: false };

  const lower = costStr.toLowerCase();

  // Check for "Passivo" or "Passiva"
  if (lower.includes("passivo") || lower.includes("passiva")) {
    return { pe: 0, ce: 0, isVariable: false };
  }
  
  // Extract PE values
  const peMatches = lower.match(/(\d+)\s*pe/g);
  if (peMatches) {
    pe = peMatches.reduce((sum, match) => {
      const val = parseInt(match);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }
  
  // Extract CE values
  const ceMatches = lower.match(/(\d+)\s*ce/g);
  if (ceMatches) {
    ce = ceMatches.reduce((sum, match) => {
      const val = parseInt(match);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }
  
  // Handle variable costs (X PE, X CE)
  if (lower.includes("x pe") || lower.includes("xpe")) {
    pe = 1;
    isVariable = true;
  }
  if (lower.includes("x ce") || lower.includes("xce")) {
    ce = 1;
    isVariable = true;
  }
  
  return { pe, ce, isVariable };
};

export const parseAbilityEffect = (description: string): { attack: number, defense: number } => {
  let attack = 0;
  let defense = 0;
  
  if (!description) return { attack: 0, defense: 0 };
  
  // Look for patterns like "+X em ataque" or "+X em defesa"
  const attackMatch = description.match(/\+(\d+)\s*(?:em\s*)?(?:ataque|attack)/i);
  if (attackMatch) {
    attack = parseInt(attackMatch[1]) || 0;
  }
  
  const defenseMatch = description.match(/\+(\d+)\s*(?:em\s*)?(?:defesa|defense)/i);
  if (defenseMatch) {
    defense = parseInt(defenseMatch[1]) || 0;
  }
  
  return { attack, defense };
};

export const parseAbilitySkillTrigger = (description: string): string | null => {
  if (!description) return null;

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalized = normalize(description);
  const skillNames = DEFAULT_SKILLS.map(s => s.name);
  const normalizedSkillNames = skillNames.map(normalize);

  const findSkillInText = (text: string): string | null => {
    const nText = normalize(text);
    for (let i = 0; i < normalizedSkillNames.length; i++) {
      const nSkill = normalizedSkillNames[i];
      if (nText.includes(nSkill)) return skillNames[i];
    }
    return null;
  };

  const matchTesteDe = normalized.match(/\bteste\s+de\s+(.+?)(?:\s+(?:vs|contra)\b|[.,;]|$)/i);
  if (matchTesteDe?.[1]) {
    const found = findSkillInText(matchTesteDe[1]);
    if (found) return found;
  }

  const matchBeforeVs = normalized.match(/\b([a-záàâãéèêíìîóòôõúùûç\s]+?)\s+vs\b/i);
  if (matchBeforeVs?.[1]) {
    const found = findSkillInText(matchBeforeVs[1]);
    if (found) return found;
  }

  return null;
};

/**
 * Parses a dice string (e.g., "1d6", "2d8+1") and rolls it.
 * Returns both the total result and the string representation of the roll.
 */
export const parseAndRollDice = (diceStr: string): { total: number, text: string } => {
  // Simple regex for XdY(+Z)
  const match = diceStr.toLowerCase().match(/(\d*)d(\d+)(?:\+(\d+))?/);
  
  if (!match) return { total: 0, text: "0" };

  const count = match[1] ? parseInt(match[1]) : 1;
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  const roll = rollDice(sides, count);
  const total = roll + modifier;

  return { 
    total, 
    text: `${roll}${modifier > 0 ? `+${modifier}` : ''} (${diceStr})` 
  };
};

/**
 * Calculates the PE cost for maintaining a domain expansion per round.
 * Cost is typically 15 PE per round after the initial activation.
 */
export const calculateDomainCost = (round: number): number => {
  // First round is free (activation cost is paid upfront)
  // Subsequent rounds cost 15 PE each
  if (round <= 1) return 0;
  return 15;
};

/**
 * Determines the CE Limit (Durability) of an item.
 * Mundane Weapons = 2 CE.
 * Cursed Tools = Determined by Grade in description/name.
 */
export const getWeaponCELimit = (item: Item): number => {
  const text = (item.name + " " + item.description).toLowerCase();

  // Check Grades first
  if (text.includes("grau 4")) return 5;
  if (text.includes("grau 3")) return 10;
  if (text.includes("grau 2")) return 15;
  if (text.includes("grau 1")) return 20;
  if (text.includes("grau especial")) return 30; // Virtually infinite for normal reinforced attacks

  // Check if it's a known mundane weapon (or fallback)
  const isMundane = MUNDANE_WEAPONS.some(mw => item.name.toLowerCase().includes(mw.name.toLowerCase()));
  
  // Default logic: If it's a weapon but no grade specified, treat as Mundane (2 CE limit)
  // We assume items in "Weapons" tab are mundane unless stated otherwise.
  return 2; 
};

export const computeCEInvestmentBonus = (ceInvested: number): { dados_adicionais: number; dano_fixo: number } => {
  if (!Number.isInteger(ceInvested) || ceInvested < 0) {
    throw new Error('CE inválido: forneça um inteiro não-negativo');
  }
  const dados_adicionais = Math.floor(ceInvested / 3);
  const resto = ceInvested % 3;
  const dano_fixo = Math.ceil(resto / 3);
  return { dados_adicionais, dano_fixo };
};

export const computeUnarmedD8Damage = (ceInvested: number, strength: number, level: number, damageType: 'punch' | 'medium' | 'highDamage' = 'punch'): { diceCount: number; fixedBonus: number } => {
  if (!Number.isInteger(ceInvested) || ceInvested < 0) {
    throw new Error('CE inválido: forneça um inteiro não-negativo');
  }
  
  const mark = Math.ceil(Math.max(0, level) / 4);
  const baseDiceCount = mark * 2;
  const unit = Math.floor(ceInvested / 5);
  const investDice = Math.floor(unit * 1.0);
  const diceCount = baseDiceCount + investDice;
  const fixedBonus = (strength * 4) + (ceInvested % 5);
  
  return { diceCount, fixedBonus };
};

export const computeTechniqueD8Damage = (
  ceInvested: number,
  level: number,
  powerCategory: 'Pouco Dano' | 'Dano Médio' | 'Alto Dano' = 'Pouco Dano',
  int: number
): { diceCount: number; fixedBonus: number } => {
  if (!Number.isInteger(ceInvested) || ceInvested < 0) {
    throw new Error('CE inválido: forneça um inteiro não-negativo');
  }
  
  const mark = Math.ceil(Math.max(0, level) / 4);
  const baseDiceCount = mark * 2;
  const unit = Math.floor(ceInvested / 5);
  const multiplier = powerCategory === 'Alto Dano' ? 1.9 : powerCategory === 'Dano Médio' ? 1.5 : 1.1;
  const investDice = Math.floor(unit * multiplier);
  const diceCount = baseDiceCount + investDice;
  const fixedBonus = (int * 4) + (ceInvested % 5);
  
  return { diceCount, fixedBonus };
};

export const getPowerMarkBaseDice = (level: number): number => {
  const mark = Math.ceil(Math.max(0, level) / 4);
  return mark * 2;
};



export const computeWeaponD8Damage = (ceInvested: number, strength: number, baseDice: string): { 
  baseDiceCount: number; 
  baseDiceSides: number;
  cursedDiceCount: number;
  cursedDiceSides: number;
  fixedBonus: number; 
} => {
  if (!Number.isInteger(ceInvested) || ceInvested < 0) {
    throw new Error('CE inválido: forneça um inteiro não-negativo');
  }
  
  // Parse base dice string (e.g., "1d6", "2d4", etc.)
  const diceMatch = baseDice.match(/(\d+)d(\d+)/i);
  if (!diceMatch) {
    throw new Error('Formato de dado inválido: use formato XdY');
  }
  
  const baseCount = parseInt(diceMatch[1]);
  const baseSides = parseInt(diceMatch[2]);
  
  // Nova fórmula: Base da Arma + Reforço Amaldiçoado + Bônus Fixo
  // Base da Arma: numBase * faceArma (mantém as faces originais)
  // Reforço Amaldiçoado: floor(Investimento / 5) * 1d8
  // Bônus Fixo: FOR * 4 + floor(Investimento % 5 / 2)
  const cursedDiceCount = Math.floor(ceInvested / 5);
  const cursedDiceSides = 8; // Sempre d8 para reforço amaldiçoado
  const fixedBonus = (strength * 4) + Math.floor((ceInvested % 5) / 2);
  
  return { 
    baseDiceCount: baseCount, 
    baseDiceSides: baseSides,
    cursedDiceCount: cursedDiceCount,
    cursedDiceSides: cursedDiceSides,
    fixedBonus: fixedBonus 
  };
};

export const getTechniqueDamageDieSides = (
  powerCategory: 'Pouco Dano' | 'Dano Médio' | 'Alto Dano' | undefined,
  level: number
): number => {
  const lvl = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
  const tier = lvl >= 16 ? 3 : lvl >= 11 ? 2 : lvl >= 6 ? 1 : 0;

  const base = powerCategory === 'Pouco Dano'
    ? [4, 6, 8, 10]
    : powerCategory === 'Alto Dano'
    ? [8, 10, 12, 14]
    : [6, 8, 10, 12];

  return base[tier] || base[0];
};

export const getTechniqueDamageDieFace = (
  powerCategory: 'Pouco Dano' | 'Dano Médio' | 'Alto Dano' | undefined,
  level: number
): string => `d${getTechniqueDamageDieSides(powerCategory, level)}`;
