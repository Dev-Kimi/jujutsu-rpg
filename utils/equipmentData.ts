/**
 * REGRA DE DURABILIDADE:
 * A Durabilidade indica o limite seguro de CE que pode ser imbuído. 
 * Se o jogador investir mais CE do que a durabilidade permite num ataque (Sobrecarga), 
 * a arma quebra após o golpe.
 */

export interface MundaneWeapon {
  id: string;
  name: string;
  baseDamage: string;
  critical: string;
  type: "Corpo a Corpo" | "Distância";
}

export interface CursedToolGrade {
  grade: string;
  durabilityCost: string;
  effect: string;
  price: string;
}

export const MUNDANE_WEAPONS: MundaneWeapon[] = [
  { 
    id: "mw_1", 
    name: "Soco Inglês", 
    baseDamage: "1d4", 
    critical: "x2", 
    type: "Corpo a Corpo" 
  },
  { 
    id: "mw_2", 
    name: "Faca de Combate", 
    baseDamage: "1d6", 
    critical: "19-20 / x2", 
    type: "Corpo a Corpo" 
  },
  { 
    id: "mw_3", 
    name: "Karambit", 
    baseDamage: "1d6", 
    critical: "x2", 
    type: "Corpo a Corpo" 
  },
  { 
    id: "mw_4", 
    name: "Bastão Tático / Taco", 
    baseDamage: "1d8", 
    critical: "x2", 
    type: "Corpo a Corpo" 
  },
  { 
    id: "mw_5", 
    name: "Katana / Espada Longa", 
    baseDamage: "1d10", 
    critical: "19-20 / x2", 
    type: "Corpo a Corpo" 
  },
  { 
    id: "mw_6", 
    name: "Machado de Incêndio", 
    baseDamage: "1d10", 
    critical: "x3", 
    type: "Corpo a Corpo" 
  },
  { 
    id: "mw_7", 
    name: "Marreta Industrial", 
    baseDamage: "1d12", 
    critical: "x2", 
    type: "Corpo a Corpo" 
  },
  { 
    id: "mw_8", 
    name: "Naginata / Lança", 
    baseDamage: "1d10", 
    critical: "x3", 
    type: "Corpo a Corpo" 
  },
  { 
    id: "mw_9", 
    name: "Pistola (9mm)", 
    baseDamage: "2d4", 
    critical: "x2", 
    type: "Distância" 
  },
  { 
    id: "mw_10", 
    name: "Revólver (.38)", 
    baseDamage: "1d10", 
    critical: "x2", 
    type: "Distância" 
  },
  { 
    id: "mw_11", 
    name: "Rifle de Assalto", 
    baseDamage: "2d6", 
    critical: "x2", 
    type: "Distância" 
  },
  { 
    id: "mw_12", 
    name: "Rifle de Precisão", 
    baseDamage: "2d8", 
    critical: "19-20 / x3", 
    type: "Distância" 
  }
];

export const CURSED_TOOL_GRADES: CursedToolGrade[] = [
  {
    grade: "Grau 4",
    durabilityCost: "5 CE",
    effect: "Permite reforçar ataques com Energia Amaldiçoada sem risco de quebrar. Durável.",
    price: "¥ 500.000"
  },
  {
    grade: "Grau 3",
    durabilityCost: "10 CE",
    effect: "Feita com técnicas refinadas. Suporta mais carga de energia.",
    price: "¥ 2.000.000"
  },
  {
    grade: "Grau 2",
    durabilityCost: "15 CE",
    effect: "Pode possuir uma propriedade menor (ex: retorna à mão após arremesso).",
    price: "¥ 10.000.000"
  },
  {
    grade: "Grau 1",
    durabilityCost: "20 CE",
    effect: "Possui uma Técnica Inata própria (efeito ativo poderoso embutido na arma).",
    price: "¥ 100.000.000+"
  },
  {
    grade: "Grau Especial",
    durabilityCost: "+30 CE",
    effect: "Poderes que quebram regras do sistema ou distorcem a realidade.",
    price: "Inestimável"
  }
];
