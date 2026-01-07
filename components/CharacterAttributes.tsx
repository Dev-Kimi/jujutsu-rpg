
import React, { useState } from 'react';
import { Character, Attributes, CharacterClass, Origin } from '../types';
import { rollDice } from '../utils/calculations';
import { Dna, Sword, Brain, Activity, Shield, Zap, X, Hexagon, Edit2, Check } from 'lucide-react';
import { logDiceRoll } from '../utils/diceRollLogger';

interface CharacterAttributesProps {
  char: Character;
  onUpdate: (field: keyof Character, value: any) => void;
  onUpdateAttribute: (attr: keyof Attributes, val: number) => void;
  readOnly?: boolean;
  campaignId?: string; // Optional campaign ID for logging rolls
}

export const CharacterAttributes: React.FC<CharacterAttributesProps> = ({ char, onUpdate, onUpdateAttribute, readOnly, campaignId }) => {
  const [rollResult, setRollResult] = useState<{ title: string, total: number, detail: string, isPhysical: boolean } | null>(null);
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);

  // --- SVG Logic ---
  const size = 180; // Smaller chart
  const center = size / 2;
  const radius = 60;
  // Order to match typical Pentagon shape: AGI (Top), INT (Top Right), VIG (Bot Right), PRE (Bot Left), FOR (Top Left)
  const statsOrder: (keyof Attributes)[] = ['AGI', 'INT', 'VIG', 'PRE', 'FOR']; 
  const angles = [-90, -18, 54, 126, 198]; 

  const getMaxStat = () => char.origin === Origin.RestricaoCelestial ? 6 : 5;
  const maxStat = getMaxStat();

  const getPoint = (value: number, index: number, scale = 5) => {
    const r = (value / scale) * radius;
    const angleRad = (angles[index] * Math.PI) / 180;
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad)
    };
  };

  const polyPoints = statsOrder.map((key, i) => {
    const { x, y } = getPoint(char.attributes[key], i, 5); 
    return `${x},${y}`;
  }).join(' ');

  const webPoints = [1, 2, 3, 4, 5].map(level => {
    return statsOrder.map((_, i) => {
      const { x, y } = getPoint(level, i, 5);
      return `${x},${y}`;
    }).join(' ');
  });

  // --- Logic ---
  const handleAttributeRoll = (attr: keyof Attributes) => {
    const val = char.attributes[attr];
    const diceCount = Math.max(1, val);
    
    // 1. Roll X d20s
    const rolls: number[] = [];
    for(let i=0; i<diceCount; i++) rolls.push(rollDice(20, 1));
    
    // 2. Take Highest
    const highest = Math.max(...rolls);

    // 3. Add Liberação (LL) if Physical
    const isPhysical = ['FOR', 'AGI', 'VIG'].includes(attr);
    const LL = char.level * 2;
    const bonus = isPhysical ? LL : 0;
    
    const total = highest + bonus;

    const breakdown = `[${rolls.join(', ')}] ➜ ${highest} ${bonus > 0 ? `+ ${bonus} (LL)` : ''}`;
    
    setRollResult({
      title: `Teste de ${attr}`,
      total,
      isPhysical,
      detail: breakdown
    });

    // Log to campaign if campaignId is provided
    if (campaignId) {
      logDiceRoll(
        campaignId,
        char.name,
        `Teste de ${attr}`,
        rolls,
        total,
        breakdown
      ).catch(err => console.error('Failed to log dice roll:', err));
    }
  };

  const getIcon = (attr: keyof Attributes) => {
    switch(attr) {
      case 'FOR': return <Sword size={12} className="text-red-400" />;
      case 'AGI': return <Zap size={12} className="text-yellow-400" />;
      case 'VIG': return <Shield size={12} className="text-emerald-400" />;
      case 'INT': return <Brain size={12} className="text-blue-400" />;
      case 'PRE': return <Activity size={12} className="text-purple-400" />;
    }
  };

  const adjustAttr = (attr: keyof Attributes, delta: number) => {
    const current = char.attributes[attr];
    const next = Math.min(maxStat, Math.max(0, current + delta));
    onUpdateAttribute(attr, next);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden relative">
      
      {/* --- IDENTITY HEADER (Compact) --- */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/50 relative">
        {!readOnly && (
            <button 
            onClick={() => setIsEditingIdentity(!isEditingIdentity)}
            className="absolute top-3 right-3 text-slate-600 hover:text-white transition-colors"
            >
            {isEditingIdentity ? <Check size={14} className="text-emerald-400"/> : <Edit2 size={12} />}
            </button>
        )}

        {isEditingIdentity ? (
          <div className="space-y-2 animate-in fade-in">
             <input 
               type="text" 
               value={char.name} 
               onChange={(e) => onUpdate('name', e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white font-bold"
             />
             <div className="flex gap-2">
                <input 
                  type="number" 
                  value={char.level} 
                  onChange={(e) => onUpdate('level', parseInt(e.target.value) || 1)}
                  className="w-12 bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white"
                  min={1} max={20}
                />
                <select 
                  value={char.characterClass}
                  onChange={(e) => onUpdate('characterClass', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-300"
                >
                   <option>Combatente</option>
                   <option>Feiticeiro</option>
                   <option>Especialista</option>
                   <option>Restrição Celestial</option>
                </select>
             </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-lg">
                {char.imageUrl ? (
                   <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-lg">
                      {char.name.charAt(0)}
                   </div>
                )}
             </div>
             
             <div className="min-w-0">
                <h2 className="text-lg font-black text-white truncate leading-none mb-0.5">{char.name}</h2>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                   <span className="bg-slate-800 px-1 rounded text-white font-bold">Lv.{char.level}</span>
                   <span className="truncate">{char.characterClass}</span>
                   <span className="text-slate-600">|</span>
                   <span className="uppercase tracking-wider">{char.origin}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* --- ATTRIBUTES VISUALIZER & LIST --- */}
      <div className="p-3 bg-gradient-to-b from-slate-900 to-slate-950">
         
         {/* The Pentagon (Smaller) */}
         <div className="relative w-full flex justify-center mb-3">
            <div className="relative w-[180px] h-[180px]">
                <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_10px_rgba(124,58,237,0.1)]">
                    {webPoints.map((points, i) => (
                        <polygon key={i} points={points} fill="none" stroke="#1e293b" strokeWidth="1" />
                    ))}
                    {angles.map((angle, i) => {
                        const rad = (angle * Math.PI) / 180;
                        const x = center + radius * Math.cos(rad);
                        const y = center + radius * Math.sin(rad);
                        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#1e293b" strokeWidth="1" />;
                    })}
                    <polygon 
                        points={polyPoints}
                        fill="rgba(139, 92, 246, 0.3)"
                        stroke="#8b5cf6"
                        strokeWidth="1.5"
                        className="transition-all duration-500 ease-out"
                    />
                    {/* Labels on vertices */}
                    {statsOrder.map((key, i) => {
                        const { x, y } = getPoint(5.8, i, 5);
                        return (
                            <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="8" fontWeight="bold">
                                {key}
                            </text>
                        );
                    })}
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                   <Dna size={32} className="text-curse-500"/>
                </div>
            </div>
         </div>

         {/* --- COMPACT EDITABLE LIST --- */}
         <div className="flex flex-col gap-1">
            {(Object.keys(char.attributes) as Array<keyof Attributes>).map(attr => (
               <div key={attr} className="flex items-center justify-between bg-slate-950/30 px-2 py-1 rounded border border-slate-800/30 hover:border-slate-700 transition-colors group">
                  
                  {/* Roll Button */}
                  <button 
                     onClick={() => handleAttributeRoll(attr)}
                     className="flex items-center gap-2 flex-1 text-left"
                  >
                     <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center shadow-inner text-slate-400 group-hover:text-white transition-colors">
                        {getIcon(attr)}
                     </div>
                     <span className="text-xs font-bold text-slate-400 group-hover:text-white w-8">{attr}</span>
                     <span className="text-[9px] text-slate-600 font-mono">
                         {char.attributes[attr]}d20
                         {['FOR','AGI','VIG'].includes(attr) && `+${char.level * 2}`}
                     </span>
                  </button>

                  {/* Edit Controls */}
                  <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                     {!readOnly && (
                        <button 
                            onClick={() => adjustAttr(attr, -1)}
                            className="w-4 h-4 flex items-center justify-center rounded bg-slate-800 text-slate-500 hover:text-white text-[10px]"
                        >
                            -
                        </button>
                     )}
                     <span className={`w-4 text-center text-xs font-bold ${char.attributes[attr] >= maxStat ? 'text-curse-400' : 'text-slate-200'}`}>
                        {char.attributes[attr]}
                     </span>
                     {!readOnly && (
                        <button 
                            onClick={() => adjustAttr(attr, 1)}
                            className="w-4 h-4 flex items-center justify-center rounded bg-slate-800 text-slate-500 hover:text-white text-[10px]"
                        >
                            +
                        </button>
                     )}
                  </div>
               </div>
            ))}
         </div>

      </div>

      {/* --- ROLL TOAST NOTIFICATION --- */}
      {rollResult && (
        <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
           <button 
             onClick={() => setRollResult(null)}
             className="absolute top-4 right-4 text-slate-500 hover:text-white"
           >
              <X size={20} />
           </button>
           
           <div className={`p-4 rounded-full bg-slate-900 border-2 mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${rollResult.isPhysical ? 'border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-400'}`}>
              <Hexagon size={40} fill="currentColor" className="opacity-20 absolute" />
              <Dna size={32} className="relative z-10" />
           </div>

           <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">{rollResult.title}</h3>
           <div className="text-[10px] text-slate-400 font-mono mb-6">{rollResult.detail}</div>
           
           <div className="text-6xl font-black text-white drop-shadow-2xl">
              {rollResult.total}
           </div>
           
           <button 
             onClick={() => setRollResult(null)}
             className="mt-8 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
           >
              Fechar
           </button>
        </div>
      )}

    </div>
  );
};
