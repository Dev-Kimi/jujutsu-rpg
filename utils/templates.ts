import { DieType, Technique } from '../types';

export const PRESET_TECHNIQUES: Technique[] = [
  {
    id: 'projection-sorcery',
    name: "Projeção de Feitiçaria",
    category: "Inata",
    description: "Divide 1 segundo em 24 quadros. Permite movimento extremamente veloz (+50% a +150% Deslocamento) e aprisionamento de inimigos em frames de animação.",
    subTechniques: [
      {
        id: 'proj-move',
        name: "Projeção (Movimento)",
        usage: "Ação de Movimento",
        description: "Gasta CE (LL) para ativar ou manter a regra dos 24fps. Ganha +1 Stack (Máx 3). Cada stack aumenta Deslocamento e Acerto. Ignora Ataques de Oportunidade."
      },
      {
        id: 'proj-barrier',
        name: "Barreira de Quadros",
        usage: "Reação",
        description: "Gasta CE (LL). Cria uma superfície plana congelada no ar que bloqueia projéteis/energia ou redireciona ataques em área."
      },
      {
        id: 'proj-trap',
        name: "Quadro de Frame",
        usage: "Ação Padrão (2 PE)",
        description: "Toque. Teste de Luta vs Reflexos. Se vencer, o alvo é transformado em um quadro de animação 2D, ficando Imóvel e Indefeso até ser quebrado ou o turno acabar."
      }
    ]
  }
];

export const TECHNIQUE_TEMPLATES: Partial<Technique>[] = [
  {
    name: "Disparo de Energia Bruta",
    description: "Um disparo concentrado de energia amaldiçoada sem propriedade elemental. Causa dano contundente ou de força.",
  },
  {
    name: "Manipulação de Chamas",
    description: "Gera chamas intensas que queimam o alvo. Pode causar dano contínuo se o alvo falhar em resistência.",
  },
  {
    name: "Manipulação de Água/Sangue",
    description: "Controle fluído de líquidos. O dano é menor, mas oferece mais controle de grupo ou utilidade defensiva.",
  },
  {
    name: "Descarga Elétrica",
    description: "Um raio rápido e letal. Tem alta chance de atordoar alvos metálicos ou molhados.",
  },
  {
    name: "Onda de Gravidade",
    description: "Aumenta o peso sobre o alvo, esmagando-o contra o chão. Excelente para causar condição 'Impedido'.",
  },
  {
    name: "Ressonância Sonora",
    description: "Ataques baseados em vibração que ignoram durabilidade externa. Pode causar surdez ou desorientação.",
  },
  {
    name: "Shikigami Simples",
    description: "Invoca um familiar para atacar independentemente. O shikigami possui seus próprios turnos ou age no seu.",
  },
  {
    name: "Corte Dimensional",
    description: "Uma técnica avançada que corta o próprio espaço. Ignora redução de dano convencional.",
  }
];
