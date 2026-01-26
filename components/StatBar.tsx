
import React from 'react';
import { Minus, Plus, RotateCcw, TrendingUp, AlertCircle } from 'lucide-react';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  colorClass: string; // e.g., 'bg-red-500'
  onChange: (newVal: number) => void;
  icon?: React.ReactNode;
  readOnly?: boolean;
  className?: string;
}

export const StatBar: React.FC<StatBarProps> = ({ label, current, max, colorClass, onChange, icon, readOnly, className = '' }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isOvercharged = current > max;
  const isLow = current <= max * 0.25 && current > 0;
  
  const adjust = (amount: number) => {
    // We allow current to go above max to support temporary buffs/HP
    onChange(Math.max(0, current + amount));
  };

  const resetToMax = () => {
    onChange(max);
  };

  return (
    <div className={`bg-slate-900/50 p-3 rounded-xl border relative group overflow-hidden transition-colors duration-75 min-w-0 ${isLow ? 'border-red-900/30' : 'border-slate-800'} ${className}`}>
      
      <div className="flex justify-between items-end mb-2 relative z-10">
        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-slate-300">
          {icon}
          {label}
          {isOvercharged && <TrendingUp size={14} className="text-emerald-400" />}
          {isLow && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
        </div>
        
        <div className="flex items-center gap-2">
           {!readOnly && current !== max && (
            <button 
              onClick={resetToMax}
              className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-curse-300 transition-colors duration-75 uppercase font-bold tracking-wider mr-2 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800 hover:border-curse-500/50"
              title="Resetar para o Máximo"
            >
              <RotateCcw size={10} /> Reset
            </button>
           )}
           <div className={`text-sm font-mono font-bold ${isOvercharged ? 'text-emerald-400' : isLow ? 'text-red-400' : 'text-slate-100'}`}>
             {current} <span className="text-slate-500 text-xs font-normal">/ {max}</span>
           </div>
        </div>
      </div>
      
      {/* Bar Container */}
      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden mb-3 relative border border-slate-800/50">
        {/* The Bar */}
        <div 
          className={`h-full transition-all duration-100 relative
            ${colorClass} 
            ${isOvercharged ? 'brightness-125' : ''}
            ${isLow ? 'animate-pulse' : ''}
          `}
          style={{ width: `${Math.min(100, percentage)}%` }}
        >
            {/* Overcharge texture */}
            {isOvercharged && (
                <div className="absolute inset-0 w-full h-full" 
                     style={{ 
                       backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,0.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0.15) 75%,transparent 75%,transparent)', 
                       backgroundSize: '1rem 1rem' 
                     }} 
                />
            )}
        </div>
      </div>

      {/* Controls */}
      {!readOnly && (
        <div className="flex justify-between gap-2 relative z-10">
            <div className="flex gap-1">
            <button 
                onClick={() => adjust(-5)} 
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors duration-75 text-xs font-mono border border-transparent hover:border-red-900/50"
            >
                -5
            </button>
            <button 
                onClick={() => adjust(-1)} 
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors duration-75 border border-transparent hover:border-red-900/50"
            >
                <Minus size={14} />
            </button>
            </div>
            
            <div className="flex gap-1">
            <button 
                onClick={() => adjust(1)} 
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-400 transition-colors duration-75 border border-transparent hover:border-emerald-900/50"
            >
                <Plus size={14} />
            </button>
            <button 
                onClick={() => adjust(5)} 
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-400 transition-colors text-xs font-mono border border-transparent hover:border-emerald-900/50"
            >
                +5
            </button>
            </div>
        </div>
      )}
    </div>
  );
};
