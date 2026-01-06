import { Origin } from '../types';

export interface LevelEntry {
  level: number;
  gains: string[];
}

// 1. Tabela Padrão (Feiticeiros, Combatentes, Especialistas)
export const SORCERER_TABLE: LevelEntry[] = [
  { level: 1, gains: ["Habilidade Base de Classe", "Variação de Técnica Inata", "+1 Ponto de Habilidade", "Start: +5 Pontos de Atributo"] },
  { level: 2, gains: ["+1 Ponto de Aptidão", "+1 Ponto de Habilidade"] },
  { level: 3, gains: ["Grau de Treinamento +3", "+1 Ponto de Habilidade"] },
  { level: 4, gains: ["Aumento de Atributo (+1)", "+1 Ponto de Habilidade"] },
  { level: 5, gains: ["Nova Variação da Técnica Inata", "+1 Ponto de Aptidão", "Bônus de Origem Inato/Híbrido (+1 Skill)"] },
  { level: 6, gains: ["+1 Ponto de Habilidade"] },
  { level: 7, gains: ["Grau de Treinamento +3 (Total +8)"] },
  { level: 8, gains: ["Aumento de Atributo (+1)", "+1 Ponto de Aptidão", "+1 Ponto de Habilidade"] },
  { level: 9, gains: ["+1 Ponto de Habilidade"] },
  { level: 10, gains: ["Acesso à Árvore de Energia Reversa (RCT)"] },
  { level: 11, gains: ["+1 Ponto de Aptidão", "Grau de Treinamento +3 (Veterano)"] },
  { level: 12, gains: ["Aumento de Atributo (+1)", "+1 Ponto de Habilidade"] },
  { level: 13, gains: ["+1 Ponto de Habilidade"] },
  { level: 14, gains: ["+1 Ponto de Aptidão", "+1 Ponto de Habilidade"] },
  { level: 15, gains: ["Nova Variação da Técnica Inata", "Grau de Treinamento +3"] },
  { level: 16, gains: ["Aumento de Atributo (+1)", "+1 Ponto de Habilidade"] },
  { level: 17, gains: ["+1 Ponto de Aptidão", "+1 Ponto de Habilidade"] },
  { level: 18, gains: ["+1 Ponto de Habilidade"] },
  { level: 19, gains: ["Grau de Treinamento +3"] },
  { level: 20, gains: ["Aumento de Atributo (+1)", "+1 Ponto de Aptidão", "Técnica Máxima / Restauração"] },
];

// 2. Tabela Restrição Celestial (Físico)
export const HEAVENLY_TABLE: LevelEntry[] = [
  { level: 1, gains: ["Instinto Predatório (Perícia Extra)", "Corpo Celestial (+3 Atributos Iniciais)", "Mestre de Armas"] },
  { level: 5, gains: ["Assassino de Xamãs (Reação contra Técnicas)"] },
  { level: 10, gains: ["Percepção da Alma (Ver Maldições/Almas)", "Quebra de Postura"] },
  { level: 15, gains: ["Corpo Indestrutível (RD 5 Universal)"] },
  { level: 20, gains: ["O Tirano dos Céus (Rerrolar Falhas Físicas)", "Limite Rompido"] },
];

export interface ResourceSummary {
  totalAttributes: number;
  totalSkills: number;
  totalAptitude: number;
  proficiencyBonus: number;
}

// 3. Função de Cálculo de Recursos Acumulados
export const calculateTotalResources = (level: number, origin: Origin): ResourceSummary => {
  let attributes = 0;
  let skills = 0;
  let aptitude = 0;

  // Base Logic
  const isHR = origin === Origin.RestricaoCelestial;
  const isInato = origin === Origin.Inato;

  // Initial Values (Level 1)
  attributes = 5; 
  skills = 6; // 5 Base + 1 (Lvl 1 Standard)
  
  if (isHR) {
    attributes += 3; // HR Bonus
  }
  
  if (isInato) {
    skills += 1; // Inato Bonus at start
  }

  // Iteration for Levels 2 to Current
  for (let i = 2; i <= level; i++) {
    // If HR, we follow specific logic (usually simpler or defined by rules)
    // Assuming HR follows standard attribute increases (4,8,12,16,20) but NOT standard skill/aptitude table unless specified.
    // However, for game balance, usually Attributes match. 
    // Based on prompt: "HR follows unique table". 
    // We will apply Attribute increases to HR as well (standard RPG trope), but strictly follow table for others if explicitly separate.
    
    // Check for Attribute Increases (Levels 4, 8, 12, 16, 20)
    if ([4, 8, 12, 16, 20].includes(i)) {
      attributes += 1;
    }

    if (!isHR) {
        // Use Standard Table for Feiticeiros/Combatentes
        const entry = SORCERER_TABLE.find(e => e.level === i);
        if (entry) {
            entry.gains.forEach(gain => {
                if (gain.includes("Ponto de Habilidade")) skills += 1;
                if (gain.includes("Ponto de Aptidão")) aptitude += 1;
            });
        }
        // Inato Bonus at Level 5
        if (i === 5 && isInato) {
            skills += 1;
        }
    } else {
        // HR Logic (If any specific per-level resource gains exist besides attributes)
        // Prompt says "Unlisted levels gain only Base Stats (PV/PE)". 
        // So HR gets NO extra skills/aptitude from leveling table, only Features from HEAVENLY_TABLE.
    }
  }

  return {
    totalAttributes: attributes,
    totalSkills: skills,
    totalAptitude: aptitude,
    proficiencyBonus: getProficiencyBonus(level)
  };
};

export const getProficiencyBonus = (level: number): number => {
  // New Rule: Proficiency Bonus is equal to Liberação (LL), which is 2 * Level.
  return level * 2;
};

export const getNextLevelRewards = (currentLevel: number, origin: Origin): string[] => {
  const nextLevel = currentLevel + 1;
  if (nextLevel > 20) return ["Nível Máximo Alcançado"];

  const isHR = origin === Origin.RestricaoCelestial;
  
  if (isHR) {
    const entry = HEAVENLY_TABLE.find(e => e.level === nextLevel);
    // HR usually gets PV/PE on empty levels
    if (!entry) return ["Aumento de Status Base (PV + PE)"];
    return entry.gains;
  } else {
    const entry = SORCERER_TABLE.find(e => e.level === nextLevel);
    return entry ? entry.gains : ["Aumento de Status Base"];
  }
};
