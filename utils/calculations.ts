import { Attributes, Character, DerivedStats, Origin, Item } from '../types';
import { MUNDANE_WEAPONS } from './equipmentData';
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

  const MaxPV = (VIG * 12) + (level * 8) + LL + 10;
  const MaxCE = (INT * LL) + (level * 20) + 30;
  const MaxPE = (PRE * level) + Math.floor(LL / 2) + 1;

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

export const parseAbilityCost = (costStr: string): { pe: number, ce: number } => {
  let pe = 0;
  let ce = 0;
  
  if (!costStr) return { pe: 0, ce: 0 };

  const lower = costStr.toLowerCase();

  // Check for "Passivo" or "Passiva"
  if (lower.includes("passivo") || lower.includes("passiva")) {
    return { pe: 0, ce: 0 };
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
    pe = 1; // Placeholder for variable
  }
  if (lower.includes("x ce") || lower.includes("xce")) {
    ce = 1; // Placeholder for variable
  }
  
  return { pe, ce };
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
  // Look for patterns like "vs Nome da Perícia" or "em Nome da Perícia"
  const vsMatch = description.match(/vs\s+([A-Za-záàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s]+?)(?:\.|,|$)/i);


  if (vsMatch && vsMatch[1]) {
    return vsMatch[1];
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
