
export enum Origin {
  Inato = "Inato",
  Herdado = "Herdado",
  Hibrido = "Híbrido",
  RestricaoCelestial = "Restrição Celestial"
}

export type CharacterClass = "Combatente" | "Feiticeiro" | "Especialista" | "Restrição Celestial";

export interface Attributes {
  FOR: number;
  AGI: number;
  VIG: number;
  INT: number;
  PRE: number;
}

export interface Skill {
  id: string;
  name: string;
  value: number;
  attribute?: keyof Attributes;
  otherValue?: number;
  isBase?: boolean;
}

export interface Ability {
  id: string;
  name: string;
  category?: string;
  subCategory?: string; // Added for categorization within tabs
  cost: string;
  description: string;
}

export interface Technique extends Ability {
  damageDie: DieType; // The multiplier (d6, d8, d10, etc.)
  element: string; // Flavour/Type (Fire, Water, etc.)
  range: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string;
  isBroken?: boolean; // New field for durability mechanics
}

export interface Character {
  id: string; // Unique identifier for saving/loading
  name: string;
  imageUrl?: string; // New field for avatar image
  level: number;
  origin: Origin;
  characterClass: CharacterClass; 
  attributes: Attributes;
  skills: Skill[];
  abilities: Ability[];
  techniques: Technique[];
  inventory: Item[];
}

export interface DerivedStats {
  LL: number;
  MaxPV: number;
  MaxCE: number;
  MaxPE: number;
  Movement: number;
}

export interface CurrentStats {
  pv: number;
  ce: number;
  pe: number;
}

export enum DieType {
  d4 = 4,
  d6 = 6,
  d8 = 8,
  d10 = 10,
  d12 = 12
}

export interface ActionState {
  standard: boolean;
  movement: number; // 0, 1, 2
  reactionPenalty: number;
}

// Updated based on Rulebook Section "Perícias"
export const DEFAULT_SKILLS: Skill[] = [
  // Agilidade
  { id: 'acrobacia', name: 'Acrobacia', value: 0, attribute: 'AGI', isBase: true },
  { id: 'crime', name: 'Crime', value: 0, attribute: 'AGI', isBase: true },
  { id: 'furtividade', name: 'Furtividade', value: 0, attribute: 'AGI', isBase: true },
  { id: 'iniciativa', name: 'Iniciativa', value: 0, attribute: 'AGI', isBase: true },
  { id: 'pilotagem', name: 'Pilotagem', value: 0, attribute: 'AGI', isBase: true },
  { id: 'pontaria', name: 'Pontaria', value: 0, attribute: 'AGI', isBase: true },
  { id: 'reflexos', name: 'Reflexos', value: 0, attribute: 'AGI', isBase: true },

  // Força
  { id: 'atletismo', name: 'Atletismo', value: 0, attribute: 'FOR', isBase: true },
  { id: 'luta', name: 'Luta', value: 0, attribute: 'FOR', isBase: true },

  // Vigor
  { id: 'fortitude', name: 'Fortitude', value: 0, attribute: 'VIG', isBase: true },

  // Inteligência
  { id: 'atualidades', name: 'Atualidades', value: 0, attribute: 'INT', isBase: true },
  { id: 'ciencias', name: 'Ciências', value: 0, attribute: 'INT', isBase: true },
  { id: 'feitiçaria', name: 'Feitiçaria', value: 0, attribute: 'INT', isBase: true }, // Replaces Ocultismo/Uses Rulebook name
  { id: 'investigacao', name: 'Investigação', value: 0, attribute: 'INT', isBase: true },
  { id: 'medicina', name: 'Medicina', value: 0, attribute: 'INT', isBase: true },
  { id: 'profissao', name: 'Profissão', value: 0, attribute: 'INT', isBase: true },
  { id: 'sobrevivencia', name: 'Sobrevivência', value: 0, attribute: 'INT', isBase: true },
  { id: 'tatica', name: 'Tática', value: 0, attribute: 'INT', isBase: true },
  { id: 'tecnologia', name: 'Tecnologia', value: 0, attribute: 'INT', isBase: true },

  // Presença
  { id: 'adestramento', name: 'Adestramento', value: 0, attribute: 'PRE', isBase: true },
  { id: 'artes', name: 'Artes', value: 0, attribute: 'PRE', isBase: true },
  { id: 'diplomacia', name: 'Diplomacia', value: 0, attribute: 'PRE', isBase: true },
  { id: 'enganacao', name: 'Enganação', value: 0, attribute: 'PRE', isBase: true },
  { id: 'intimidacao', name: 'Intimidação', value: 0, attribute: 'PRE', isBase: true },
  { id: 'intuicao', name: 'Intuição', value: 0, attribute: 'PRE', isBase: true },
  { id: 'percepcao', name: 'Percepção', value: 0, attribute: 'PRE', isBase: true },
  { id: 'religiao', name: 'Religião', value: 0, attribute: 'PRE', isBase: true },
  { id: 'vontade', name: 'Vontade', value: 0, attribute: 'PRE', isBase: true },
];