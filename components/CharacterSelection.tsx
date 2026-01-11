import React from 'react';
import { Character } from '../types';
import { Plus, Trash2, Crown, Skull } from 'lucide-react';

interface CharacterSelectionProps {
  savedCharacters: Character[];
  onSelect: (char: Character) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  savedCharacters,
  onSelect,
  onCreate,
  onDelete
}) => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-curse-900/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blood-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
           <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
              Agentes: {savedCharacters.length} / ∞
           </div>
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
              JUJUTSU <span className="text-transparent bg-clip-text bg-gradient-to-r from-curse-500 to-curse-300">RPG</span>
           </h1>
           <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Companion App & Combat Manager</p>
        </div>

        {/* Action Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
           
           {/* Create New Card */}
           <button 
             onClick={onCreate}
             className="group relative h-48 sm:h-56 bg-gradient-to-br from-curse-600 to-curse-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition-all duration-100 shadow-xl shadow-curse-900/30 overflow-hidden"
           >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-100">
                 <Plus size={24} className="text-white" />
              </div>
              <span className="font-bold text-white uppercase tracking-wider text-sm">Novo Agente</span>
           </button>

           {/* Character Cards */}
           {savedCharacters.map(char => (
             <div 
               key={char.id} 
               onClick={() => onSelect(char)}
               className="group relative h-48 sm:h-56 bg-slate-900 border border-slate-800 rounded-2xl hover:border-curse-500/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] transition-all duration-100 cursor-pointer overflow-hidden"
             >
                {/* 1. Background Layer */}
                {char.imageUrl ? (
                   <div className="absolute inset-0 z-0">
                      <img 
                        src={char.imageUrl} 
                        alt="Background" 
                        className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-150"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
                   </div>
                ) : (
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12 duration-100 pointer-events-none z-0">
                      <Skull size={120} />
                   </div>
                )}

                {/* 2. Content Layer */}
                <div className="absolute inset-0 z-10 p-5 flex flex-col pointer-events-none">
                   {/* Top Left Badge */}
                   <div className="flex justify-between items-start">
                      <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2 py-1 rounded-lg text-[10px] font-bold font-mono text-curse-400 flex items-center gap-1 shadow-lg">
                         <Crown size={10} /> Lv.{char.level}
                      </div>
                   </div>
                   
                   {/* Bottom Info */}
                   <div className="mt-auto">
                      <h3 className="text-xl font-black text-white truncate group-hover:text-curse-200 transition-colors duration-75 leading-tight">
                        {char.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                         <span className="truncate">{char.characterClass}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                         <span className="truncate">{char.origin}</span>
                      </div>
                      <div className="mt-4 w-full bg-curse-600/20 text-curse-200 border border-curse-500/30 py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                         Acessar Ficha
                      </div>
                   </div>
                </div>

                {/* 3. Delete Action (Explicitly positioned and interactive) */}
                <div 
                    className="absolute top-3 right-3 z-50"
                    onClick={(e) => e.stopPropagation()} // Stop bubbling to the card click
                >
                    <button 
                        type="button"
                        onClick={(e) => { 
                            e.stopPropagation();
                            if(window.confirm(`Tem certeza que deseja deletar o agente ${char.name}?`)) {
                                onDelete(char.id); 
                            }
                        }}
                        className="p-2 bg-slate-950/80 hover:bg-red-950 text-slate-400 hover:text-red-500 border border-slate-800 hover:border-red-500/50 rounded-lg backdrop-blur-sm transition-all duration-75 cursor-pointer shadow-lg active:scale-95"
                        title="Excluir Agente"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
             </div>
           ))}
        </div>

        {savedCharacters.length === 0 && (
           <div className="text-center text-slate-600 mt-8 italic animate-pulse">
              Sem agentes registrados. Inicie o recrutamento.
           </div>
        )}

        {/* Version Info */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-lg">
            <span className="text-sm text-slate-400 font-mono select-none">
              Jujutsu RPG v1.4.9
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
