import React, { useState } from 'react';
import { Character, Attributes, CharacterClass, Origin } from '../types';
import { rollDice } from '../utils/calculations';
import { Dna, Sword, Brain, Activity, Shield, Zap, X, Hexagon, Edit2, Check } from 'lucide-react';

interface CharacterAttributesProps {
  char: Character;
  onUpdate: (field: keyof Character, value: any) => void;
  onUpdateAttribute: (attr: keyof Attributes, val: number) => void;
}

export const CharacterAttributes: React.FC<CharacterAttributesProps> = ({ char, onUpdate, onUpdateAttribute }) => {
  const [rollResult, setRollResult] = useState<{ title: string, total: number, detail: string, isPhysical: boolean } | null>(null);
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);

  // --- SVG Logic ---
  const size = 220;
  const center = size / 2;
  const radius = 70;
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

    setRollResult({
      title: `Teste de ${attr}`,
      total,
      isPhysical,
      detail: `[${rolls.join(', ')}] ➜ ${highest} ${bonus > 0 ? `+ ${bonus} (LL)` : ''}`
    });
  };

  const getIcon = (attr: keyof Attributes) => {
    switch(attr) {
      case 'FOR': return <Sword size={14} className="text-red-400" />;
      case 'AGI': return <Zap size={14} className="text-yellow-400" />;
      case 'VIG': return <Shield size={14} className="text-emerald-400" />;
      case 'INT': return <Brain size={14} className="text-blue-400" />;
      case 'PRE': return <Activity size={14} className="text-purple-400" />;
    }
  };

  const adjustAttr = (attr: keyof Attributes, delta: number) => {
    const current = char.attributes[attr];
    const next = Math.min(maxStat, Math.max(0, current + delta));
    onUpdateAttribute(attr, next);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden relative">
      
      {/* --- IDENTITY HEADER --- */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 relative">
        <button 
          onClick={() => setIsEditingIdentity(!isEditingIdentity)}
          className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
        >
          {isEditingIdentity ? <Check size={16} className="text-emerald-400"/> : <Edit2 size={14} />}
        </button>

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
                  className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white"
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
             <select 
                  value={char.origin}
                  onChange={(e) => onUpdate('origin', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-300"
                >
                   {Object.values(Origin).map(o => <option key={o} value={o}>{o}</option>)}
             </select>
          </div>
        ) : (
          <div className="flex items-center gap-4">
             {/* Avatar Circle */}
             <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0 shadow-lg">
                {char.imageUrl ? (
                   <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-xl">
                      {char.name.charAt(0)}
                   </div>
                )}
             </div>
             
             <div className="min-w-0">
                <h2 className="text-xl font-black text-white truncate leading-none mb-1">{char.name}</h2>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                   <span className="bg-slate-800 px-1.5 rounded text-white font-bold">Lv.{char.level}</span>
                   <span className="truncate">{char.characterClass}</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{char.origin}</div>
             </div>
          </div>
        )}
      </div>

      {/* --- ATTRIBUTES VISUALIZER --- */}
      <div className="p-4 flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-900 to-slate-950">
         
         {/* The Pentagon */}
         <div className="relative w-[220px] h-[220px]">
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_10px_rgba(124,58,237,0.2)]">
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
                    fill="rgba(139, 92, 246, 0.4)"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    className="transition-all duration-500 ease-out"
                />
                 {/* Labels on vertices */}
                 {statsOrder.map((key, i) => {
                    const { x, y } = getPoint(6, i, 5);
                    return (
                        <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                            {key}
                        </text>
                    );
                 })}
            </svg>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
               <Dna size={40} className="text-curse-500"/>
            </div>
         </div>

         {/* --- EDITABLE LIST --- */}
         <div className="grid grid-cols-1 w-full gap-2 mt-4">
            {(Object.keys(char.attributes) as Array<keyof Attributes>).map(attr => (
               <div key={attr} className="flex items-center justify-between bg-slate-950/50 p-2 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors group">
                  
                  {/* Roll Button */}
                  <button 
                     onClick={() => handleAttributeRoll(attr)}
                     className="flex items-center gap-3 flex-1 text-left hover:bg-white/5 rounded p-1 -ml-1 transition-colors"
                  >
                     <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center shadow-inner">
                        {getIcon(attr)}
                     </div>
                     <div>
                        <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{attr}</div>
                        <div className="text-[9px] text-slate-500 font-mono leading-none">
                           {char.attributes[attr]}d20
                           {['FOR','AGI','VIG'].includes(attr) && ` + ${char.level * 2}`}
                        </div>
                     </div>
                  </button>

                  {/* Edit Controls */}
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={() => adjustAttr(attr, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                     >
                        -
                     </button>
                     <span className={`w-4 text-center text-sm font-black ${char.attributes[attr] >= maxStat ? 'text-curse-400' : 'text-white'}`}>
                        {char.attributes[attr]}
                     </span>
                     <button 
                        onClick={() => adjustAttr(attr, 1)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                     >
                        +
                     </button>
                  </div>
               </div>
            ))}
         </div>

      </div>

      {/* --- ROLL TOAST NOTIFICATION --- */}
      {rollResult && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
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
