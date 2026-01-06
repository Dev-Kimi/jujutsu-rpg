import React from 'react';
import { Character } from '../types';
import { Save, Plus, Trash2, Upload, User, LayoutGrid, Clock } from 'lucide-react';

interface CharacterManagerProps {
  currentChar: Character;
  savedCharacters: Character[];
  onSave: () => void;
  onLoad: (char: Character) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({
  currentChar,
  savedCharacters,
  onSave,
  onLoad,
  onDelete,
  onCreateNew
}) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Current Session Actions */}
      <div className="bg-slate-900 border border-curse-500/30 rounded-2xl p-6 relative overflow-hidden">
         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                 <User className="text-curse-400" /> Personagem Atual
              </h2>
              <div className="text-sm text-slate-400 mt-1">
                 <span className="text-white font-bold">{currentChar.name}</span> • Nível {currentChar.level} {currentChar.characterClass}
              </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={onSave}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-900/20"
               >
                 <Save size={18} /> Salvar Ficha
               </button>
               <button 
                 onClick={() => {
                   if (window.confirm("Tem certeza? Alterações não salvas no personagem atual serão perdidas.")) {
                     onCreateNew();
                   }
                 }}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors"
               >
                 <Plus size={18} /> Novo
               </button>
            </div>
         </div>
         {/* Background decoration */}
         <div className="absolute -right-10 -top-10 text-curse-900/20 rotate-12 pointer-events-none">
            <LayoutGrid size={150} />
         </div>
      </div>

      {/* Saved Characters List */}
      <div>
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={16} /> Personagens Salvos
         </h3>

         {savedCharacters.length === 0 ? (
           <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 italic">
             Nenhum personagem salvo encontrado. Salve o atual para vê-lo aqui.
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCharacters.map(char => (
                <div key={char.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col hover:border-curse-500/50 transition-colors group">
                   <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center border border-slate-800 font-bold text-curse-400">
                         {char.level}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                         {char.origin}
                      </div>
                   </div>
                   
                   <h4 className="font-bold text-white text-lg truncate mb-1">{char.name}</h4>
                   <p className="text-xs text-slate-400 mb-4">{char.characterClass}</p>

                   <div className="mt-auto flex gap-2 pt-3 border-t border-slate-800/50">
                      <button 
                        onClick={() => {
                          if (window.confirm(`Carregar ${char.name}? Certifique-se de ter salvo seu personagem atual.`)) {
                             onLoad(char);
                          }
                        }}
                        className="flex-1 py-1.5 bg-curse-900/30 hover:bg-curse-600 text-curse-200 hover:text-white rounded text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1"
                      >
                         <Upload size={14} /> Carregar
                      </button>
                      <button 
                        onClick={() => {
                           if (window.confirm(`Excluir ${char.name} permanentemente?`)) {
                              onDelete(char.id);
                           }
                        }}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-red-900/50 text-slate-500 hover:text-red-400 rounded transition-colors"
                        title="Excluir"
                      >
                         <Trash2 size={14} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
};
