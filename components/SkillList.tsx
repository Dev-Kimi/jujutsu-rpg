import React, { useState } from 'react';
import { Character, Skill, Attributes, Ability, CurrentStats, ActionState } from '../types';
import { BookOpen, Dices, Search, Lock, Sparkles, Plus, Trash2, Zap, X, Hexagon } from 'lucide-react';
import { rollDice, parseAbilityCost, parseAbilitySkillTrigger } from '../utils/calculations';

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
  actionState?: ActionState;
}

const TRAINING_LEVELS = [
  { value: 0, label: "0", name: "Destreinado", color: "text-slate-500" },
  { value: 5, label: "+5", name: "Treinado", color: "text-emerald-400 font-bold" },
  { value: 10, label: "+10", name: "Veterano", color: "text-blue-400 font-bold" },
  { value: 15, label: "+15", name: "Expert", color: "text-yellow-400 font-black" },
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
  actionState
}) => {
  const [rollResult, setRollResult] = useState<{ name: string, total: number, breakdown: string } | null>(null);
  const [filter, setFilter] = useState('');

  if (!char.skills) return null;

  // Liberação (LL) value
  const LL = char.level * 2;

  // Helper to normalize strings for comparison (remove accents, lowercase)
  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const handleRoll = (skillName: string, rankValue: number, otherValue: number, llBonus: number) => {
    const d20 = rollDice(20, 1);
    
    // Check for Reaction Penalty (Applies to Reflexos and Luta)
    let reactionPenalty = 0;
    const lowerSkillName = skillName.toLowerCase();
    if (actionState && actionState.reactionPenalty > 0 && (lowerSkillName === 'reflexos' || lowerSkillName === 'luta')) {
       reactionPenalty = actionState.reactionPenalty;
    }

    const total = d20 + rankValue + otherValue + llBonus - reactionPenalty;
    
    // Construct breakdown string in a shorter format like the screenshot [Dice]+Bonus
    const totalBonuses = rankValue + otherValue + llBonus - reactionPenalty;
    const sign = totalBonuses >= 0 ? '+' : '';
    let breakdown = `[${d20}]${sign}${totalBonuses}`;

    // --- Active Buffs Trigger Logic ---
    let buffsTriggered: Ability[] = [];
    let extraCostPE = 0;
    let extraCostCE = 0;

    activeBuffs.forEach(buff => {
        // Does this buff trigger on this skill?
        const triggerRaw = parseAbilitySkillTrigger(buff.description);
        
        if (triggerRaw) {
            const triggerSkill = normalize(triggerRaw);
            const rolledSkill = normalize(skillName);

            // Match normalized names to handle accents and case (e.g. "Tática" vs "tatica")
            if (triggerSkill === rolledSkill) {
                // Calculate Cost
                const cost = parseAbilityCost(buff.cost);
                
                // Can we afford it? (If multiple trigger, we check cumulative)
                const projectedPE = (currentStats?.pe || 0) - extraCostPE - cost.pe;
                const projectedCE = (currentStats?.ce || 0) - extraCostCE - cost.ce;
                
                if (projectedPE >= 0 && projectedCE >= 0) {
                    buffsTriggered.push(buff);
                    extraCostPE += cost.pe;
                    extraCostCE += cost.ce;
                    // Add to breakdown but maybe keep it clean
                }
            }
        }
    });

    // Execute Resource Consumption
    if (buffsTriggered.length > 0) {
        if (consumePE && extraCostPE > 0) consumePE(extraCostPE);
        if (consumeCE && extraCostCE > 0) consumeCE(extraCostCE);
        if (onConsumeBuff) onConsumeBuff(buffsTriggered);
    }

    setRollResult({
      name: skillName,
      total: total,
      breakdown: breakdown
    });
  };

  const filteredSkills = char.skills
    .filter(s => 
      s.name.toLowerCase().includes(filter.toLowerCase()) || 
      (s.attribute && s.attribute.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const attributeOptions = Object.keys(char.attributes) as Array<keyof Attributes>;

  return (
    <section className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 relative overflow-hidden min-h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen size={16} /> Perícias
        </h2>
        <button 
          onClick={onAddSkill}
          className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-curse-600 text-slate-300 hover:text-white px-2 py-1.5 rounded transition-colors"
        >
          <Plus size={14}/> Add
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-curse-400 transition-colors" size={14} />
        <input 
          type="text" 
          placeholder="Filtrar perícias..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-slate-950 border-b border-slate-800 text-sm py-2 pl-9 pr-4 text-slate-300 focus:outline-none focus:border-curse-500 transition-colors placeholder:text-slate-600"
        />
      </div>
      
      {/* Visual Roll Result Notification (Bottom Right) */}
      {rollResult && (
        <div className="fixed bottom-6 right-6 z-50 w-72 bg-neutral-900 border border-neutral-800 rounded-sm shadow-2xl overflow-hidden animate-in slide-in-from-right-10 fade-in duration-300">
           {/* Accent Line */}
           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-600"></div>

           <div className="p-4 pl-6 relative">
              <button 
                onClick={() => setRollResult(null)} 
                className="absolute top-2 right-2 text-neutral-500 hover:text-white transition-colors"
              >
                 <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                 <div className="text-pink-600">
                    <Hexagon size={28} fill="currentColor" className="text-pink-600" />
                 </div>
                 <h3 className="font-bold text-white text-lg leading-none">{rollResult.name}</h3>
              </div>

              <div className="flex justify-between items-end border-t border-neutral-800 pt-2 mt-2">
                 <span className="text-neutral-500 font-mono text-sm tracking-tighter">{rollResult.breakdown}</span>
                 <div className="flex items-center gap-2">
                    <span className="text-neutral-600 text-sm font-bold">=</span>
                    <div className="text-4xl font-black text-white leading-none">{rollResult.total}</div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Header Row */}
      <div className="grid grid-cols-[1fr_45px_65px_45px_45px] gap-2 px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/50">
        <div className="text-left pl-1">Perícia</div>
        <div className="text-center">Attr</div>
        <div className="text-center">Treino</div>
        <div className="text-center">Outros</div>
        <div className="text-center text-slate-400">Total</div>
      </div>

      <div className="space-y-0.5 overflow-y-auto pr-1 custom-scrollbar flex-1">
        {filteredSkills.map((skill) => {
          const otherBonus = skill.otherValue || 0;
          const isCustom = !skill.isBase;
          
          // Check if Physical skill (FOR, AGI, VIG)
          const isPhysical = skill.attribute && ['FOR', 'AGI', 'VIG'].includes(skill.attribute);
          const llBonus = isPhysical ? LL : 0;

          // Calculate displayed total (without penalty, as that applies on Roll)
          const totalBonus = skill.value + otherBonus + llBonus;
          
          // Check if any active buff is queued for this skill
          const hasQueuedBuff = activeBuffs.some(b => {
             const triggerRaw = parseAbilitySkillTrigger(b.description);
             if (!triggerRaw) return false;
             return normalize(triggerRaw) === normalize(skill.name);
          });

          // Check for Penalty indication
          const isPenalized = actionState && actionState.reactionPenalty > 0 && 
                             (skill.name.toLowerCase() === 'reflexos' || skill.name.toLowerCase() === 'luta');
          
          // Determine styling based on current value
          const currentLevel = TRAINING_LEVELS.find(l => l.value === skill.value) || TRAINING_LEVELS[0];

          return (
            <div 
              key={skill.id} 
              className={`grid grid-cols-[1fr_45px_65px_45px_45px] gap-2 items-center w-full px-3 py-2 rounded border-b transition-all group relative
                ${isCustom 
                  ? 'bg-curse-950/10 border-curse-900/20' 
                  : hasQueuedBuff ? 'bg-emerald-950/30 border-emerald-500/30' 
                  : isPenalized ? 'bg-red-950/20 border-red-500/20' 
                  : 'border-slate-800/30'
                }
              `}
            >
              {/* Name Column (Click to Roll) */}
              <button 
                onClick={() => handleRoll(skill.name, skill.value, otherBonus, llBonus)}
                className="flex items-center gap-2 overflow-hidden text-left hover:bg-white/5 p-1 -ml-1 rounded transition-colors"
              >
                 <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                    <Dices size={14} className="absolute text-curse-400 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                    <div className="group-hover:opacity-0 transition-opacity duration-200">
                        {isCustom ? <Sparkles size={12} className="text-curse-400" /> : <Lock size={10} className="text-slate-600" />}
                    </div>
                 </div>

                 <div className="flex flex-col overflow-hidden w-full">
                   {isCustom ? (
                      <input 
                        type="text"
                        value={skill.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateSkill(skill.id, 'name', e.target.value)}
                        className="bg-transparent border-b border-transparent focus:border-curse-500 focus:outline-none text-sm font-medium text-curse-100 w-full"
                      />
                   ) : (
                      <span className={`text-sm font-medium truncate group-hover:text-slate-200 ${hasQueuedBuff ? 'text-emerald-400 animate-pulse' : isPenalized ? 'text-red-400' : 'text-slate-400'}`}>
                          {skill.name}
                      </span>
                   )}
                   {isPhysical && (
                     <span className="text-[9px] text-emerald-500 font-mono leading-none flex items-center gap-1">
                       <Zap size={8} /> +{LL} (LL)
                     </span>
                   )}
                   {isPenalized && (
                      <span className="text-[9px] text-red-500 font-mono leading-none flex items-center gap-1 animate-pulse">
                        -{actionState!.reactionPenalty} Reação
                      </span>
                   )}
                 </div>
              </button>

              {/* Attribute Name Column */}
              <div className="text-center">
                 {isCustom ? (
                    <select
                      value={skill.attribute || ""}
                      onChange={(e) => onUpdateSkill(skill.id, 'attribute', e.target.value)}
                      className="w-full bg-slate-950/50 border-none text-[10px] text-slate-400 focus:ring-0 cursor-pointer"
                    >
                      {attributeOptions.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                    </select>
                 ) : (
                   <span className="text-[10px] font-mono text-slate-500 cursor-help" title={`Atributo Referência: ${skill.attribute}`}>
                     {skill.attribute}
                   </span>
                 )}
              </div>

               {/* Training Level Column (Selector) */}
              <div className="text-center flex justify-center relative">
                 <div className="relative w-full">
                    <select 
                        value={skill.value}
                        onChange={(e) => onUpdateSkill(skill.id, 'value', parseInt(e.target.value) || 0)}
                        className={`appearance-none w-full bg-slate-950 border border-slate-800 hover:border-slate-600 rounded text-center text-xs font-mono py-1 pr-0 focus:outline-none focus:border-curse-500 cursor-pointer transition-colors ${currentLevel.color}`}
                    >
                        {TRAINING_LEVELS.map(level => (
                            <option key={level.value} value={level.value} className="bg-slate-900 text-slate-300">
                                {level.label}
                            </option>
                        ))}
                    </select>
                 </div>
              </div>

              {/* Other Bonuses Column (Editable) */}
              <div className="text-center flex justify-center">
                 <input 
                    type="number"
                    value={otherBonus}
                    onChange={(e) => onUpdateSkill(skill.id, 'otherValue', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border-b border-slate-800 hover:border-slate-600 text-center text-xs font-mono text-slate-300 focus:border-curse-500 focus:outline-none p-1 transition-colors"
                 />
              </div>

              {/* Total Column */}
              <div className="text-center flex justify-center items-center relative">
                <span className={`font-mono text-sm font-bold ${totalBonus > 0 ? 'text-curse-400' : 'text-slate-500'}`}>
                   {totalBonus > 0 ? `+${totalBonus}` : totalBonus}
                </span>
                
                {/* Delete Button for Custom */}
                {isCustom && (
                  <button 
                    onClick={() => onRemoveSkill(skill.id)}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-900/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredSkills.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-600 italic">
            Nenhuma perícia encontrada.
          </div>
        )}
      </div>
    </section>
  );
};