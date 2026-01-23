
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

// Nova estrutura para sub-técnicas individuais
export interface SubTechnique {
  id: string;
  name: string;
  description: string;
  usage: string; // Modo de usar (ação padrão, reação, etc.)
  diceFace?: string; // e.g. "d4", "d6", "d8", "d10", "d12"
  range?: string; // Alcance textual opcional
  tierLabel?: string; // Ex: "CONHECIMENTO 1", "SANGUE 1"
  grade?: string; // Exibição de grau, ex: "NORMAL"
}

// Técnica agora é um conjunto com conceito principal e sub-habilidades
export interface Technique {
  id: string;
  name: string; // Conceito principal da técnica
  category: string;
  description: string; // Descrição geral do conceito
  subTechniques: SubTechnique[]; // Habilidades individuais dentro do conceito
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string;
  isBroken?: boolean; // New field for durability mechanics
  attackSkill?: string; // Perícia usada para ataques com esta arma (default: Luta)
}

export interface AptitudeLevels {
  manipulacao?: number; // Nível de aptidão em Manipulação (1-5 ou similar)
  barreiras?: number; // Nível de aptidão em Barreiras
  energiaReversa?: number; // Nível de aptidão em Energia Reversa
}

export interface BindingVow {
  id: string;
  name: string;
  description: string;
  benefit: string; // Benefício garantido
  restriction: string; // Restrição imposta
  bonuses?: string[]; // Lista de bônus mecânicos (ex: "+2 FOR", "+10 CE")
  isActive: boolean;
  createdAt: number;
  skillModifiers?: { skillName: string; value: number }[];
  advantageType?: 'attackTests' | 'physicalSkills' | 'defense' | 'mentalSkills' | 'resistance' | null;
}

export interface Condition {
  id: string;
  name: string;
  description: string;
  effects: string[]; // Lista de efeitos (ex: "-2 em ataques", "Não pode agir", etc.)
  duration?: number; // Duração em turnos (opcional, para condições temporárias)
  severity: 'minor' | 'moderate' | 'major' | 'extreme'; // Gravidade da condição
  isActive: boolean;
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
  equippedWeapons: string[]; // IDs das armas equipadas
  aptitudes?: AptitudeLevels; // Níveis de aptidão em categorias de Habilidades Amaldiçoadas
  innateTechnique?: {
    name: string;
    description?: string;
  };
  projectionStacks?: number; // Stacks da Projeção de Feitiçaria (0-3)
  ignoreAOO?: boolean; // Ignorar Ataques de Oportunidade
  bindingVows?: BindingVow[]; // Votos Vinculativos ativos
  conditions?: Condition[]; // Condições/status ativos
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

// --- CAMPAIGN TYPES ---

export interface CampaignParticipant {
  userId: string;
  characterId: string;
  characterName: string;
  characterClass: string;
  level: number;
  imageUrl?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  gmId: string; // User ID of the Game Master
  participants: CampaignParticipant[];
  participantIds?: string[];
  activeCombatActive?: boolean;
  activeCombatParticipants?: CampaignParticipant[];
  activeCombatParticipantKeys?: string[];
  activeCombatStartedAt?: number;
  activeCombatStartedBy?: string;
  createdAt: number;
}

export interface DiceRollLog {
  id: string;
  campaignId: string;
  userId: string;
  characterName: string;
  rollName: string; // Nome da perícia/habilidade/ataque
  rolls: number[]; // Array com os valores dos dados
  total: number; // Total da rolagem
  timestamp: number;
  breakdown?: string; // String de breakdown opcional
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
