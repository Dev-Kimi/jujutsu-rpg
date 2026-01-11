import React, { useState, useEffect } from 'react';
import { Sword, Shield, Dices, ArrowRight, Layers, Crosshair, Hammer, X, Hexagon } from 'lucide-react';
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
  campaignId?: string; // Optional campaign ID for logging rolls
}

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
  campaignId
}) => {
  const [activeTab, setActiveTab] = useState<'physical' | 'defense'>('physical');
  const [invested, setInvested] = useState<number>(1);
  const [weaponDamageInput, setWeaponDamageInput] = useState<number>(0); // For manual override
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('unarmed');
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>('');
  const [techniqueDie, setTechniqueDie] = useState<string>('1d6');
  
  const [incomingDamage, setIncomingDamage] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{ total: number, detail: string, isDamageTaken?: boolean, weaponBroken?: boolean, title?: string, attackRoll?: number, attackRollDetail?: string, isCritical?: boolean } | null>(null);

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


  const handleRoll = () => {
    let total = 0;
    let detail = "";
    let actionCostCE = 0;
    let actionCostPE = 0;
    let isDamageTaken = false;
    let weaponBroken = false;
    let rollTitle = "Ataque";
    let loggedRolls: number[] = []; // Store rolls for logging
    let attackRoll = 0;
    let attackRollDetail = "";
    let isCritical = false;

    const isHR = char.origin === Origin.RestricaoCelestial;

    // 1. Calculate Action Specifics
    if (activeTab === 'physical') {
      let baseDamageValue = 0;
      let baseDamageText = "";
      let currentWeaponItem: Item | undefined;

      // Determine Weapon and Attack Skill
      if (selectedWeaponId === 'unarmed') {
         // Dano base desarmado: 1d4 (ou valor manual se informado)
         if (weaponDamageInput > 0) {
           baseDamageValue = weaponDamageInput;
           baseDamageText = `${weaponDamageInput}`;
         } else {
           const unarmedRoll = rollDice(4, 1);
           baseDamageValue = unarmedRoll;
           baseDamageText = `${unarmedRoll} (1d4)`;
         }
         rollTitle = "Ataque Desarmado";

         // Unarmed uses Luta skill
         const lutaSkill = char.skills.find(s => s.name === 'Luta');
         const lutaBonus = lutaSkill ? lutaSkill.value : 0;
         attackRoll = rollDice(20, 1) + lutaBonus + totalBuffBonus;
         attackRollDetail = `1d20 + ${lutaBonus} (Luta)${totalBuffBonus ? ` + ${totalBuffBonus} (Buffs)` : ''}`;
      } else {
         currentWeaponItem = equippedWeapons.find(w => w.id === selectedWeaponId);
         if (currentWeaponItem) {
             const diceStr = getWeaponDamageString(currentWeaponItem);
             const roll = parseAndRollDice(diceStr);
             baseDamageValue = roll.total;
             baseDamageText = `${roll.total}`;
             rollTitle = currentWeaponItem.name;

             // Use weapon's attack skill (default to Luta)
             const attackSkillName = currentWeaponItem.attackSkill || 'Luta';
             const attackSkill = char.skills.find(s => s.name === attackSkillName);
             const attackBonus = attackSkill ? attackSkill.value : 0;

             attackRoll = rollDice(20, 1) + attackBonus + totalBuffBonus;
             attackRollDetail = `1d20 + ${attackBonus} (${attackSkillName})${totalBuffBonus ? ` + ${totalBuffBonus} (Buffs)` : ''}`;

             // Check for critical hit
             const criticalThreshold = getWeaponCriticalThreshold(currentWeaponItem);
             if (attackRoll >= criticalThreshold) {
               isCritical = true;
               const multiplier = getWeaponCriticalMultiplier(currentWeaponItem);
               baseDamageValue *= multiplier;
               baseDamageText = `${baseDamageText} × ${multiplier} (Crítico!)`;
             }
         }
      }

      // Add Attributes
      const strBonus = char.attributes.FOR;
      
      if (isHR) {
        const hrDiceCount = char.level * 2;
        // Roll individual dice for logging
        for (let i = 0; i < hrDiceCount; i++) {
          loggedRolls.push(rollDice(3, 1));
        }
        const hrRoll = loggedRolls.reduce((sum, roll) => sum + roll, 0);
        
        total = baseDamageValue + hrRoll + strBonus;
        detail = `${baseDamageText} + ${hrRoll} (HR) + ${strBonus} (FOR)`;
        actionCostCE = 0;
      } else {
        // CE Reinforcement for Physical Attack
        actionCostCE = invested > 0 ? Math.ceil(invested / 2) : 0;
        
        // DURABILITY CHECK
        if (currentWeaponItem && onUpdateInventory) {
             const durability = getWeaponCELimit(currentWeaponItem);
             if (actionCostCE > durability) {
                 weaponBroken = true;
                 onUpdateInventory(currentWeaponItem.id, 'isBroken', true);
             }
        }

        // Roll individual dice for logging
        for (let i = 0; i < invested; i++) {
          loggedRolls.push(rollDice(4, 1));
        }
        const reinforcementRoll = loggedRolls.reduce((sum, roll) => sum + roll, 0);
        total = baseDamageValue + reinforcementRoll + strBonus;
        detail = `[DanoBase]${baseDamageText} + [Reforço]${reinforcementRoll} + [Força]${strBonus}`;
      }
    } 
    else if (activeTab === 'technique') {
      if (isHR) {
         alert("Restrição Celestial não pode usar Técnicas Inatas.");
         return;
      }
      
      const selectedTech = char.techniques.find(t => t.id === selectedTechniqueId);
      
      if (!selectedTech) {
          alert("Selecione uma técnica válida.");
          return;
      }

      rollTitle = selectedTech.name;
      actionCostCE = invested; 
      const intBonus = char.attributes.INT;
      
      // Check for "Economia de Fluxo" passive ability
      const hasEconomiaFluxo = char.abilities.some(ability => 
        ability.name === "Economia de Fluxo" && ability.category === "Feiticeiro"
      );
      
      // Apply "Economia de Fluxo" cost reduction (reduce CE cost by full INT value)
      let economiaReduction = 0;
      if (hasEconomiaFluxo) {
        economiaReduction = intBonus;
        actionCostCE = Math.max(1, actionCostCE - economiaReduction); // Minimum cost of 1 CE
      }
      
      // Roll individual dice for logging
      for (let i = 0; i < invested; i++) {
        loggedRolls.push(rollDice(techniqueDie, 1));
      }
      const magicRoll = loggedRolls.reduce((sum, roll) => sum + roll, 0);
      total = magicRoll + intBonus;
      
      // If using 10 CE (after reduction check original invested amount), reduce INT from total
      if (invested >= 10) {
        total = Math.max(0, total - intBonus);
        detail = `[${invested}d${techniqueDie}]${magicRoll} + [INT]${intBonus} - [INT]${intBonus} (10+ CE)`;
      } else {
      detail = `[${invested}d${techniqueDie}]${magicRoll} + [INT]${intBonus}`;
      }
      
      // Add economia de fluxo reduction to detail if applicable
      if (hasEconomiaFluxo && economiaReduction > 0) {
        detail += ` (Economia de Fluxo: -${economiaReduction} CE)`;
      }
    } 
    else if (activeTab === 'defense') {
       if (isHR) {
         alert("Restrição Celestial não usa CE para defesa.");
         return;
       }
      actionCostCE = invested > 0 ? Math.ceil(invested / 2) : 0;
      const reductionAmount = invested;
      
      const finalReduction = reductionAmount + totalBuffBonus;
      const finalDamage = Math.max(0, incomingDamage - finalReduction);
      
      total = finalDamage;
      isDamageTaken = true;
      rollTitle = "Dano Final Recebido";

      detail = `${incomingDamage} - ${reductionAmount} (Mitigado)`;
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
        alert(`PE Insuficiente! Necessário: ${finalCostPE} (Ação+Buffs), Atual: ${currentStats.pe}`);
        return;
    }
    if (currentStats.ce < finalCostCE) {
        alert(`CE Insuficiente! Necessário: ${finalCostCE} (Ação+Buffs), Atual: ${currentStats.ce}`);
        return;
    }

    // 4. Consume
    consumeCE(finalCostCE);
    consumePE(finalCostPE);
    if (onConsumeBuffs && relevantBuffs.length > 0) {
        onConsumeBuffs(relevantBuffs);
    }

    setLastResult({ total, detail, isDamageTaken, weaponBroken, title: rollTitle, attackRoll, attackRollDetail, isCritical });
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
  const currentCostCE = Math.ceil(invested / 2);
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

  const getWeaponCriticalMultiplier = (weapon: Item): number => {
    // Try to find multiplier in description (x2, x3, x4)
    const match = weapon.description.match(/×\s*(\d+)/i) || weapon.description.match(/x\s*(\d+)/i);
    if (match) return parseInt(match[1]);

    return 2; // Default critical multiplier
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl p-4">

      {/* Tabs Header */}
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

      {/* Content */}
      <div className="space-y-4">
        
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
            <span className={currentStats.ce < currentCostCE && !isHR ? "text-red-500" : "text-curse-400"}>
              {isHR && activeTab === 'physical' ? 'Custo: 0 (Passivo)' : `Custo Ação: ${currentCostCE} CE`}
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
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <input 
                        type="number" 
                        value={weaponDamageInput} 
                        onChange={(e) => setWeaponDamageInput(parseInt(e.target.value) || 0)}
                        placeholder="Dano base numérico"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-curse-500 text-sm"
                      />
                    </div>
                  )}
                </div>
             </div>
          )}

          {!isHR && (
            <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {activeTab === 'physical' && `Dados de Reforço (Max LL: ${stats.LL})`}
                  {activeTab === 'defense' && `Pontos de Redução (Max LL: ${stats.LL})`}
                </label>
                <div className="flex items-center gap-3">
                <input 
                    type="range" 
                    min="0" 
                    max={maxInvest} 
                    step="1"
                    value={invested}
                    onChange={(e) => setInvested(parseInt(e.target.value))}
                    className={`flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${activeTab === 'defense' ? 'accent-blue-500' : 'accent-curse-500'}`}
                />
                <span className="w-12 text-center font-mono text-lg font-bold text-white bg-slate-800 rounded p-1">
                    {invested}
                </span>
                </div>
                {activeTab === 'defense' && (
                   <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                      <span>Reforço Corporal (Defesa)</span>
                      <span>Mitiga {invested} de dano fixo</span>
                   </div>
                )}
                 
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
            </div>
          )}
          
          {isHR && activeTab === 'physical' && (
              <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                  <p className="text-xs text-slate-300">
                      <span className="text-curse-400 font-bold">Restrição Celestial:</span> Dano extra passivo aplicado automaticamente.
                  </p>
                  <p className="text-xs font-mono text-slate-500 mt-1">Bônus: {char.level * 2}d3</p>
              </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleRoll}
          disabled={!isHR && invested <= 0 && activeTab !== 'physical'}
          className={`w-full py-3 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-75 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
             ${activeTab === 'defense' ? 'bg-blue-200 hover:bg-blue-100' : willBreak ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-slate-100 hover:bg-white'}
          `}
        >
          {activeTab === 'defense' ? <ArrowRight size={20} /> : <Dices size={20} />}
          {activeTab === 'defense' ? 'Calcular Dano Final' :
           willBreak ? 'Atacar e Quebrar Arma' :
           activeTab === 'physical' && selectedWeaponId !== 'unarmed' ? 'Ataque com Arma' :
           'Ataque Desarmado'}
        </button>

        {/* Visual Roll Result Notification (Bottom Right) */}
        {lastResult && activeRollResult === 'combat' && (
          <div className={`fixed bottom-6 right-6 z-50 w-72 bg-slate-800 border-2 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 fade-in duration-100 ${
            lastResult.isDamageTaken ? 'border-red-600' : 'border-slate-700'
          }`}>
             {/* Accent Line */}
             <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${lastResult.isDamageTaken ? 'bg-red-500' : 'bg-curse-500'}`}></div>

             <div className="p-4 pl-6 relative bg-gradient-to-br from-slate-800 to-slate-900">
                <button 
                  onClick={() => { setLastResult(null); setActiveRollResult(null); }} 
                  className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded z-10"
                >
                   <X size={16} />
                </button>

                {lastResult.weaponBroken && (
                    <div className="absolute top-2 left-6 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-red-700 z-10">
                       <Hammer size={8} /> QUEBROU
                    </div>
                )}

                <div className="flex items-center gap-3 mb-3 pt-1">
                   <div className={`p-2 rounded-lg border ${lastResult.isDamageTaken ? 'bg-red-900/40 border-red-700/60' : 'bg-curse-900/40 border-curse-700/60'}`}>
                      {lastResult.isDamageTaken ? (
                        <Shield size={20} className="text-red-400" />
                      ) : (
                        <Sword size={20} className="text-curse-400" />
                      )}
                   </div>
                   <h3 className="font-bold text-white text-base leading-tight truncate pr-4">{lastResult.title || "Resultado"}</h3>
                </div>

                {/* Attack Roll Display (only for physical attacks) */}
                {lastResult.attackRoll !== undefined && (
                  <div className="flex justify-between items-center border-t border-slate-700 pt-3 mt-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Dices size={16} className={`text-emerald-400 ${lastResult.isCritical ? 'animate-pulse' : ''}`} />
                      <span className="text-slate-300 font-medium">Ataque:</span>
                      <span className="text-slate-300 font-mono">{lastResult.attackRollDetail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${lastResult.isCritical ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {lastResult.attackRoll}
                        {lastResult.isCritical && <span className="text-xs ml-1 text-yellow-300">CRÍTICO!</span>}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-end border-t border-slate-700 pt-3 mt-2 gap-3">
                   <span className="text-slate-300 font-mono text-xs tracking-tighter break-words leading-relaxed max-w-[60%]">{lastResult.detail}</span>
                   <div className="flex items-baseline gap-2 shrink-0">
                      <span className="text-slate-500 text-lg font-bold">=</span>
                      <div className={`text-3xl font-black leading-none ${lastResult.isDamageTaken ? 'text-red-400' : 'text-curse-400'}`}>
                        {lastResult.total}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
