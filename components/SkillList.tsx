
import React, { useState } from 'react';
import { Character, Skill, Attributes, Ability, CurrentStats } from '../types';
import { BookOpen, Dices, Search, Lock, Sparkles, Plus, Trash2, Zap, X, Hexagon } from 'lucide-react';
import { rollDice, parseAbilityCost, parseAbilitySkillTrigger, calculateDerivedStats } from '../utils/calculations';
import { logDiceRoll } from '../utils/diceRollLogger';

interface SkillListProps {
  char: Character;
  onUpdateSkill: (id: string, field: keyof Skill, value: any) => void;
  onAddSkill: () => void;
  onRemoveSkill: (id: string) => void;
  activeBuffs?: Ability[];
  onConsumeBuff?: (buffs: Ability[]) => void;
  currentStats?: CurrentStats;
  consumePE?: (amount: number) => void;
  consumeCE?: (amount: number) => void;
  activeRollResult: 'skill' | 'combat' | null;
  setActiveRollResult: (type: 'skill' | 'combat' | null) => void;
  readOnly?: boolean;
  campaignId?: string; // Optional campaign ID for logging rolls
  allowRollsWhenReadOnly?: boolean; // Allow rolling dice even when readOnly (for GM viewing other players)
}

const TRAINING_LEVELS = [
  { value: 0, label: "0", name: "Destreinado", color: "text-slate-600 font-normal" },
  { value: 5, label: "+5", name: "Treinado", color: "text-emerald-500 font-bold" },
  { value: 10, label: "+10", name: "Veterano", color: "text-blue-500 font-bold" },
  { value: 15, label: "+15", name: "Expert", color: "text-orange-500 font-black" },
];

export const SkillList: React.FC<SkillListProps> = ({ 
  char, 
  onUpdateSkill, 
  onAddSkill, 
  onRemoveSkill,
  activeBuffs = [],
  onConsumeBuff,
  currentStats,
  consumePE,
  consumeCE,
  activeRollResult,
  setActiveRollResult,
  readOnly,
  campaignId,
  allowRollsWhenReadOnly = false
}) => {
  const [rollResult, setRollResult] = useState<{ name: string, total: number, breakdown: string, isCritical?: boolean, isFailure?: boolean } | null>(null);
  const [filter, setFilter] = useState('');

  if (!char.skills) return null;

  const LL = calculateDerivedStats(char).LL;

  // Helper to normalize strings for comparison (remove accents, lowercase)
  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const handleRoll = (skillName: string, rankValue: number, otherValue: number, llBonus: number, attributeName?: string) => {
    // 1. Determine Dice Count based on Attribute
    let diceCount = 1;
    if (attributeName && char.attributes[attributeName as keyof Attributes]) {
        diceCount = char.attributes[attributeName as keyof Attributes];
    }
    // Safety: Always roll at least 1 die
    diceCount = Math.max(1, diceCount);

    // 2. Roll the pool
    const rolls: number[] = [];
    for (let i = 0; i < diceCount; i++) {
        rolls.push(rollDice(20, 1));
    }

    // 3. Pick the highest
    const d20 = Math.max(...rolls);

    // Detect critical (20 natural) and failure (1 natural)
    const isCritical = d20 === 20;
    const isFailure = d20 === 1;

    const total = d20 + rankValue + otherValue + llBonus;
    
    // Construct breakdown string
    const totalBonuses = rankValue + otherValue + llBonus;
    const sign = totalBonuses >= 0 ? '+' : '';
    
    // Format: "[5, 18, 2] -> 18+5" or just "[15]+5" if single die
    let breakdown = `[${rolls.join(', ')}]`;
    
    if (diceCount > 1) {
        breakdown += ` ➜ ${d20}`;
    }
    
    breakdown += `${sign}${totalBonuses}`;

    // --- Active Buffs Trigger Logic ---
    let buffsTriggered: Ability[] = [];
    let extraCostPE = 0;
    let extraCostCE = 0;

    activeBuffs.forEach(buff => {
        const triggerRaw = parseAbilitySkillTrigger(buff.description);
        if (triggerRaw) {
            const triggerSkill = normalize(triggerRaw);
            const rolledSkill = normalize(skillName);
            if (triggerSkill === rolledSkill) {
                const cost = parseAbilityCost(buff.cost);
                const projectedPE = (currentStats?.pe || 0) - extraCostPE - cost.pe;
                const projectedCE = (currentStats?.ce || 0) - extraCostCE - cost.ce;
                
                if (projectedPE >= 0 && projectedCE >= 0) {
                    buffsTriggered.push(buff);
                    extraCostPE += cost.pe;
                    extraCostCE += cost.ce;
                }
            }
        }
    });

    if (buffsTriggered.length > 0) {
        if (consumePE && extraCostPE > 0) consumePE(extraCostPE);
        if (consumeCE && extraCostCE > 0) consumeCE(extraCostCE);
        if (onConsumeBuff) onConsumeBuff(buffsTriggered);
    }

    setRollResult({
      name: skillName,
      total: total,
      breakdown: breakdown,
      isCritical,
      isFailure
    });
    setActiveRollResult('skill'); // Set active roll result to skill, which will hide combat results

    // Log to campaign if campaignId is provided
    if (campaignId) {
      logDiceRoll(
        campaignId,
        char.name,
        skillName,
        rolls,
        total,
        breakdown
      ).catch(err => console.error('Failed to log dice roll:', err));
    }
  };

  const filteredSkills = char.skills
    .filter(s => 
      s.name.toLowerCase().includes(filter.toLowerCase()) || 
      (s.attribute && s.attribute.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const attributeOptions = Object.keys(char.attributes) as Array<keyof Attributes>;

  return (
    <section className="bg-slate-900 rounded-xl border border-slate-800 p-0 overflow-hidden h-full flex flex-col shadow-lg">
      
      {/* Compact Header */}
      <div className="flex justify-between items-center px-3 py-2 bg-slate-950 border-b border-slate-800">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen size={14} /> Perícias
        </h2>
        <div className="flex items-center gap-2">
            <div className="relative group">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-curse-400 transition-colors" size={12} />
                <input 
                type="text" 
                placeholder="Buscar..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-24 focus:w-32 bg-slate-900 border border-slate-800 rounded text-[10px] py-1 pl-6 pr-2 text-slate-300 focus:outline-none focus:border-curse-500 transition-all placeholder:text-slate-700"
                />
            </div>
            {!readOnly && (
                <button 
                onClick={onAddSkill}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                title="Adicionar Perícia"
                >
                <Plus size={14}/>
                </button>
            )}
        </div>
      </div>
      
      {/* Visual Roll Result Notification */}
      {rollResult && activeRollResult === 'skill' && (
        <div className={`fixed bottom-6 right-6 z-50 w-80 bg-slate-800 border-2 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 fade-in duration-100 ${
          rollResult.isCritical ? 'border-emerald-500 glow-critical' : 
          rollResult.isFailure ? 'border-red-500 glow-failure' : 
          'border-slate-700'
        }`}>
           <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
             rollResult.isCritical ? 'bg-emerald-500' : 
             rollResult.isFailure ? 'bg-red-500' : 
             'bg-curse-500'
           }`}></div>
           <div className="p-4 pl-6 relative bg-gradient-to-br from-slate-800 to-slate-900">
              <button 
                onClick={() => { setRollResult(null); setActiveRollResult(null); }} 
                className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded z-10"
              >
                 <X size={16} />
              </button>
              <div className="flex items-center gap-3 mb-3">
                 <div className={`p-2 rounded-lg border ${
                   rollResult.isCritical ? 'bg-emerald-900/40 border-emerald-600/60' : 
                   rollResult.isFailure ? 'bg-red-900/40 border-red-600/60' : 
                   'bg-curse-900/30 border-curse-800/50'
                 }`}>
                    <Dices size={20} className={
                      rollResult.isCritical ? 'text-emerald-400' : 
                      rollResult.isFailure ? 'text-red-400' : 
                      'text-curse-400'
                    } />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-white text-base leading-tight">{rollResult.name}</h3>
                   {rollResult.isCritical && (
                     <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">CRÍTICO!</span>
                   )}
                   {rollResult.isFailure && (
                     <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">FALHA CRÍTICA!</span>
                   )}
                 </div>
              </div>
              <div className="flex justify-between items-end border-t border-slate-700 pt-3 mt-2 gap-3">
                 <span className="text-slate-300 font-mono text-xs tracking-tighter max-w-[60%] break-words leading-relaxed">{rollResult.breakdown}</span>
                 <div className="flex items-baseline gap-2 shrink-0">
                    <span className="text-slate-500 text-lg font-bold">=</span>
                    <div className={`text-3xl font-black leading-none ${
                      rollResult.isCritical ? 'text-glow-critical' : 
                      rollResult.isFailure ? 'text-glow-failure' : 
                      'text-curse-400'
                    }`}>{rollResult.total}</div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_60px_60px_40px_40px] gap-1 px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50 border-b border-slate-800">
        <div className="text-left">Perícia</div>
        <div className="text-center">Dados</div>
        <div className="text-center">Treino</div>
        <div className="text-center">Outros</div>
        <div className="text-center">Total</div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-900/50">
        {filteredSkills.map((skill, idx) => {
          const otherBonus = skill.otherValue || 0;
          const isCustom = !skill.isBase;
          
          const isPhysical = skill.attribute && ['FOR', 'AGI', 'VIG', 'PRE'].includes(skill.attribute);
          const isSorcery = normalize(skill.name) === normalize('Feitiçaria');
          const llBonus = (isPhysical || isSorcery) ? LL : 0;
          const totalBonus = skill.value + otherBonus + llBonus;
          
          const hasQueuedBuff = activeBuffs.some(b => {
             const triggerRaw = parseAbilitySkillTrigger(b.description);
             if (!triggerRaw) return false;
             return normalize(triggerRaw) === normalize(skill.name);
          });

          const currentLevel = TRAINING_LEVELS.find(l => l.value === skill.value) || TRAINING_LEVELS[0];
          
          // Get Attribute Value for Display
          const attrVal = skill.attribute ? char.attributes[skill.attribute] : 0;

          return (
            <div 
              key={skill.id} 
              className={`grid grid-cols-[1fr_60px_60px_40px_40px] gap-1 items-center px-3 py-1 border-b border-slate-800/30 text-xs hover:bg-white/5 transition-colors duration-75 group
                ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-950/20'}
              `}
            >
              {/* Name (Roll) */}
              <button 
                onClick={() => handleRoll(skill.name, skill.value, otherBonus, llBonus, skill.attribute)}
                disabled={readOnly && !allowRollsWhenReadOnly}
                className={`flex items-center gap-2 overflow-hidden text-left hover:text-curse-400 transition-colors duration-100 ${
                  readOnly && !allowRollsWhenReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                 <Dices size={12} className="text-curse-400 opacity-0 group-hover:opacity-100 transition-opacity duration-100 shrink-0" />
                 
                 <div className="min-w-0 flex-1">
                   {isCustom ? (
                      <input 
                        type="text"
                        value={skill.name}
                        disabled={readOnly}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateSkill(skill.id, 'name', e.target.value)}
                        className="bg-transparent border-none p-0 text-xs font-medium text-white w-full focus:ring-0"
                      />
                   ) : (
                      <div className="flex items-baseline gap-1">
                          <span className={`font-medium truncate text-white ${
                            hasQueuedBuff ? 'text-emerald-400' : ''
                          }`}>
                              {skill.name}
                          </span>
                          {(((skill.attribute && ['FOR', 'AGI', 'VIG', 'PRE'].includes(skill.attribute)) || isSorcery)) && <span className="text-[9px] text-slate-500 font-mono">+LL</span>}
                      </div>
                   )}
                 </div>
              </button>

              {/* Attr / Dice */}
              <div className="text-center flex justify-center items-center">
                 {!readOnly ? (
                    <select
                      value={skill.attribute || ""}
                      onChange={(e) => onUpdateSkill(skill.id, 'attribute', e.target.value)}
                      className="w-full bg-transparent text-xs text-white font-mono text-center cursor-pointer appearance-none focus:outline-none border-none hover:bg-slate-800/50 rounded px-1 py-0.5 transition-colors duration-100"
                    >
                      <option value="" className="bg-slate-900 text-slate-300">-</option>
                      {attributeOptions.map(attr => (
                        <option key={attr} value={attr} className="bg-slate-900 text-white">
                          {attr}
                        </option>
                      ))}
                    </select>
                 ) : (
                   <div className="text-xs font-mono text-white">
                     {skill.attribute || '-'}
                   </div>
                 )}
              </div>

               {/* Training */}
              <div className="flex justify-center">
                 <select 
                    value={skill.value}
                    disabled={readOnly}
                    onChange={(e) => onUpdateSkill(skill.id, 'value', parseInt(e.target.value) || 0)}
                    className="bg-transparent text-center text-xs font-mono text-white appearance-none focus:outline-none border-none hover:bg-slate-800/50 rounded px-1 py-0.5 transition-colors duration-100 cursor-pointer"
                 >
                    {TRAINING_LEVELS.map(level => (
                        <option key={level.value} value={level.value} className="bg-slate-900 text-white">
                            {level.label}
                        </option>
                    ))}
                 </select>
              </div>

              {/* Other */}
              <div className="flex justify-center">
                 <input 
                    type="number"
                    value={otherBonus}
                    readOnly={readOnly}
                    onChange={(e) => onUpdateSkill(skill.id, 'otherValue', parseInt(e.target.value) || 0)}
                    className={`w-full bg-transparent text-center text-xs font-mono p-0 border-none focus:ring-0 hover:bg-slate-800/50 rounded px-1 py-0.5 transition-colors duration-100 ${
                      otherBonus !== 0 ? 'text-yellow-400 font-semibold' : 'text-white'
                    }`}
                    placeholder="0"
                 />
              </div>

              {/* Total */}
              <div className="text-center font-mono font-bold text-white relative group/trash">
                {totalBonus > 0 ? `+${totalBonus}` : totalBonus}
                
                {isCustom && !readOnly && (
                  <button 
                    onClick={() => onRemoveSkill(skill.id)}
                    className="absolute inset-0 bg-slate-900 flex items-center justify-center text-red-500 opacity-0 group-hover/trash:opacity-100 transition-opacity duration-75"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
