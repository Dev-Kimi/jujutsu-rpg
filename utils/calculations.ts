import { Attributes, Character, DerivedStats, Origin, Item } from '../types';
import { MUNDANE_WEAPONS } from './equipmentData';

export const calculateDerivedStats = (char: Character): DerivedStats => {
  const { level, origin, attributes } = char;
  const { VIG, INT, PRE } = attributes;

  // A. Liberação (LL) = 2 * Nível
  const LL = 2 * level;

  // B. Pontos de Vida (PV)
  let MaxPV = 0;
  if (origin === Origin.RestricaoCelestial) {
    // HR Formula: 50 + (VIG * 5) + (level * (30 + VIG))
    MaxPV = 50 + (VIG * 5) + (level * (30 + VIG));
  } else {
    // Sorcerer Formula: Nível × (10 + (Vigor × 5))
    MaxPV = level * (10 + (VIG * 5));
  }

  // C. Energia Amaldiçoada (CE)
  let MaxCE = 0;
  if (origin === Origin.RestricaoCelestial) {
    MaxCE = 0;
  } else {
    // Sorcerer: (10 + (INT * 4)) * Nível
    MaxCE = (10 + (INT * 4)) * level;
  }

  // D. Pontos de Esforço (PE)
  let MaxPE = 0;
  if (origin === Origin.RestricaoCelestial) {
    // HR: (5 + VIG + PRE) * Nível
    MaxPE = (5 + VIG + PRE) * level;
  } else {
    // Sorcerer: (Presença x 4) x Nível
    MaxPE = (PRE * 4) * level;
  }

  // E. Movement
  let Movement = 0;
  if (origin === Origin.RestricaoCelestial) {
     Movement = 12; // Base HR
  } else {
     Movement = 9 + (level * 3);
  }

  return { LL, MaxPV, MaxCE, MaxPE, Movement };
};

export const rollDice = (sides: number, count: number): number => {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
};

export const calculateDomainCost = (round: number): number => {
  if (round <= 2) return 0;
  return 5 + 5 * (round - 2);
};

export const parseAbilityCost = (costStr: string) => {
  if (!costStr) return { pe: 0, ce: 0, isVariable: false };

  // Normalize string
  const lower = costStr.toLowerCase();

  // Detect fixed numbers
  const peMatch = lower.match(/(\d+)\s*pe/);
  const ceMatch = lower.match(/(\d+)\s*ce/);

  const pe = peMatch ? parseInt(peMatch[1]) : 0;
  const ce = ceMatch ? parseInt(ceMatch[1]) : 0;

  // Detect variable indicators
  // Matches "X", "Varia", "Variable", "Todo", "+" without a number following immediately in a fixed context implies variable addition
  const isVariable = /x|varia|var|todo|\+/i.test(lower);

  return { pe, ce, isVariable };
};

// Helper to extract numeric bonuses from descriptions
export const parseAbilityEffect = (description: string) => {
  if (!description) return { attack: 0, defense: 0 };
  
  const lower = description.toLowerCase();
  
  // Regex to find "+X no ataque/acerto" or "+X ataque"
  const atkMatch = lower.match(/\+(\d+)\s+(?:no\s+)?(?:próximo\s+)?(?:ataque|acerto|dano)/);
  // Regex to find "+X na defesa" or "+X defesa"
  const defMatch = lower.match(/\+(\d+)\s+(?:na\s+)?(?:próxima\s+)?(?:defesa|esquiva|bloqueio)/);

  return {
    attack: atkMatch ? parseInt(atkMatch[1]) : 0,
    defense: defMatch ? parseInt(defMatch[1]) : 0
  };
};

// Helper to detect if ability requires a skill check
export const parseAbilitySkillTrigger = (description: string): string | null => {
  if (!description) return null;
  const lower = description.toLowerCase();
  
  // Pattern 1: "Teste de [Skill]" or "Teste [Skill]" or "Rolagem de [Skill]"
  // Captures "atletismo" from "teste de atletismo"
  const testMatch = lower.match(/(?:teste|rolagem)(?:\s+de)?\s+([a-zA-Z\u00C0-\u00FF]+)/i);
  
  if (testMatch && testMatch[1]) {
    // Ignore common non-skill words if necessary, but generally this works
    return testMatch[1];
  }

  // Pattern 2: "[Skill] vs [Something]"
  // Captures "tática" from "tática vs luta" or "luta vs reflexos"
  const vsMatch = lower.match(/([a-zA-Z\u00C0-\u00FF]+)\s+vs/i);

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
