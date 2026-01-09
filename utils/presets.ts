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
  // Tier 1
  {
    name: "Análise de Energia",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "Nenhum",
    description: "[Passiva] Tier 1 - Requisitos: Nível 1. Permite ver pegadas e rastros de Energia Amaldiçoada deixados a até 1 hora. Concede +5 em testes de Sobrevivência ou Investigação para seguir um alvo."
  },
  {
    name: "Reforço de Arma",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "1 PE + X CE",
    description: "[Livre] Tier 1 - Requisitos: Nível 2, Aprimoramento de Fluxo. Antes de um ataque, gaste X CE (até sua LL). Adicione Xd4 de dano a esse ataque com arma."
  },
  {
    name: "Aprimoramento de Fluxo",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "3 PE",
    description: "[Livre] Tier 1 - Requisitos: Nível 2. Adicione um bônus de +2 em uma única rolagem de perícia, ataque ou defesa."
  },
  {
    name: "Amortecimento Sonoro",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "2 PE",
    description: "[Livre] Tier 1 - Requisitos: Nível 3, Furtividade. Você envolve seus pés e equipamentos com uma fina camada de energia para abafar o atrito. Você ganha Vantagem em testes de Furtividade por 1 minuto."
  },
  // Tier 2
  {
    name: "Supressão de Energia Amaldiçoada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "3 PE",
    description: "[Livre] Tier 2 - Requisitos: Nível 4. O personagem faz um teste de Feitiçaria para suprimir seu fluxo. O resultado define a CD (Classe de Dificuldade) para ser detectado. Não aparece na detecção passiva de outros."
  },
  {
    name: "Estímulo Muscular",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "4 PE",
    description: "[Livre] Tier 2 - Requisitos: Nível 5. Você recebe um bônus de +2 em todas as rolagens de perícias físicas."
  },
  {
    name: "Reforço Mental",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "5 PE",
    description: "[Livre/Reação] Tier 2 - Requisitos: Nível 5. Você protege com energia amaldiçoada o canal que liga alguma parte do seu corpo ao cérebro. Ao ser alvo de um efeito que força seu corpo ou sua vontade, você pode fazer um teste de Vontade ou Fortitude. Você ganha um bônus de +5 nesse teste. (Pode ser usado com reação, mas sem bônus no teste no turno)."
  },
  {
    name: "Imbuir Propriedade",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "3 PE + 5 CE",
    description: "[Movimento] Tier 2 - Requisitos: Nível 6. Ao tocar um alvo você imbui ele com uma propriedade neutra de sua técnica inata. Essa propriedade pode conceder um bônus de acordo com a técnica inata do usuário, podendo ser em rolagens, efeito de status e até imunidade à critério do Mestre."
  },
  {
    name: "Presença Amaldiçoada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "Nenhum",
    description: "[Passiva] Tier 2 - Requisitos: Nível 9, Análise de Energia. Faça um teste oposto de Intimidação vs. Vontade contra um alvo. Se bem-sucedido, o alvo sofre -3 na próxima rolagem contra você. Não funciona contra inimigos mais fortes ou com mesma força que você."
  },
  {
    name: "Punho Divergente",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "2 PE",
    description: "[Livre] Tier 2 - Requisitos: Nível 10. Você atrasa a liberação de sua energia no corpo do alvo para pegá-lo de surpresa. Ao acertar um inimigo, faça-o rolar um teste de Fortitude ou Reflexos (o que for maior), se for menor que seu teste de ataque ele fica atordoado. Se o inimigo bloquear um soco com essa técnica ele deve rolar o mesmo teste, se falhar perde o contra-ataque que ganharia ao bloquear."
  },
  // Tier 3
  {
    name: "Percepção de Energia Amaldiçoada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "Nenhum",
    description: "[Passivo] Tier 3 - Requisitos: Nível 8, Análise de Energia. Sua leitura de energia se torna instintiva. Você não pode ser surpreendido por inimigos que possuam Energia Amaldiçoada (mesmo invisíveis), a menos que eles estejam usando Ocultação de Presença com sucesso superior à sua Percepção Passiva."
  },
  {
    name: "Colapsar Estrutura",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "4 PE + X CE",
    description: "[Padrão] Tier 3 - Requisitos: Nível 11, Ressonância de Energia. Você toca uma estrutura inanimada (parede, chão, pilar, veículo) e injeta energia bruta até ela colapsar. Você causa 4 vezes a quantidade de CE investida de dano."
  },
  {
    name: "Ataque Disperso",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "5 PE",
    description: "[Livre] Tier 3 - Requisitos: Nível 12. Você manipula sua energia para explodir ao contato ao invés de apenas se concentrar em um ponto. A área do ataque aumenta para um Cone de 3 metros ou Linha de 6 metros."
  },
  {
    name: "Ressonância de Energia",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "5 PE + 5 CE",
    description: "[Livre] Tier 3 - Requisitos: Nível 13. Você vibra sua energia para penetrar a defesa do oponente no impacto. Seu próximo ataque corpo a corpo ignora completamente a Redução de Dano (RD) do alvo (seja por armadura, pele dura ou técnica)."
  },
  // Tier 4
  {
    name: "Estímulo Muscular Avançado",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "5 PE",
    description: "[Livre] Tier 4 - Requisitos: Nível 14, Estímulo Muscular. Você recebe +3 em rolagens de perícias físicas."
  },
  {
    name: "Impulso nos Pés",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "4 PE",
    description: "[Livre] Tier 4 - Requisitos: Nível 15, Estímulo Muscular Avançado. Uma vez por turno, você pode liberar uma explosão controlada de energia amaldiçoada de seus pés para ganhar um impulso momentâneo de velocidade. Seu deslocamento de movimento aumenta em 3 metros e recebe +2 em rolagens que envolve movimento durante este turno."
  },
  {
    name: "Aderência Amaldiçoada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "5 PE",
    description: "[Livre] Tier 4 - Requisitos: Nível 16. Você concentra energia na sola dos pés ou palmas das mãos. Permite caminhar em superfícies verticais ou no teto como se fosse chão normal, deixando as mãos livres."
  },
  {
    name: "Voar",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Manipulação",
    cost: "10 PE/turno",
    description: "[Livre] Tier 4 - Requisitos: Nível 20, Impulso nos Pés. Seu físico se aprimorou ao ponto de conseguir voar dando \"mini pulos\" no ar."
  },

  // --- HABILIDADES AMALDIÇOADAS: BARREIRAS (DOMÍNIO) ---
  // Tier 1
  {
    name: "Cortina",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "X CE",
    description: "[Completa] Tier 1 - Requisitos: Nível 1, Treinado em Feitiçaria. Cria uma barreira visual e de detecção com 50m de raio. Dura 1 hora por ponto de aptidão em barreira."
  },
  // Tier 2
  {
    name: "Barreira",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "Até sua Liberação de CE",
    description: "[Completa] Tier 2 - Requisitos: Nível 4, Cortina. Por 1 hora, você cria uma barreira opaca de 3m x 3m em um local que possa ver. Ela possui 3 vezes a quantidade de vida que o usuário usou na criação."
  },
  {
    name: "Domínio Simples",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "15 PE + 15 CE/turno",
    description: "[Padrão] Tier 2 - Requisitos: Nível 5. Cria uma área de 2m de raio que anula o acerto garantido de uma Expansão de Domínio inimiga."
  },
  {
    name: "Espaço em Batalha",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "Nenhum",
    description: "[Livre] Tier 2 - Requisitos: Nível 8. Você pode usar sua Reação para atacar qualquer criatura que entre num raio de seu domínio simples com um bônus de +5."
  },
  // Tier 3
  {
    name: "Cortina Seletiva",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "+10 CE",
    description: "[Livre] Tier 3 - Requisitos: Nível 9. Ao criar uma Cortina, você pode adicionar uma condição simples (ex: \"Pessoas comuns não podem sair da barreira\" ou \"O sinal de celular é bloqueado dentro\"). Requer um Voto Vinculativo simples na hora da criação."
  },
  {
    name: "Amplificação de Domínio",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "15 PE + 15 CE/turno",
    description: "[Livre] Tier 3 - Requisitos: Nível 11. Enquanto ativa, anula o efeito de uma técnica amaldiçoada que entre na área do seu toque. Você não pode usar sua técnica enquanto usa essa habilidade."
  },
  {
    name: "Dominância Absoluta",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "Nenhum",
    description: "[Passiva] Tier 3 - Requisitos: Nível 14, Domínio Simples. Enquanto seu Domínio Simples está ativo, você pode fazer um ataque de oportunidade (sem gastar Reação) contra quem entrar na área. Limite de um por turno de inimigo."
  },
  // Tier 4
  {
    name: "Expansão de Domínio (Incompleta)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "50 PE + 50 CE",
    description: "[Completa] Tier 4 - Requisitos: Nível 12, Espaço em Batalha. Cria uma área de 15m de raio por 2 turnos. Você pode usar sua técnica principal sem custo de CE dentro dela. Causa Exaustão de Técnica."
  },
  {
    name: "Expansão de Domínio (Completa)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Barreiras",
    cost: "100 PE + 150 CE",
    description: "[Completa] Tier 4 - Requisitos: Nível 16, Expansão de Domínio (Incompleta). Cria uma barreira de 15m de raio. Seus ataques de técnica amaldiçoada têm acerto garantido. Causa Exaustão de Técnica."
  },

  // --- HABILIDADES AMALDIÇOADAS: ENERGIA REVERSA (RCT) ---
  // Tier 3
  {
    name: "Energia Reversa (Autocura)",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "2 PE + X CE",
    description: "[Padrão] Tier 3 - Requisitos: Nível 10. Você recupera uma quantidade de PV igual a: (CE investido) d6"
  },
  {
    name: "Estabilização de Energia Reversa",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "5 PE + X CE",
    description: "[Completa] Tier 3 - Requisitos: Nível 10. Toca um aliado Moribundo. Ele para de fazer testes de morte e estabiliza automaticamente, mas permanece inconsciente com 1 PV."
  },
  {
    name: "Purificação",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "3 PE + X CE",
    description: "[Padrão] Tier 3 - Requisitos: Nível 10, Energia Reversa. Permite purificar a energia residual de um local amaldiçoado ou suprimir temporariamente o poder de um Objeto Amaldiçoado de baixo nível. O CE necessário para a purificação varia de objeto para objeto."
  },
  {
    name: "Liberação de Energia Reversa",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "5 PE + X CE",
    description: "[Padrão] Tier 3 - Requisitos: Nível 11, Autocura. Um aliado adjacente recupera (CE investido)d4 (não pode aumentar)."
  },
  {
    name: "Desintoxicação",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "3 PE + 10 CE",
    description: "[Padrão] Tier 3 - Requisitos: Nível 12. Usa energia positiva para purificar o sangue. Remove condições físicas como Envenenado, Paralisado (se for veneno/físico) ou Doente."
  },
  // Tier 4
  {
    name: "Cura Amplificada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "Nenhum",
    description: "[Passivo] Tier 4 - Requisitos: Nível 14, Autocura. O dado de autocura aumenta de d6 para d8."
  },
  {
    name: "Canalizar Energia Reversa",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "10 PE + X CE",
    description: "[Movimento] Tier 4 - Requisitos: Nível 16, Liberação. Seu próximo ataque corpo-a-corpo contra uma maldição causa 3x o dano do ataque."
  },
  {
    name: "Cura em Grupo",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "8 PE + X CE (mín. 20)",
    description: "[Completa] Tier 4 - Requisitos: Nível 15, Liberação e Cura Amplificada. Todos os aliados num raio de 2m recuperam (CE investido)d4 de vida."
  },
  {
    name: "Fluxo Constante",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "Mesmo da Autocura",
    description: "[Nenhuma] Tier 4 - Requisitos: Nível 18, Cura Amplificada. Uma vez por turno, você pode usar Autocura como uma Ação de Movimento no início da sua vez, pagando apenas o custo em CE."
  },
  // Tier 5
  {
    name: "Regeneração Aprimorada",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "15 PE",
    description: "[Padrão] Tier 5 - Requisitos: Nível 20, Fluxo Constante. Permite regenerar membros perdidos."
  },
  {
    name: "Recuperação de Técnica",
    category: "Habilidades Amaldiçoadas",
    subCategory: "Energia Reversa",
    cost: "50 PE",
    description: "[Completa] Tier 5 - Requisitos: Nível 20, Regeneração Aprimorada. Você explode a parte o seu cérebro onde fica guardada sua técnica amaldiçoada e regenera ela com Energia Reversa, retirando a condição Exaustão de Técnica."
  }
];
