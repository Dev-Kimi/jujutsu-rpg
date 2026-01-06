import { DieType, Technique } from '../types';

export const TECHNIQUE_TEMPLATES: Partial<Technique>[] = [
  {
    name: "Disparo de Energia Bruta",
    element: "Energia Pura",
    damageDie: DieType.d8,
    range: "Curto/Médio",
    description: "Um disparo concentrado de energia amaldiçoada sem propriedade elemental. Causa dano contundente ou de força.",
    cost: "Varia"
  },
  {
    name: "Manipulação de Chamas",
    element: "Fogo",
    damageDie: DieType.d8,
    range: "Área/Cone",
    description: "Gera chamas intensas que queimam o alvo. Pode causar dano contínuo se o alvo falhar em resistência.",
    cost: "Varia"
  },
  {
    name: "Manipulação de Água/Sangue",
    element: "Água",
    damageDie: DieType.d6,
    range: "Médio",
    description: "Controle fluído de líquidos. O dano é menor, mas oferece mais controle de grupo ou utilidade defensiva.",
    cost: "Varia"
  },
  {
    name: "Descarga Elétrica",
    element: "Eletricidade",
    damageDie: DieType.d8,
    range: "Linha",
    description: "Um raio rápido e letal. Tem alta chance de atordoar alvos metálicos ou molhados.",
    cost: "Varia"
  },
  {
    name: "Onda de Gravidade",
    element: "Gravidade",
    damageDie: DieType.d6,
    range: "Área",
    description: "Aumenta o peso sobre o alvo, esmagando-o contra o chão. Excelente para causar condição 'Impedido'.",
    cost: "Varia"
  },
  {
    name: "Ressonância Sonora",
    element: "Som",
    damageDie: DieType.d6,
    range: "Cone",
    description: "Ataques baseados em vibração que ignoram durabilidade externa. Pode causar surdez ou desorientação.",
    cost: "Varia"
  },
  {
    name: "Shikigami Simples",
    element: "Invocação",
    damageDie: DieType.d6,
    range: "Remoto",
    description: "Invoca um familiar para atacar independentemente. O shikigami possui seus próprios turnos ou age no seu.",
    cost: "Fixo"
  },
  {
    name: "Corte Dimensional",
    element: "Espaço",
    damageDie: DieType.d10,
    range: "Curto",
    description: "Uma técnica avançada que corta o próprio espaço. Ignora redução de dano convencional.",
    cost: "Alto"
  }
];