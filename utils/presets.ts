import { Ability } from '../types';

export const PRESET_ABILITIES: Partial<Ability>[] = [
  // --- COMBATENTE ---
  {
    name: "Ataque Especial",
    category: "Combatente",
    cost: "3 PE",
    description: "[Livre] Uma vez por turno, ganha +5 no próximo ataque corpo a corpo."
  },
  {
    name: "Investida de Ombro",
    category: "Combatente",
    cost: "3 PE",
    description: "[Livre] Ao mover 3m em linha reta e terminar adjacente, teste de Atletismo vs Fortitude. Vitória: empurra 3m e deixa Caído."
  },
  {
    name: "Redirecionamento",
    category: "Combatente",
    cost: "5 PE",
    description: "[Reação] Quando inimigo erra ataque corpo a corpo, teste Luta vs Reflexos para derrubá-lo."
  },
  {
    name: "Golpe Pesado",
    category: "Combatente",
    cost: "3 PE",
    description: "[Livre] Aceita -5 no ataque para adicionar +1 dado da arma no dano (ou metade da Liberação se desarmado)."
  },
  {
    name: "Aceleração Repentina",
    category: "Combatente",
    cost: "10 PE",
    description: "[Livre] No início do turno, seu movimento dobra e ganha uma Ação de Movimento extra."
  },
  {
    name: "Resistência Inabalável",
    category: "Combatente",
    cost: "8 PE",
    description: "[Reação] Ao falhar em Fortitude, rerrola o teste. Deve usar o novo resultado."
  },
  {
    name: "Intervenção",
    category: "Combatente",
    cost: "5 PE",
    description: "[Reação] Interfere em ataque contra aliado a até 9m (ex: bloqueando ou jogando arma)."
  },
  {
    name: "Ataque Oportunista",
    category: "Combatente",
    cost: "4 PE",
    description: "[Padrão] Ataque contra inimigo adjacente a parede/objeto. Acerto: Dano + Empurra 3m ou Caído."
  },
  {
    name: "Golpes Consecutivos",
    category: "Combatente",
    cost: "12 PE",
    description: "[Padrão] Dois ataques corpo a corpo rápidos. Ambos com -2 no teste de acerto."
  },
  {
    name: "Impacto Ressonante",
    category: "Combatente",
    cost: "15 PE",
    description: "[Padrão] Ataque corpo a corpo com onda de choque. Acerto: Dano + Teste de Fortitude do alvo. Falha: Atordoado."
  },
  {
    name: "Quebra-Barreiras",
    category: "Combatente",
    cost: "8 PE",
    description: "[Livre] Próximo ataque ignora qualquer Redução de Dano (RD) simples."
  },
  {
    name: "Parry",
    category: "Combatente",
    cost: "15 PE",
    description: "[Reação] Ao bloquear ataque corpo a corpo, desvia o dano e contra-ataca instantaneamente."
  },
  {
    name: "Pisão",
    category: "Combatente",
    cost: "20 PE",
    description: "[Movimento] Golpeia o chão. Raio 4m: Reflexos ou Caído. Torna terreno difícil."
  },
  {
    name: "Vontade Assassina",
    category: "Combatente",
    cost: "10 PE",
    description: "[Livre] Aura de pressão. Quem vê faz Vontade vs Presença. Falha: Prejudicado por 1 rodada."
  },
  {
    name: "Interromper Técnica",
    category: "Combatente",
    cost: "25 PE",
    description: "[Livre] Ao acertar inimigo concentrando, ele faz Fortitude. Falha: Perde a técnica."
  },
  {
    name: "Reforço Corporal Concentrado",
    category: "Combatente",
    cost: "30 PE",
    description: "[Reação] Ao sofrer Crítico, teste Reflexos vs Ataque para transformar em acerto normal. Fica Atordoado após uso."
  },
  {
    name: "Berserker",
    category: "Combatente",
    cost: "20 PE",
    description: "[Livre] Ao zerar PV de inimigo ou Critar, ganha 1 Ação Padrão extra."
  },
  {
    name: "Finalizador Implacável",
    category: "Combatente",
    cost: "Passivo",
    description: "Ataques contra caídos/atordoados/imóveis causam dano extra igual ao bônus de Luta."
  },
  {
    name: "Último Recurso",
    category: "Combatente",
    cost: "Todo PE",
    description: "[Completa] Ao chegar a 0 PV, ignora Moribundo por 2 rodadas. Se não curar, morre ao fim."
  },
  {
    name: "Reforço Corporal Avançado",
    category: "Combatente",
    cost: "Passivo",
    description: "Aumenta o dado de reforço corporal (ex: d4 para d6)."
  },

  // --- FEITICEIRO ---
  {
    name: "Economia de Fluxo",
    category: "Feiticeiro",
    cost: "Passivo",
    description: "Reduz custo de CE de técnicas em metade do bônus de Inteligência."
  },
  {
    name: "Técnica Precisa",
    category: "Feiticeiro",
    cost: "3 PE",
    description: "[Movimento] Em técnica de área, seleciona INT criaturas para não serem afetadas."
  },
  {
    name: "Técnica Penetrante",
    category: "Feiticeiro",
    cost: "3 PE",
    description: "[Livre] Força penalidade de -2 na resistência do alvo contra a técnica."
  },
  {
    name: "Previsão",
    category: "Feiticeiro",
    cost: "4 PE",
    description: "[Reação] Feitiçaria vs Ataque (Projétil). Sucesso: +2 na Defesa."
  },
  {
    name: "Técnica Persistente",
    category: "Feiticeiro",
    cost: "5 PE/Rodada",
    description: "[Livre] Mantém técnica ativa sem gastar ação ou CE novamente (gasta 2 PE/turno)."
  },
  {
    name: "Disparo Curvo",
    category: "Feiticeiro",
    cost: "5 PE",
    description: "[Livre] Projétil ignora cobertura se houver trajeto possível."
  },
  {
    name: "Amortecer Queda",
    category: "Feiticeiro",
    cost: "2 PE + X CE",
    description: "[Reação] Reduz dano de impacto em 2x o CE gasto."
  },
  {
    name: "Análise de Energia Avançada",
    category: "Feiticeiro",
    cost: "3 PE",
    description: "[Padrão] Teste de Feitiçaria para revelar informações mecânicas do alvo."
  },
  {
    name: "Leitura de Centelha",
    category: "Feiticeiro",
    cost: "5 PE",
    description: "[Reação] Intuição vs Enganação. Sucesso: Soma Presença nos Reflexos contra o ataque."
  },
  {
    name: "Manifestação Rápida",
    category: "Feiticeiro",
    cost: "10 PE",
    description: "[Livre] Usa técnica de Ação Padrão como Movimento. (1/combate)."
  },
  {
    name: "Passo de Hermes",
    category: "Feiticeiro",
    cost: "8 PE",
    description: "[Movimento] Impulso aéreo para mudar direção ou dar passo extra."
  },
  {
    name: "Foco Arcano",
    category: "Feiticeiro",
    cost: "5 PE",
    description: "[Movimento] Próxima técnica ganha +2 no acerto."
  },
  {
    name: "Liberação Máxima",
    category: "Feiticeiro",
    cost: "50 PE + 20 CE",
    description: "[Completa] Alcance dobra, dano maximizado."
  },
  {
    name: "Domínio de Técnica",
    category: "Feiticeiro",
    cost: "Passivo",
    description: "Multiplicador de dados da técnica aumenta em 1."
  },
  {
    name: "Marca de Energia",
    category: "Feiticeiro",
    cost: "5 PE",
    description: "[Livre] Ao causar dano com técnica, marca inimigo por 1h (impede furtividade)."
  },
  {
    name: "Técnica Adaptativa",
    category: "Feiticeiro",
    cost: "Variável PE",
    description: "[Livre] Gaste PE para alterar propriedade da técnica (tipo de dano, área, condição)."
  },
  {
    name: "Conjuração Múltipla",
    category: "Feiticeiro",
    cost: "30 PE",
    description: "[Movimento] Permite manter duas habilidades de Concentração ativas."
  },
  {
    name: "Ativação Remota",
    category: "Feiticeiro",
    cost: "15 PE",
    description: "[Movimento] Projeta origem da técnica a até 5m (ignora cobertura frontal)."
  },
  {
    name: "Restauração de Técnica",
    category: "Feiticeiro",
    cost: "50 PE + 40 CE",
    description: "[Completa] Remove condição Exaustão de Técnica usando RCT. (1/sessão)."
  },

  // --- ESPECIALISTA ---
  {
    name: "Visão de Campo",
    category: "Especialista",
    cost: "2 PE",
    description: "[Movimento/Reação] Concede +2 no ataque ou defesa de aliado a 10m."
  },
  {
    name: "Primeiros Socorros",
    category: "Especialista",
    cost: "3 PE",
    description: "[Completa] Medicina cura PV igual ao teste ou remove condição física."
  },
  {
    name: "Análise Tática",
    category: "Especialista",
    cost: "3 PE",
    description: "[Movimento] Tática vs Luta. Sucesso: Vantagem no próximo ataque contra o alvo."
  },
  {
    name: "Formação Falange",
    category: "Especialista",
    cost: "5 PE",
    description: "[Completa] Aliados adjacentes ganham +2 na Defesa."
  },
  {
    name: "Olhar Desmoralizante",
    category: "Especialista",
    cost: "6 CE",
    description: "[Movimento] Intimidação vs Vontade. Falha: Alvo Prejudicado (-2) no próximo turno."
  },
  {
    name: "Comando Tático",
    category: "Especialista",
    cost: "10 PE",
    description: "[Padrão] Aliado usa Reação para realizar Movimento ou Ataque Básico."
  },
  {
    name: "Rota de Fuga",
    category: "Especialista",
    cost: "8 PE",
    description: "[Reação] Aliado move metade do deslocamento sem ataque de oportunidade."
  },
  {
    name: "Explorar Abertura",
    category: "Especialista",
    cost: "8 PE",
    description: "[Reação] Quando inimigo falha ataque, ele sofre -2 na defesa contra próximo acerto."
  },
  {
    name: "Sabotagem Localizada",
    category: "Especialista",
    cost: "12 PE",
    description: "[Padrão] Cria Terreno Difícil 3x3m. Inimigos ficam Prejudicados na área."
  },
  {
    name: "Intervenção Protetora",
    category: "Especialista",
    cost: "15 PE",
    description: "[Reação] Aliado a 3m recebe +5 Defesa contra um ataque."
  },
  {
    name: "Plano de Contingência",
    category: "Especialista",
    cost: "20 PE",
    description: "[Reação] Aliado rerrola teste de resistência falho."
  },
  {
    name: "Ataque Sincronizado",
    category: "Especialista",
    cost: "15 PE",
    description: "[Padrão] Você e aliado atacam. Alvo recebe desvantagem na defesa."
  },
  {
    name: "Maestria de Recurso",
    category: "Especialista",
    cost: "Passiva",
    description: "Recupera 1 PE ao usar habilidade de Especialista que custe PE."
  },
  {
    name: "Orquestrar Campo",
    category: "Especialista",
    cost: "25 PE",
    description: "[Padrão] Dois aliados movem metade do deslocamento imediatamente."
  },
  {
    name: "Cura Avançada",
    category: "Especialista",
    cost: "20 PE + 10 CE",
    description: "[Completa] Cura PV e remove condições graves (Veneno, Paralisia, Cegueira, Surdez, Atordoamento)."
  },
  {
    name: "Antecipar Movimento",
    category: "Especialista",
    cost: "40 PE",
    description: "[Reação] Tática vs Intuição. Sucesso: Ação do inimigo falha e é perdida."
  },
  {
    name: "Reviver",
    category: "Especialista",
    cost: "60 PE + 20 CE",
    description: "[Completa] Acorda aliado caído/moribundo com PV = (INT/2 + Nível)."
  },
  {
    name: "Plano Mestre",
    category: "Especialista",
    cost: "50 PE",
    description: "[Completa] Troca ordem de iniciativa de dois aliados permanentemente."
  },
  {
    name: "Xeque-Mate",
    category: "Especialista",
    cost: "40 PE",
    description: "[Livre] Maximiza dano de aliado contra inimigo com condição negativa."
  },
  {
    name: "Veterano de Guerra",
    category: "Especialista",
    cost: "Passiva",
    description: "Pode usar habilidade de comando como Ação Livre 1x/rodada."
  },

  // --- RESTRIÇÃO CELESTIAL ---
  {
    name: "Potência Física",
    category: "Restrição Celestial",
    cost: "5 PE",
    description: "[Livre] Adiciona +5 ao teste de acerto físico."
  },
  {
    name: "Passo Fantasma",
    category: "Restrição Celestial",
    cost: "2 PE",
    description: "[Movimento] Não provoca ataque de oportunidade e atravessa inimigos."
  },
  {
    name: "Sentidos de Perigo",
    category: "Restrição Celestial",
    cost: "Passivo",
    description: "Soma Presença na Iniciativa. Nunca é surpreendido."
  },
  {
    name: "Desarme Brutal",
    category: "Restrição Celestial",
    cost: "3 PE",
    description: "[Padrão] Luta vs Luta. Sucesso desarma e joga item a 3m."
  },
  {
    name: "Caçador de Xamãs",
    category: "Restrição Celestial",
    cost: "3 PE",
    description: "[Reação] Ataque contra conjuração a 9m. Acerto força Fortitude ou cancela técnica."
  },
  {
    name: "Improvisação Letal",
    category: "Restrição Celestial",
    cost: "Passivo",
    description: "Objetos contam como armas. Armas de fogo à queima-roupa sem desvantagem."
  },
  {
    name: "Evasão Instintiva",
    category: "Restrição Celestial",
    cost: "4 PE",
    description: "[Reação] Se passar em Reflexos contra área, não sofre dano nenhum."
  },
  {
    name: "Quebra de Postura",
    category: "Restrição Celestial",
    cost: "4 PE",
    description: "[Livre] Se ataque acertar, alvo fica Vulnerável."
  },
  {
    name: "Resiliência Inumana",
    category: "Restrição Celestial",
    cost: "5 PE",
    description: "[Reação] Rerrola teste de resistência física falho."
  },
  {
    name: "Ataque no Ponto Cego",
    category: "Restrição Celestial",
    cost: "Passivo",
    description: "Ataque contra alvo que não te vê é Crítico Automático."
  },
  {
    name: "Matança Silenciosa",
    category: "Restrição Celestial",
    cost: "6 PE",
    description: "[Efeito] Se ataque furtivo zerar PV, alvo morre silenciosamente."
  },
  {
    name: "Limite Rompido",
    category: "Restrição Celestial",
    cost: "10 PE",
    description: "[Padrão] Destrói barreira de Domínio com um ataque físico."
  },

  // --- HABILIDADES AMALDIÇOADAS: MANIPULAÇÃO (FLUXO) ---
  {
    name: "Análise de Energia",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "Passivo",
    description: "Vê rastros de CE de até 1 hora. +5 em Sobrevivência/Investigação para rastrear."
  },
  {
    name: "Aprimoramento de Fluxo",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "3 PE",
    description: "+2 em uma rolagem de perícia, ataque ou defesa."
  },
  {
    name: "Amortecimento Sonoro",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "2 PE",
    description: "Vantagem em Furtividade por 1 minuto."
  },
  {
    name: "Supressão de Energia",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "3 PE",
    description: "Oculta presença. Teste de Feitiçaria define a CD."
  },
  {
    name: "Estímulo Muscular",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "2 PE",
    description: "+2 em ataques corpo a corpo no próximo turno."
  },
  {
    name: "Imbuir Propriedade",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "3 PE",
    description: "Imbui alvo com propriedade neutra da técnica inata."
  },
  {
    name: "Presença Amaldiçoada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "2 PE",
    description: "Intimidação vs Vontade. Alvo sofre -3 na próxima rolagem contra você."
  },
  {
    name: "Reforço de Arma",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "1 PE + X CE",
    description: "Adiciona X de dano ao ataque com arma (Max LL)."
  },
  {
    name: "Reforço Mental",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "2 PE",
    description: "[Reação] +5 em teste de Vontade ou Fortitude."
  },
  {
    name: "Ataque Disperso",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "3 PE",
    description: "Aumenta área do ataque (Cone ou Linha)."
  },
  {
    name: "Punho Divergente",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "3 PE + 4 CE",
    description: "Sofre -5 no ataque para causar dano extra igual à Liberação."
  },
  {
    name: "Percepção de Energia",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "Passiva",
    description: "Não pode ser surpreendido por inimigos com Energia Amaldiçoada."
  },
  {
    name: "Estímulo Muscular Avançado",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "5 PE",
    description: "+3 ataque e +2 defesa por turnos iguais ao Vigor."
  },
  {
    name: "Impulso nos Pés",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "4 PE",
    description: "+3m deslocamento e +2 em rolagens de movimento."
  },
  {
    name: "Aderência Amaldiçoada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "2 PE",
    description: "Permite caminhar em paredes/tetos."
  },
  {
    name: "Ressonância de Energia",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "5 PE + 5 CE",
    description: "Próximo ataque ignora RD do alvo."
  },
  {
    name: "Colapsar Estrutura",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "6 PE + X CE",
    description: "Dobra dano contra estruturas inanimadas."
  },
  {
    name: "Kokusen (Raio Negro)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "Especial",
    description: "Ao rolar 20 natural no ataque. Dano ^ 2.5. Recupera CE."
  },

  // --- HABILIDADES AMALDIÇOADAS: BARREIRAS ---
  {
    name: "Cortina (Tobaril)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "X CE",
    description: "Ritual. Cria cúpula de 50m raio. Oculta interior."
  },
  {
    name: "Barreira",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "10+ CE",
    description: "Cria parede de 3x3m com PV = 3x custo investido."
  },
  {
    name: "Domínio Simples",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "3 PE + 15 CE/T",
    description: "Raio 2m. Anula acerto garantido de Domínio."
  },
  {
    name: "Velo (Barreira Simples)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "5 CE",
    description: "Cria barreira invisível fraca. Alerta se alguém cruzar."
  },
  {
    name: "Espaço em Batalha",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "5 CE/T",
    description: "[Reação] Ataca quem entra no domínio simples com +5."
  },
  {
    name: "Cortina Seletiva",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "+10 CE",
    description: "Adiciona condição à cortina (ex: bloquear sinal)."
  },
  {
    name: "Amplificação de Domínio",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "5 PE + 10 CE/T",
    description: "Anula efeito de técnica que o atinja ao envolver-se em aura."
  },
  {
    name: "Dominância Absoluta",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "Passiva",
    description: "Ataque de oportunidade grátis contra quem entra no Domínio Simples."
  },
  {
    name: "Expansão de Domínio (Incompleta)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "50 CE",
    description: "Área 15m, 2 turnos. Técnica sem custo de CE dentro."
  },
  {
    name: "Expansão de Domínio (Completa)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "150/200 CE",
    description: "Barreira 15m. Acerto Garantido da Técnica Inata."
  },

  // --- HABILIDADES AMALDIÇOADAS: ENERGIA REVERSA (RCT) ---
  {
    name: "Energia Reversa (Autocura)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "2 PE + X CE",
    description: "Recupera PV igual a (CE investido)d6."
  },
  {
    name: "Estabilização",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "2 PE + X CE",
    description: "Estabiliza aliado na condição Moribundo."
  },
  {
    name: "Purificação",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "X CE",
    description: "Purifica energia residual ou objetos amaldiçoados."
  },
  {
    name: "Liberação de Energia Reversa",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "4 PE + X CE",
    description: "Cura aliado (d4 de cura por ponto de CE)."
  },
  {
    name: "Desintoxicação",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "3 PE + 10 CE",
    description: "Remove veneno, paralisia ou doença."
  },
  {
    name: "Cura Amplificada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "Passiva",
    description: "Dado de autocura sobe para d8."
  },
  {
    name: "Canalizar Energia Reversa",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "10 PE + X CE",
    description: "Imbui ataque para causar dobro de dano em maldições."
  },
  {
    name: "Cura em Grupo",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "5 PE + X CE",
    description: "Cura aliados em raio de 2m (d4 por CE)."
  },
  {
    name: "Fluxo Constante",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "Igual Autocura",
    description: "[Livre] Realiza Autocura no início do turno."
  },
  {
    name: "Regeneração Aprimorada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "15 PE + 20 CE",
    description: "Regenera membros perdidos."
  }
];
