import React, { useState } from 'react';
import { Play, FastForward, RotateCcw, AlertTriangle, Zap, Footprints, ShieldAlert } from 'lucide-react';
import { ActionState } from '../types';

interface ActionTrackerProps {
  state: ActionState;
  onUpdate: (newState: ActionState) => void;
}

export const ActionTracker: React.FC<ActionTrackerProps> = ({ state, onUpdate }) => {
  const [freeActionFlash, setFreeActionFlash] = useState(false);

  // Handlers
  const spendStandard = () => {
    if (state.standard) onUpdate({ ...state, standard: false });
  };

  const spendMovement = () => {
    if (state.movement > 0) onUpdate({ ...state, movement: state.movement - 1 });
  };

  const spendFullAction = () => {
    // Ação Completa consome Padrão + TODO o movimento restante
    if (state.standard && state.movement >= 1) {
      onUpdate({ ...state, standard: false, movement: 0 });
    }
  };

  const useReaction = () => {
    onUpdate({ ...state, reactionPenalty: state.reactionPenalty + 1 });
  };

  const triggerFreeAction = () => {
    setFreeActionFlash(true);
    setTimeout(() => setFreeActionFlash(false), 300);
  };

  const resetTurn = () => {
    onUpdate({ standard: true, movement: 2, reactionPenalty: 0 });
  };

  // Logic for Full Action Availability
  const canFullAction = state.standard && state.movement >= 1;

  return (
    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 shadow-lg">
      <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Zap size={12} className="text-yellow-400" /> Economia de Ações
        </h3>
        <button 
          onClick={resetTurn}
          className="text-[10px] flex items-center gap-1 bg-slate-900 hover:bg-curse-900 text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-800 transition-colors uppercase font-bold"
        >
          <RotateCcw size={10} /> Novo Turno
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        
        {/* STANDARD ACTION */}
        <button
          onClick={spendStandard}
          disabled={!state.standard}
          className={`col-span-2 relative p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 h-16
            ${state.standard 
              ? 'bg-curse-900/40 border-curse-500 text-curse-200 hover:bg-curse-800/50' 
              : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'}
          `}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Play size={16} className={state.standard ? "fill-curse-500" : ""} /> Padrão
          </div>
          <div className="text-[9px] uppercase tracking-wider opacity-70">Ataque / Técnica</div>
          {!state.standard && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 font-black text-red-500/50 uppercase tracking-widest text-lg rotate-12 pointer-events-none">Gasto</div>}
        </button>

        {/* MOVEMENT ACTION */}
        <button
          onClick={spendMovement}
          disabled={state.movement <= 0}
          className={`col-span-1 p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 h-16
            ${state.movement > 0
              ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40' 
              : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'}
          `}
        >
          <Footprints size={16} />
          <div className="text-[10px] font-bold">Movimento</div>
          {/* Pips */}
          <div className="flex gap-1 mt-1">
            <div className={`w-2 h-2 rounded-full ${state.movement >= 1 ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-slate-800'}`} />
            <div className={`w-2 h-2 rounded-full ${state.movement >= 2 ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-slate-800'}`} />
          </div>
        </button>

        {/* REACTION */}
        <button
          onClick={useReaction}
          className={`col-span-1 p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 h-16 bg-amber-950/20 border-amber-600/30 text-amber-500 hover:bg-amber-900/30 group`}
        >
          <ShieldAlert size={16} />
          <div className="text-[10px] font-bold">Reação</div>
          {state.reactionPenalty > 0 && (
             <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black px-1 rounded animate-in zoom-in">
               -{state.reactionPenalty}
             </div>
          )}
        </button>

        {/* ROW 2 */}
        
        {/* FULL ACTION (Consumes Standard + ALL Move) */}
        <button
          onClick={spendFullAction}
          disabled={!canFullAction}
          className={`col-span-2 p-2 rounded-lg border flex items-center justify-center gap-2 transition-all active:scale-95 h-10
            ${canFullAction 
              ? 'bg-purple-900/30 border-purple-500/50 text-purple-300 hover:bg-purple-800/40' 
              : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
          `}
        >
           <FastForward size={14} />
           <span className="text-xs font-bold uppercase">Ação Completa</span>
        </button>

        {/* FREE ACTION */}
        <button
           onClick={triggerFreeAction}
           className={`col-span-2 p-2 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 h-10 hover:bg-slate-800 text-slate-400 hover:text-white
             ${freeActionFlash ? 'bg-white text-black border-white' : 'bg-slate-900'}
           `}
        >
           <Zap size={14} />
           <span className="text-xs font-bold uppercase">Ação Livre</span>
        </button>

      </div>
      
      {/* Logic Explanation Footer */}
      <div className="mt-2 flex justify-between text-[9px] text-slate-600 font-mono">
         <span>Completa = Padrão + Todo Movimento</span>
         {state.reactionPenalty > 0 && <span className="text-red-500 font-bold">Penalidade (Luta/Reflexos): -{state.reactionPenalty}</span>}
      </div>
    </div>
  );
};
