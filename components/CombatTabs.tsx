import React, { useState, useEffect } from 'react';
import { Sword, Shield, Dices, ArrowRight, Layers, Crosshair, Hammer, X, Hexagon, Zap, CheckCircle } from 'lucide-react';
import { Character, DerivedStats, DieType, CurrentStats, Origin, Ability, Item } from '../types';
import { rollDice, parseAbilityCost, parseAbilityEffect, parseAndRollDice, getWeaponCELimit } from '../utils/calculations';
import { MUNDANE_WEAPONS } from '../utils/equipmentData';
import { logDiceRoll } from '../utils/diceRollLogger';

interface CombatTabsProps {
  char: Character;
  stats: DerivedStats;
  currentStats: CurrentStats;
  consumeCE: (amount: number) => void;
  consumePE: (amount: number) => void;
  activeBuffs?: Ability[];
  onConsumeBuffs?: (buffs: Ability[]) => void;
  activeRollResult: 'skill' | 'combat' | null;
  setActiveRollResult: (type: 'skill' | 'combat' | null) => void;
  onUpdateInventory?: (id: string, field: keyof Item, value: any) => void;
  onUpdateCharacter?: (field: keyof Character | Partial<Character>, value?: any) => void;
  campaignId?: string; // Optional campaign ID for logging rolls
  
  // Domain Props
  domainActive?: boolean;
  domainRound?: number;
  domainType?: 'incomplete' | 'complete' | null;
  onAdvanceDomain?: (force: boolean) => void;
  onCloseDomain?: () => void;
}

const Notification: React.FC<{
  notification: { id: string; message: string; type: 'success' | 'error' };
  onClose: (id: string) => void;
}> = ({ notification, onClose }) => {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border shadow-lg animate-in slide-in-from-right-2 duration-300 ${
        notification.type === 'success'
          ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          : 'bg-red-950/90 border-red-800 text-red-200'
      }`}
    >
      <CheckCircle
        size={18}
        className={notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'}
      />
      <span className="text-sm flex-1">{notification.message}</span>
      <button
        onClick={() => onClose(notification.id)}
        className="text-slate-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const CombatTabs: React.FC<CombatTabsProps> = ({
  char,
  stats,
  currentStats,
  consumeCE,
  consumePE,
  activeBuffs = [],
  onConsumeBuffs,
  activeRollResult,
  setActiveRollResult,
  onUpdateInventory,
  campaignId,
  domainActive,
  domainRound = 0,
  domainType,
  onAdvanceDomain,
  onCloseDomain,
  onUpdateCharacter
}) => {
  const [activeTab, setActiveTab] = useState<'physical' | 'defense'>('physical');
  const [invested, setInvested] = useState<number>(1);
  const [unarmedDamageDie, setUnarmedDamageDie] = useState<string>('1d4');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('unarmed');

  const [incomingDamage, setIncomingDamage] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{ total: number, detail: string, isDamageTaken?: boolean, weaponBroken?: boolean, title?: string, attackRoll?: number, attackRollDetail?: string, attackRolls?: number[], isCritical?: boolean, isCritSuccess?: boolean, isCritFail?: boolean, damageTotal?: number, defenseRoll?: number, defenseRollDetail?: string, attackHits?: boolean } | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; type: 'success' | 'error' }>
  >([]);
  const [manualDiceFormula, setManualDiceFormula] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

    // Identify equipped weapons from inventory
    const equippedWeapons = char.inventory.filter(item => {
        try {
          // Must be equipped and have valid ID
          if (!item.id || !char.equippedWeapons?.includes(item.id)) return false;

          // Must not be broken
          if (item.isBroken) return false;

          // 1. Check against Mundane Weapons List by Name
          const isMundane = MUNDANE_WEAPONS.some(mw => mw.name === item.name);
          // 2. Check description for "Dano: XdY" pattern (created by Catalog)
          const hasDamagePattern = item.description && /Dano:\s*\d+d\d+/i.test(item.description);

          return isMundane || hasDamagePattern;
        } catch (error) {
          console.error('Error filtering equipped weapon:', error, item);
          return false;
        }
    });

  const getWeaponDamageString = (item: Item): string => {
      try {
        // Try to find "Dano: 1d6" in description first
        const match = item.description?.match(/Dano:\s*(\d+d\d+(?:\+\d+)?)/i);
        if (match) return match[1];

        // Fallback to Catalog data
        const catalogItem = MUNDANE_WEAPONS.find(w => w.name === item.name);
        return catalogItem ? catalogItem.baseDamage : "1d4"; // Fallback default
      } catch (error) {
        console.error('Error getting weapon damage string:', error, item);
        return "1d4"; // Safe fallback
      }
  };

  const parseDice = (diceStr: string) => {
    const match = diceStr.match(/(\d+)d(\d+)/i);
    if (!match) return { count: 1, sides: 4 };
    return { count: parseInt(match[1]), sides: parseInt(match[2]) };
  };
  
  const getUnarmedImpactDie = (level: number): string => {
    if (level >= 16) return '2d10';
    if (level >= 11) return '2d8';
    if (level >= 6) return '2d6';
    return '2d4';
  };

  const getMaxRollFromDice = (diceStr: string) => {
    const { count, sides } = parseDice(diceStr);
    return count * sides;
  };

  const getSkillAttribute = (skillName: string): keyof Character['attributes'] => {
    const skill = char.skills.find(s => s.name === skillName);
    return (skill?.attribute as keyof Character['attributes']) || 'FOR';
  };

  const rollD20Pool = (diceCount: number) => {
    const count = Math.max(1, diceCount);
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(rollDice(20, 1));
    }
    const best = Math.max(...rolls);
    return { rolls, best };
  };

  const reset = () => {
    setLastResult(null);
    setActiveRollResult(null);
    setInvested(1);
    setIncomingDamage(0);
  };

  // --- Calculate Active Buffs ---
  const relevantBuffs = activeBuffs.filter(buff => {
    const effect = parseAbilityEffect(buff.description);
    if (activeTab === 'defense') return effect.defense > 0;
    return effect.attack > 0;
  });

  const totalBuffBonus = relevantBuffs.reduce((sum, buff) => {
    const effect = parseAbilityEffect(buff.description);
    return sum + (activeTab === 'defense' ? effect.defense : effect.attack);
  }, 0);

  const totalBuffCost = relevantBuffs.reduce((acc, buff) => {
    const cost = parseAbilityCost(buff.cost);
    return { pe: acc.pe + cost.pe, ce: acc.ce + cost.ce };
  }, { pe: 0, ce: 0 });

  const handleManualRoll = () => {
    if (!manualDiceFormula) return;
    
    const match = manualDiceFormula.match(/(\d+)?d(\d+)([+-]\d+)?/i);
    if (!match) {
        showNotification("Formato inválido. Use algo como '1d20', '4d6+2', etc.", 'error');
        return;
    }

    const count = parseInt(match[1] || '1');
    const faces = parseInt(match[2]);
    const modifier = parseInt(match[3] || '0');

    const rolls = [];
    let total = 0;
    for(let i=0; i<count; i++) {
        const r = Math.floor(Math.random() * faces) + 1;
        rolls.push(r);
        total += r;
    }
    total += modifier;

    const detail = `${count}d${faces}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}: [${rolls.join(', ')}]${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}`;
    const formula = `${count}d${faces}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}`;

    setLastResult({
        total,
        detail,
        title: "Rolagem Manual",
        attackRoll: total,
        attackRollDetail: detail,
        isCritical: false,
        isCritSuccess: false,
        isCritFail: false,
        damageTotal: total
    });
    setActiveRollResult('combat');
    showNotification(`${formula} ➜ ${total}`, 'success');
    
    if (campaignId) {
        logDiceRoll(campaignId, char.name, "Rolagem Manual", rolls, total, detail).catch(console.error);
    }
  };

  const handleRoll = () => {
    let total = 0;
    let detail = "";
    let actionCostCE = 0;
    let actionCostPE = 0;
    let isDamageTaken = false;
    let weaponBroken = false;
    let rollTitle = "Ataque";
    let loggedRolls: number[] = []; // Store rolls for logging
    let attackRoll: number | undefined = undefined;
    let attackRollDetail = "";
    let attackHits = true; // Always hits now that we removed opposed test
    let isCritical = false;
    let isCritSuccess = false;
    let isCritFail = false;
    let attackRolls: number[] = [];
    let damageTotal = 0;
    let defenseRoll: number | undefined = undefined;
    let defenseRollDetail = "";
    let defenseRolls: number[] = [];

    const isHR = char.origin === Origin.RestricaoCelestial;
    const hasAdvAttack = (char.bindingVows || []).some(v => v.isActive && v.advantageType === 'attack');
    const hasAdvDefense = (char.bindingVows || []).some(v => v.isActive && v.advantageType === 'defense');

    // 1. Calculate Action Specifics
    if (activeTab === 'physical') {
      let baseDamageValue = 0;
      let baseDamageText = "";
      let currentWeaponItem: Item | undefined;

      // Determine Weapon and Attack Skill
      if (selectedWeaponId === 'unarmed') {
         const impactDie = getUnarmedImpactDie(char.level);
         const { count: dieCount, sides: dieSides } = parseDice(impactDie);
         const impactRoll = rollDice(dieSides, dieCount);
         const strengthBonus = (char.attributes.FOR || 0) * 5;
         baseDamageValue = impactRoll + strengthBonus;
         baseDamageText = `${impactRoll} (${impactDie}) + ${strengthBonus} (FOR*5)`;
         rollTitle = "Ataque Desarmado";

         // Unarmed uses Luta skill. Roll N d20 where N = attribute tied to the skill (Luta -> FOR)
         const lutaSkill = char.skills.find(s => s.name === 'Luta');
         const lutaBonus = lutaSkill ? lutaSkill.value : 0;
         const llBonus = stats.LL || 0;
         const attrKey = getSkillAttribute('Luta');
         const { rolls, best } = rollD20Pool(char.attributes[attrKey] + (hasAdvAttack ? 1 : 0));
         attackRolls = rolls;
         const baseAttackRoll = best;
         attackRoll = baseAttackRoll + lutaBonus + totalBuffBonus + llBonus + projectionBonus;
         const dicePart = `[${rolls.join(', ')}]${rolls.length > 1 ? ` ➜ ${best}` : ''}`;
         attackRollDetail = `${dicePart}${hasAdvAttack ? ' + Vantagem' : ''} + ${lutaBonus} (Luta)${llBonus ? ` + ${llBonus} (LL)` : ''}${totalBuffBonus ? ` + ${totalBuffBonus} (Buffs)` : ''}${projectionBonus ? ` + ${projectionBonus} (Projeção)` : ''}`;
         isCritSuccess = baseAttackRoll === 20;
         isCritFail = baseAttackRoll === 1;
         if (isCritSuccess) isCritical = true;
  } else {
         currentWeaponItem = equippedWeapons.find(w => w.id === selectedWeaponId);
         if (currentWeaponItem) {
             const diceStr = getWeaponDamageString(currentWeaponItem);
             const roll = parseAndRollDice(diceStr);
             baseDamageValue = roll.total;
             baseDamageText = `${roll.total} (${diceStr})`;
             rollTitle = currentWeaponItem.name;

             // Use weapon's attack skill (default to Luta)
             const attackSkillName = currentWeaponItem.attackSkill || 'Luta';
             const attackSkill = char.skills.find(s => s.name === attackSkillName);
             const attackBonus = attackSkill ? attackSkill.value : 0;

             const llBonus = stats.LL || 0;
             const attrKey = getSkillAttribute(attackSkillName);
             const { rolls, best } = rollD20Pool(char.attributes[attrKey] + (hasAdvAttack ? 1 : 0));
             attackRolls = rolls;
             const baseAttackRoll = best;

             attackRoll = baseAttackRoll + attackBonus + totalBuffBonus + llBonus + projectionBonus;
             const dicePart = `[${rolls.join(', ')}]${rolls.length > 1 ? ` ➜ ${best}` : ''}`;
             attackRollDetail = `${dicePart}${hasAdvAttack ? ' + Vantagem' : ''} + ${attackBonus} (${attackSkillName})${llBonus ? ` + ${llBonus} (LL)` : ''}${totalBuffBonus ? ` + ${totalBuffBonus} (Buffs)` : ''}${projectionBonus ? ` + ${projectionBonus} (Projeção)` : ''}`;
             isCritSuccess = baseAttackRoll === 20;
             isCritFail = baseAttackRoll === 1;

             // Check for critical hit
             const criticalThreshold = getWeaponCriticalThreshold(currentWeaponItem);
             if (attackRoll >= criticalThreshold) {
               isCritical = true;
               baseDamageValue = getMaxRollFromDice(diceStr);
               baseDamageText = `max(${diceStr}) = ${baseDamageValue} (Crítico!)`;
             }
         }
      }

      // Simplificação: Dano físico = Dano Base + LL (sem reforço por dados, sem bônus de FOR)
      if (isCritical) {
        // Maximize apenas o dano base em crítico
        if (selectedWeaponId === 'unarmed') {
          const impactDie = getUnarmedImpactDie(char.level);
          const strengthBonus = (char.attributes.FOR || 0) * 5;
          const maxImpact = getMaxRollFromDice(impactDie);
          baseDamageValue = maxImpact + strengthBonus;
          baseDamageText = `max(${impactDie}) = ${maxImpact} + ${strengthBonus} (FOR*5) (Crítico!)`;
        }
      }
      total = baseDamageValue + (isHR ? 0 : invested);
      detail = `ATAQUE ACERTOU: ${attackRollDetail} | [DanoBase]${baseDamageText}${!isHR && invested > 0 ? ` + [Reforço]${invested}` : ''}`;
      actionCostCE = isHR ? 0 : Math.ceil(invested / 2);
    } 
    else if (activeTab === 'defense') {
       if (isHR) {
        showNotification("Restrição Celestial não usa CE para defesa.", 'error');
        return;
      }
      // Não rolar d20 de acerto/defesa: apenas aplicar mitigação baseada em LL
      // --- Nova Fórmula de Mitigação ---
      const ll = stats.LL || 0;
      const mitigDiceCount = Math.floor(ll / 5);
      const mitigFixed = ll % 5;
      const mitigRolls: number[] = [];
      let mitigSum = 0;
      for (let i = 0; i < mitigDiceCount; i++) {
        const r = rollDice(10, 1);
        mitigRolls.push(r);
        mitigSum += r;
      }
      const reductionAmount = mitigSum + mitigFixed;
      const finalReduction = reductionAmount + totalBuffBonus;
      const finalDamage = Math.max(0, incomingDamage - finalReduction);
      loggedRolls = mitigRolls.length > 0 ? mitigRolls : [finalReduction];
      actionCostCE = 0;
      
      total = finalDamage;
      isDamageTaken = true;
      rollTitle = "Dano Final Recebido";

      detail = `Dano ${incomingDamage} - Mitigação (${mitigDiceCount}d10=[${mitigRolls.join(', ')}] + ${mitigFixed}${totalBuffBonus ? ` + Buffs ${totalBuffBonus}` : ''}) = ${finalReduction}`;
    }

    // 2. Add Buffs to Total (If Attack)
    if (activeTab !== 'defense') {
       total += totalBuffBonus;
       if (totalBuffBonus > 0) detail += ` + ${totalBuffBonus} (Buffs)`;
    } else {
       if (totalBuffBonus > 0) detail += ` - ${totalBuffBonus} (Buffs)`;
    }

    // 3. Check TOTAL Resources (Action + Buffs)
    const finalCostPE = actionCostPE + totalBuffCost.pe;
    const finalCostCE = actionCostCE + totalBuffCost.ce;

    if (currentStats.pe < finalCostPE) {
      showNotification(
        `PE Insuficiente! Necessário: ${finalCostPE} (Ação+Buffs), Atual: ${currentStats.pe}`,
        'error'
      );
      return;
    }
    if (currentStats.ce < finalCostCE) {
      showNotification(
        `CE Insuficiente! Necessário: ${finalCostCE} (Ação+Buffs), Atual: ${currentStats.ce}`,
        'error'
      );
      return;
    }

    // 4. Consume
    consumeCE(finalCostCE);
    consumePE(finalCostPE);
    if (onConsumeBuffs && relevantBuffs.length > 0) {
        onConsumeBuffs(relevantBuffs);
    }

    damageTotal = total;

    setLastResult({
      total,
      detail,
      isDamageTaken,
      weaponBroken,
      title: rollTitle,
      attackRoll,
      attackRollDetail,
      attackRolls,
        defenseRoll,
        defenseRollDetail,
        attackHits,
      isCritical: isCritical || isCritSuccess,
      isCritSuccess,
      isCritFail,
      damageTotal
    });
    setActiveRollResult('combat'); // Set active roll result to combat, which will hide skill results

    // Log to campaign if campaignId is provided
    if (campaignId) {
      if (loggedRolls.length > 0 || activeTab === 'defense') {
        logDiceRoll(
          campaignId,
          char.name,
          rollTitle,
          loggedRolls.length > 0 ? loggedRolls : [total], // For defense, use total as single "roll"
          total,
          detail
        ).catch(err => console.error('Failed to log dice roll:', err));
      }
    }
  };

  const isHR = char.origin === Origin.RestricaoCelestial;
  
  // Check if character has Projection Sorcery
  const hasProjection = char.innateTechnique?.name === "Projeção de Feitiçaria" || char.techniques.some(t => t.name === "Projeção de Feitiçaria");

  const projectionStacks = char.projectionStacks || 0;
  const projectionBonus = projectionStacks === 1 ? 5 : projectionStacks === 2 ? 7 : projectionStacks === 3 ? 10 : 0;

  // Projection Handlers
  const handleProjectionActivate = () => {
    if (!onUpdateCharacter) return;
    const cost = stats.LL;
    
    if (currentStats.ce < cost) {
        showNotification(`CE Insuficiente! Necessário: ${cost} (LL)`, 'error');
        return;
    }

    consumeCE(cost);
    const current = char.projectionStacks || 0;
    
    const updates: any = { ignoreAOO: true };
    if (current < 3) {
        updates.projectionStacks = current + 1;
    }
    
    onUpdateCharacter(updates);
    
    showNotification(
      `Projeção ativada! Gasto ${cost} CE. Stacks: ${Math.min(3, current + 1)}`,
      'success'
    );
  };

  const handleProjectionViolation = () => {
    if (!onUpdateCharacter) return;
    onUpdateCharacter({ projectionStacks: 0, ignoreAOO: false } as any);
    showNotification(
      'VIOLAÇÃO DE QUADRO! Stacks zerados. Personagem está IMÓVEL e INDEFESO até o fim do turno.',
      'error'
    );
  };

  const handleFrameBarrier = () => {
    // Reaction: Spend CE = LL.
    const cost = stats.LL;
    if (currentStats.ce < cost) {
        showNotification(`CE Insuficiente para Barreira! Necessário: ${cost} (LL)`, 'error');
        return;
    }
    
    consumeCE(cost);
    showNotification(
      `Barreira de Quadros ativada! (Custo: ${cost} CE). Dano de projéteis/energia anulado e ataques em área redirecionados.`,
      'success'
    );
  };

  const handleFrameTrap = () => {
    // 2 PE. Opposed Roll.
    if (currentStats.pe < 2) {
      showNotification('PE Insuficiente.', 'error');
      return;
    }
    consumePE(2);
    
    // Roll Luta vs Reflexos (User rolls Luta)
    const lutaSkill = char.skills.find(s => s.name === 'Luta');
    const lutaBonus = lutaSkill ? lutaSkill.value : 0;
    const attrKey = getSkillAttribute('Luta');
    const { best } = rollD20Pool(char.attributes[attrKey]);
    const total = best + lutaBonus + stats.LL; // Adding LL as standard proficiency/power
    
    setLastResult({
      total: total,
      detail: `[d20]${best} + ${lutaBonus} (Luta) + ${stats.LL} (LL)`,
      title: "Quadro de Frame (Ataque)",
      isDamageTaken: false,
      weaponBroken: false
    });
    setActiveRollResult('combat');
  };

  let maxInvest = stats.LL;
  if (isHR && activeTab === 'physical') {
     maxInvest = 0;
  }

  // Determine current limit description for UI
  const getCurrentWeaponLimit = () => {
      if (activeTab !== 'physical' || selectedWeaponId === 'unarmed') return null;
      const weapon = equippedWeapons.find(w => w.id === selectedWeaponId);
      if (!weapon) return null;
      return getWeaponCELimit(weapon);
  };
  const weaponLimit = getCurrentWeaponLimit();
  const currentCostCE = activeTab === 'defense' ? 0 : Math.ceil(invested / 2);
  const willBreak = weaponLimit !== null && currentCostCE > weaponLimit;

  const getWeaponCriticalThreshold = (weapon: Item): number => {
    // Try to find "Crítico: X" in description
    const match = weapon.description.match(/Crítico:\s*(\d+)/i);
    if (match) return parseInt(match[1]);

    // Fallback to catalog data
    const catalogItem = MUNDANE_WEAPONS.find(w => w.name === weapon.name);
    if (catalogItem) {
      const criticalMatch = catalogItem.critical.match(/(\d+)/);
      return criticalMatch ? parseInt(criticalMatch[1]) : 20;
    }

    return 20; // Default critical threshold
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl p-4 relative">

      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              notification={notification}
              onClose={id => setNotifications(prev => prev.filter(n => n.id !== id))}
            />
          ))}
        </div>
      )}

      {hasProjection && (
        <div className="bg-slate-950/80 border border-curse-500/30 rounded-lg p-3 mb-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Layers className="text-curse-400" size={16} />
               <h3 className="text-xs font-bold uppercase tracking-wider text-curse-200">Projeção (Stacks)</h3>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex flex-col items-end text-[10px] text-slate-500 font-mono leading-tight">
                    <span>+{projectionBonus} Acerto</span>
                    <span className="text-emerald-400 font-bold">{stats.Movement}m Deslocamento (+{(char.projectionStacks || 0) * 50}%)</span>
                </div>
                <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                    <div
                    key={i}
                    className={`w-6 h-8 border rounded-sm flex items-center justify-center transition-all duration-300
                        ${(char.projectionStacks || 0) >= i
                        ? 'bg-curse-500 border-curse-400 shadow-[0_0_10px_rgba(124,58,237,0.5)]'
                        : 'bg-slate-900 border-slate-700 opacity-50'}
                    `}
                    >
                    {(char.projectionStacks || 0) >= i && <div className="w-full h-full bg-white/10 animate-pulse" />}
                    </div>
                ))}
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-800 mb-4">
        <button
          onClick={() => { setActiveTab('physical'); reset(); }}
          className={`flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium transition-colors duration-75 border-b-2
            ${activeTab === 'physical' ? 'border-curse-500 text-white bg-slate-800/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Sword size={16} /> <span className="hidden sm:inline">Ataque</span>
        </button>
        <button
          onClick={() => { setActiveTab('defense'); reset(); }}
          className={`flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium transition-colors duration-75 border-b-2
            ${activeTab === 'defense' ? 'border-blue-500 text-blue-300 bg-blue-900/10' : 'border-transparent text-slate-400 hover:text-slate-200'}
            ${isHR ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={isHR}
        >
          <Shield size={16} /> <span className="hidden sm:inline">Defesa</span>
        </button>
      </div>

      <div className="space-y-4">

        {/* Domain Status & Controls */}
        {domainActive && (
          <div className="bg-curse-950/30 border border-curse-500/50 p-3 rounded-lg mb-4 animate-pulse-slow">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-curse-400">
                   <Hexagon size={16} className="animate-spin-slow" />
                   <span className="text-xs font-bold uppercase tracking-widest">Domínio Ativo</span>
                </div>
                <div className="text-xs font-mono text-white bg-curse-900/50 px-2 py-0.5 rounded border border-curse-500/30">
                   Rodada {domainRound} / {domainType === 'incomplete' ? 2 : 5}
                </div>
             </div>

             {/* Maintenance Controls */}
             <div className="flex gap-2 mt-2">
                {((domainType === 'incomplete' && domainRound > 2) || (domainType === 'complete' && domainRound > 2)) ? (
                    <button
                      onClick={() => onAdvanceDomain && onAdvanceDomain(true)}
                      disabled={
                        (domainType === 'incomplete' && currentStats.pe < 50) ||
                        (domainType === 'complete' && domainRound === 3 && currentStats.pe < 50) ||
                        (domainType === 'complete' && domainRound === 4 && currentStats.pe < 100)
                      }
                      className="flex-1 py-1.5 bg-orange-900/40 border border-orange-500/50 hover:bg-orange-900/60 text-orange-200 font-bold rounded text-[10px] uppercase flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       Manter (50 PE)
                    </button>
                ) : (
                    <button
                      onClick={() => onAdvanceDomain && onAdvanceDomain(false)}
                      className="flex-1 py-1.5 bg-emerald-900/40 border border-emerald-500/50 hover:bg-emerald-900/60 text-emerald-200 font-bold rounded text-[10px] uppercase flex items-center justify-center gap-1"
                    >
                       Avançar Rodada (Livre)
                    </button>
                )}
                
                <button
                   onClick={onCloseDomain}
                   className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[10px] uppercase font-bold"
                   title="Encerrar e sofrer Exaustão"
                >
                   <X size={14} />
                </button>
             </div>
          </div>
        )}
        
        {/* Buffs Summary Indicator */}
        {relevantBuffs.length > 0 && (
           <div className="bg-curse-900/20 border border-curse-500/30 p-2 rounded-lg flex items-center justify-between text-xs animate-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-curse-300">
                 <Layers size={14} />
                 <span className="font-bold uppercase tracking-wider">
                     {activeTab === 'defense' ? 'Buffs Defensivos' : 'Buffs Ofensivos'}
                 </span>
              </div>
              <div className="text-right">
                 <div className="font-bold text-white">+{totalBuffBonus} Bônus</div>
                 <div className="text-[10px] text-slate-400">Custo Extra: {totalBuffCost.pe}PE / {totalBuffCost.ce}CE</div>
              </div>
           </div>
        )}

        {/* Cost Display */}
        <div className="flex justify-between text-xs uppercase tracking-widest text-slate-500 font-bold">
          <span>
            {activeTab === 'physical' && "Reforço Corporal / Físico"}
            {activeTab === 'defense' && "Calculadora de Dano"}
          </span>
          <div className="text-right">
            <span className={activeTab === 'defense' ? "text-curse-400" : (currentStats.ce < currentCostCE && !isHR ? "text-red-500" : "text-curse-400")}>
              {activeTab === 'defense' ? 'Custo Ação: 0 CE' : (isHR && activeTab === 'physical' ? 'Custo: 0 (Passivo)' : `Custo Ação: ${currentCostCE} CE`)}
            </span>
          </div>
        </div>

        {/* Dynamic Inputs */}
        <div className="space-y-4">
          
          {/* Defense Specific: Incoming Damage */}
          {activeTab === 'defense' && (
             <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/30">
                <label className="block text-xs font-bold text-red-400 uppercase mb-2">Dano Recebido do Inimigo</label>
                <div className="flex items-center gap-2">
                   <input 
                      type="number" 
                      value={incomingDamage} 
                      onChange={(e) => setIncomingDamage(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xl font-black text-white focus:outline-none focus:border-red-500"
                      placeholder="0"
                   />
                </div>
                <div className="mt-3 text-[11px] text-slate-400">
                  <div className="font-bold uppercase tracking-widest mb-1">Mitigação (LL)</div>
                  <div className="font-mono text-slate-300">
                    {`${Math.floor((stats.LL || 0) / 5)}d10 + ${(stats.LL || 0) % 5}`} {totalBuffBonus ? `(+ Buffs ${totalBuffBonus})` : ''}
                  </div>
                </div>
             </div>
          )}

          {activeTab === 'physical' && (
             <div>
                <label className="block text-xs text-slate-400 mb-1">Arma Equipada / Dano Base</label>
                <div className="flex flex-col gap-2">
                  {/* Weapon Selector */}
                  <div className="relative">
                    <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                    <select
                      value={selectedWeaponId}
                      onChange={(e) => setSelectedWeaponId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:border-curse-500 focus:outline-none appearance-none"
                    >
                      <option value="unarmed">Desarmado / Manual</option>
                      {equippedWeapons.map(w => {
                        const dmg = getWeaponDamageString(w);
                        const isDisabled = w.isBroken;
                        return (
                          <option key={w.id} value={w.id} disabled={isDisabled} className={isDisabled ? "text-red-500 bg-red-950" : ""}>
                             {w.name} ({dmg}) {isDisabled ? "(QUEBRADA)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Manual Input (Only if Unarmed) */}
                  {selectedWeaponId === 'unarmed' && (
                    <div className="flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1">
                      <span className="text-xs text-slate-400">Dado de Impacto (por nível)</span>
                      <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white font-mono text-sm">
                        {getUnarmedImpactDie(char.level)}
                      </span>
                    </div>
                  )}
                </div>
             </div>
          )}

          {/* Opponent Defense Configuration - Only for Physical Attacks */}
          {/* Removed */}

          {/* Durability Warning */}
          {activeTab === 'physical' && weaponLimit !== null && (
            <div className="flex justify-between items-center mt-2 px-1">
               <span className="text-[10px] text-slate-500">Durabilidade da Arma: {weaponLimit} CE</span>
               {willBreak && (
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 animate-pulse">
                     <Hammer size={10} /> Quebrará após o ataque!
                  </span>
               )}

            </div>
          )}

          {!isHR && activeTab === 'physical' && (
            <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {`Pontos de Reforço (Max LL: ${stats.LL})`}
                </label>
                <div className="flex items-center gap-3">
                <input 
                    type="range" 
                    min="0" 
                    max={maxInvest} 
                    step="1"
                    value={invested}
                    onChange={(e) => setInvested(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-curse-500"
                />
                <span className="w-12 text-center font-mono text-lg font-bold text-white bg-slate-800 rounded p-1">
                    {invested}
                </span>
                </div>
            </div>
          )}

          {/* Slider de defesa removido: mitigação agora baseada somente em LL */}

        {isHR && activeTab === 'physical' && (
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                <p className="text-xs text-slate-300">
                    <span className="text-curse-400 font-bold">Restrição Celestial:</span> Dano extra passivo aplicado automaticamente.
                </p>
                <p className="text-xs font-mono text-slate-500 mt-1">Bônus: {stats.LL}d3</p>
            </div>
        )}
      </div>

      {/* Action Button (Hidden for Innate since it has its own buttons, shown for Physical/Defense) */}
      <button
        onClick={handleRoll}
        disabled={activeTab === 'defense' && invested <= 0}
        className={`w-full py-3 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-75 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            ${activeTab === 'defense' ? 'bg-blue-200 hover:bg-blue-100' : 'bg-slate-100 hover:bg-white'}
        `}
      >
        {activeTab === 'defense' ? <ArrowRight size={20} /> : <Dices size={20} />}
        {activeTab === 'defense' ? 'Calcular Dano Final' :
          activeTab === 'physical' && selectedWeaponId !== 'unarmed' ? 'Ataque com Arma' :
          'Ataque Desarmado'}
      </button>

      {/* Manual Roll Section */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rolagem Manual</label>
        <div className="flex gap-2">
            <input 
                type="text" 
                value={manualDiceFormula}
                onChange={(e) => setManualDiceFormula(e.target.value)}
                placeholder="Ex: 1d20, 4d6+5"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-curse-500 focus:outline-none font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleManualRoll()}
            />
            <button 
                onClick={handleManualRoll}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
            >
                Rolar
            </button>
        </div>
      </div>

      {/* Visual Roll Result Notification (Bottom Right) */}
      {lastResult && activeRollResult === 'combat' && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-80 border-2 rounded-lg shadow-2xl bg-[#15131d] overflow-visible ${
            lastResult.isCritFail
              ? 'border-red-600'
              : lastResult.isCritical
              ? 'border-emerald-500'
              : 'border-purple-500'
          }`}
        >
          <div className="relative p-4 pr-10">
            <button
              onClick={() => {
                setLastResult(null);
                setActiveRollResult(null);
              }}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-[#1f1b2a]"
            >
              <X size={16} />
            </button>

            {lastResult.weaponBroken && (
              <div className="absolute top-3 left-4 bg-red-600/20 text-red-300 text-[9px] font-bold px-2 py-0.5 border border-red-700 rounded flex items-center gap-1">
                <Hammer size={8} /> QUEBROU
              </div>
            )}

            <div className="flex items-center gap-2 text-white mb-4">
              <Hexagon
                size={22}
                strokeWidth={1.5}
                fill="currentColor"
                className={`${
                  lastResult.isCritFail
                    ? 'text-red-500'
                    : lastResult.isCritical
                    ? 'text-emerald-400'
                    : 'text-purple-500'
                }`}
              />
              <h3 className="font-semibold text-sm uppercase tracking-wide truncate">
                {lastResult.title || 'Resultado'}
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Attack Column (omit when sem rolagem de acerto/defesa) */}
              {lastResult.attackRoll !== undefined && (
                <div className="flex-1 flex flex-col items-center text-center relative group">
                  <span
                    className={`text-3xl font-black ${
                      lastResult.isCritFail
                        ? 'text-red-400'
                        : lastResult.isCritSuccess || lastResult.isCritical
                        ? 'text-emerald-300'
                        : 'text-white'
                    }`}
                  >
                    {lastResult.attackRoll}
                  </span>
                  <span className="mt-1 text-[10px] uppercase tracking-[0.35em] text-slate-400">Ataque</span>
                  {(lastResult.attackRollDetail || lastResult.attackRolls?.length) && (
                    <div className="hidden group-hover:flex flex-col gap-1 absolute bottom-full mb-2 right-0 bg-[#1f1b2a] text-slate-100 text-xs font-mono px-3 py-2 border border-slate-700 shadow-xl max-w-[240px] whitespace-normal break-words text-left z-20">
                      <span>{lastResult.attackRollDetail || `[${lastResult.attackRolls?.join(', ')}]`}</span>
                      {lastResult.isCritSuccess && <span className="text-emerald-300">Crítico natural</span>}
                      {lastResult.isCritFail && <span className="text-red-300">Falha natural</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Defense Column - Only show for physical attacks */}
              {lastResult.defenseRoll !== undefined && (
                <>
                  <div className="h-12 w-px bg-slate-700" />

                  <div className="flex-1 flex flex-col items-center text-center relative group">
                    <span
                      className={`text-3xl font-black ${
                        lastResult.attackHits === false
                          ? 'text-red-400'
                          : lastResult.attackHits === true
                          ? 'text-emerald-300'
                          : 'text-white'
                      }`}
                    >
                      {lastResult.defenseRoll}
                    </span>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.35em] text-slate-400">Defesa</span>
                    {lastResult.defenseRollDetail && (
                      <div className="hidden group-hover:flex flex-col gap-1 absolute bottom-full mb-2 right-0 bg-[#1f1b2a] text-slate-100 text-xs font-mono px-3 py-2 border border-slate-700 shadow-xl max-w-[240px] whitespace-normal break-words text-left z-20">
                        <span>{lastResult.defenseRollDetail}</span>
                        {lastResult.attackHits === true && <span className="text-emerald-300">Ataque acertou!</span>}
                        {lastResult.attackHits === false && <span className="text-red-300">Ataque errou!</span>}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="h-12 w-px bg-slate-700" />

              {/* Damage Column */}
              <div className="flex-1 flex flex-col items-center text-center relative group">
                <span
                  className={`text-3xl font-black ${
                    lastResult.isCritFail || lastResult.attackHits === false
                      ? 'text-red-400'
                      : lastResult.isCritical
                      ? 'text-emerald-300'
                      : 'text-white'
                  }`}
                >
                  {lastResult.attackHits === false ? '0' : (lastResult.damageTotal ?? lastResult.total)}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.35em] text-slate-400">Dano</span>
                {lastResult.detail && (
                  <div className="hidden group-hover:flex absolute bottom-full mb-2 right-0 bg-[#1f1b2a] text-slate-100 text-xs font-mono px-3 py-2 border border-slate-700 shadow-xl max-w-[240px] whitespace-normal break-words text-left z-20">
                    {lastResult.detail}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

};
