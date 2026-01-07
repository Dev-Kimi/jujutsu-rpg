import React, { useState, useEffect } from 'react';
import { Sword, Zap, Shield, Dices, ArrowRight, Layers, Wand2, AlertCircle, Crosshair, Hammer, X, Hexagon } from 'lucide-react';
import { Character, DerivedStats, DieType, CurrentStats, Origin, Ability, ActionState, Item } from '../types';
import { rollDice, parseAbilityCost, parseAbilityEffect, parseAndRollDice, getWeaponCELimit } from '../utils/calculations';
import { MUNDANE_WEAPONS } from '../utils/equipmentData';
import { ActionTracker } from './ActionTracker';
import { logDiceRoll } from '../utils/diceRollLogger';

interface CombatTabsProps {
  char: Character;
  stats: DerivedStats;
  currentStats: CurrentStats;
  consumeCE: (amount: number) => void;
  consumePE: (amount: number) => void;
  activeBuffs?: Ability[];
  onConsumeBuffs?: (buffs: Ability[]) => void;
  actionState: ActionState;
  setActionState: (state: ActionState) => void;
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
  actionState,
  setActionState,
  onUpdateInventory,
  campaignId
}) => {
  const [activeTab, setActiveTab] = useState<'physical' | 'technique' | 'defense'>('physical');
  const [invested, setInvested] = useState<number>(1);
  const [weaponDamageInput, setWeaponDamageInput] = useState<number>(0); // For manual override
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('unarmed');
  
  const [incomingDamage, setIncomingDamage] = useState<number>(0); 
  const [techniqueDie, setTechniqueDie] = useState<DieType>(DieType.d8);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>("");
  const [lastResult, setLastResult] = useState<{ total: number, detail: string, isDamageTaken?: boolean, weaponBroken?: boolean, title?: string } | null>(null);

  // Identify weapons from inventory
  const inventoryWeapons = char.inventory.filter(item => {
      // 1. Check against Mundane Weapons List by Name
      const isMundane = MUNDANE_WEAPONS.some(mw => mw.name === item.name);
      // 2. Check description for "Dano: XdY" pattern (created by Catalog)
      const hasDamagePattern = /Dano:\s*\d+d\d+/i.test(item.description);
      
      return isMundane || hasDamagePattern;
  });

  const getWeaponDamageString = (item: Item): string => {
      // Try to find "Dano: 1d6" in description first
      const match = item.description.match(/Dano:\s*(\d+d\d+(?:\+\d+)?)/i);
      if (match) return match[1];

      // Fallback to Catalog data
      const catalogItem = MUNDANE_WEAPONS.find(w => w.name === item.name);
      return catalogItem ? catalogItem.baseDamage : "1d4"; // Fallback default
  };

  const reset = () => {
    setLastResult(null);
    setInvested(1);
    setIncomingDamage(0);
  };

  // Logic to handle technique selection and die syncing
  useEffect(() => {
    if (activeTab === 'technique') {
        const hasTechniques = char.techniques.length > 0;
        
        // If we have techniques but none selected (or selected became invalid), select the first one
        if (hasTechniques) {
            const currentIsValid = char.techniques.some(t => t.id === selectedTechniqueId);
            if (!selectedTechniqueId || !currentIsValid) {
                setSelectedTechniqueId(char.techniques[0].id);
                setTechniqueDie(char.techniques[0].damageDie);
            } else {
                // If current is valid, ensure die matches (in case it was edited)
                const tech = char.techniques.find(t => t.id === selectedTechniqueId);
                if (tech) setTechniqueDie(tech.damageDie);
            }
        } else {
            setSelectedTechniqueId("");
        }
    }
  }, [activeTab, char.techniques, selectedTechniqueId]);

  const handleTechniqueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newId = e.target.value;
      setSelectedTechniqueId(newId);
      const tech = char.techniques.find(t => t.id === newId);
      if (tech) {
          setTechniqueDie(tech.damageDie);
      }
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

    const isHR = char.origin === Origin.RestricaoCelestial;

    // 1. Calculate Action Specifics
    if (activeTab === 'physical') {
      let baseDamageValue = 0;
      let baseDamageText = "";
      let currentWeaponItem: Item | undefined;

      // Determine Weapon Damage
      if (selectedWeaponId === 'unarmed') {
         baseDamageValue = weaponDamageInput;
         baseDamageText = `${weaponDamageInput}`;
         rollTitle = "Ataque Desarmado";
      } else {
         currentWeaponItem = inventoryWeapons.find(w => w.id === selectedWeaponId);
         if (currentWeaponItem) {
             const diceStr = getWeaponDamageString(currentWeaponItem);
             const roll = parseAndRollDice(diceStr);
             baseDamageValue = roll.total;
             baseDamageText = `${roll.total}`;
             rollTitle = currentWeaponItem.name;
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
      // Roll individual dice for logging
      for (let i = 0; i < invested; i++) {
        loggedRolls.push(rollDice(techniqueDie, 1));
      }
      const magicRoll = loggedRolls.reduce((sum, roll) => sum + roll, 0);
      total = magicRoll + intBonus;
      detail = `[${invested}d${techniqueDie}]${magicRoll} + [INT]${intBonus}`;
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
      
      // Defense Reaction Penalty Logic - DISPLAY ONLY HERE
      // The penalty now applies to Skill Checks (Reflexos/Luta), not fixed Damage Reduction.
      let penaltyDetail = "";
      if (actionState.reactionPenalty > 0) {
          // Just show a reminder in the detail string, do not subtract from DR
          penaltyDetail = ` (Nota: -${actionState.reactionPenalty} em Reações)`;
      }

      detail = `${incomingDamage} - ${reductionAmount} (Mitigado)`;
    }

    // 2. Add Buffs to Total (If Attack/Technique)
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

    setLastResult({ total, detail, isDamageTaken, weaponBroken, title: rollTitle });

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
  const hasTechniques = char.techniques.length > 0;

  let maxInvest = stats.LL;
  if (isHR && activeTab === 'physical') {
     maxInvest = 0;
  }

  // Determine current limit description for UI
  const getCurrentWeaponLimit = () => {
      if (activeTab !== 'physical' || selectedWeaponId === 'unarmed') return null;
      const weapon = inventoryWeapons.find(w => w.id === selectedWeaponId);
      if (!weapon) return null;
      return getWeaponCELimit(weapon);
  };
  const weaponLimit = getCurrentWeaponLimit();
  const currentCostCE = Math.ceil(invested / 2);
  const willBreak = weaponLimit !== null && currentCostCE > weaponLimit;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl p-4">
      
      {/* Turn Action Tracker */}
      <ActionTracker 
        state={actionState} 
        onUpdate={setActionState} 
      />

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 mb-4">
        <button 
          onClick={() => { setActiveTab('physical'); reset(); }}
          className={`flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium transition-colors border-b-2
            ${activeTab === 'physical' ? 'border-curse-500 text-white bg-slate-800/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Sword size={16} /> <span className="hidden sm:inline">Ataque</span>
        </button>
        <button 
          onClick={() => { setActiveTab('technique'); reset(); }}
          className={`flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium transition-colors border-b-2
            ${activeTab === 'technique' ? 'border-curse-500 text-curse-300 bg-curse-900/10' : 'border-transparent text-slate-400 hover:text-slate-200'}
            ${isHR ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={isHR}
        >
          <Zap size={16} /> <span className="hidden sm:inline">Técnica</span>
        </button>
        <button 
          onClick={() => { setActiveTab('defense'); reset(); }}
          className={`flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium transition-colors border-b-2
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
            {activeTab === 'technique' && "Técnica Inata"}
            {activeTab === 'defense' && "Calculadora de Dano"}
          </span>
          <span className={currentStats.ce < (activeTab === 'technique' ? invested : currentCostCE) && !isHR ? "text-red-500" : "text-curse-400"}>
             {isHR && activeTab === 'physical' ? 'Custo: 0 (Passivo)' : `Custo Ação: ${activeTab === 'technique' ? invested : currentCostCE} CE`}
          </span>
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
                      {inventoryWeapons.map(w => {
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

          {activeTab === 'technique' && (
             <div className="space-y-4">
                {/* Technique Selection Dropdown OR Empty State */}
                {!hasTechniques ? (
                    <div className="bg-slate-950 border border-dashed border-slate-700 rounded-xl p-6 text-center">
                        <AlertCircle className="mx-auto text-slate-600 mb-2" size={24} />
                        <p className="text-sm text-slate-400 font-bold mb-1">Nenhuma Técnica Disponível</p>
                        <p className="text-xs text-slate-600">Vá até a aba "Técnicas" para criar sua primeira técnica inata.</p>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Selecionar Técnica</label>
                        <div className="relative">
                            <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 text-curse-400" size={14} />
                            <select 
                                value={selectedTechniqueId}
                                onChange={handleTechniqueChange}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:border-curse-500 focus:outline-none appearance-none"
                            >
                                {char.techniques.map(tech => (
                                    <option key={tech.id} value={tech.id}>
                                        {tech.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Auto-detected Die Display */}
                        <div className="mt-3 bg-slate-950/50 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Dado da Técnica</span>
                            <span className="font-mono font-black text-curse-300 text-sm">d{techniqueDie}</span>
                        </div>
                    </div>
                )}
             </div>
          )}

          {!isHR && (
            <div className={activeTab === 'technique' && !hasTechniques ? "opacity-50 pointer-events-none filter grayscale" : ""}>
                <label className="block text-xs text-slate-400 mb-1">
                  {activeTab === 'technique' && `Energia Investida (Max Saída: ${stats.LL})`}
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
          disabled={(!isHR && invested <= 0 && activeTab !== 'physical') || (activeTab === 'technique' && !hasTechniques)} 
          className={`w-full py-3 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
             ${activeTab === 'defense' ? 'bg-blue-200 hover:bg-blue-100' : willBreak ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-slate-100 hover:bg-white'}
          `}
        >
          {activeTab === 'defense' ? <ArrowRight size={20} /> : <Dices size={20} />}
          {activeTab === 'defense' ? 'Calcular Dano Final' : willBreak ? 'Atacar e Quebrar Arma' : 'Rolagem de Ataque'}
        </button>

        {/* Visual Roll Result Notification (Bottom Right) */}
        {lastResult && (
          <div className="fixed bottom-6 right-6 z-50 w-72 bg-neutral-900 border border-neutral-800 rounded-sm shadow-2xl overflow-hidden animate-in slide-in-from-right-10 fade-in duration-300">
             {/* Accent Line */}
             <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${lastResult.isDamageTaken ? 'bg-red-600' : 'bg-pink-600'}`}></div>

             <div className="p-4 pl-6 relative">
                <button 
                  onClick={() => setLastResult(null)} 
                  className="absolute top-2 right-2 text-neutral-500 hover:text-white transition-colors"
                >
                   <X size={16} />
                </button>

                {lastResult.weaponBroken && (
                    <div className="absolute top-2 left-6 bg-red-600 text-white text-[9px] font-bold px-1.5 rounded flex items-center gap-1">
                       <Hammer size={8} /> QUEBROU
                    </div>
                )}

                <div className="flex items-center gap-3 mb-2 pt-2">
                   <div className={lastResult.isDamageTaken ? 'text-red-600' : 'text-pink-600'}>
                      <Hexagon size={28} fill="currentColor" />
                   </div>
                   <h3 className="font-bold text-white text-lg leading-none truncate pr-4">{lastResult.title || "Resultado"}</h3>
                </div>

                <div className="flex justify-between items-end border-t border-neutral-800 pt-2 mt-2">
                   <span className="text-neutral-500 font-mono text-[10px] tracking-tighter truncate max-w-[60%]">{lastResult.detail}</span>
                   <div className="flex items-center gap-2">
                      <span className="text-neutral-600 text-sm font-bold">=</span>
                      <div className={`text-4xl font-black leading-none ${lastResult.isDamageTaken ? 'text-red-500' : 'text-white'}`}>
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
