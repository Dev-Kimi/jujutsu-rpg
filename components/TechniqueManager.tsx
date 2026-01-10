import React, { useState } from 'react';
import { Technique, SubTechnique } from '../types';
import { Zap, Plus, Trash2, ChevronDown, ChevronRight, Wand2, Book, Sparkles } from 'lucide-react';

interface TechniqueManagerProps {
  techniques: Technique[];
  onAdd: (technique: Technique) => void;
  onUpdate: (id: string, field: keyof Technique, value: any) => void;
  onRemove: (id: string) => void;
}

export const TechniqueManager: React.FC<TechniqueManagerProps> = ({ techniques, onAdd, onUpdate, onRemove }) => {
  const [expandedTechniqueId, setExpandedTechniqueId] = useState<string | null>(null);
  const [expandedSubTechniqueId, setExpandedSubTechniqueId] = useState<string | null>(null);

  const toggleExpandTechnique = (id: string) => {
    setExpandedTechniqueId(expandedTechniqueId === id ? null : id);
    setExpandedSubTechniqueId(null); // Reset sub-technique expansion
  };

  const toggleExpandSubTechnique = (id: string) => {
    setExpandedSubTechniqueId(expandedSubTechniqueId === id ? null : id);
  };

  const handleCreateNewTechnique = () => {
    const newTechnique: Technique = {
      id: Math.random().toString(36).substring(2, 9),
      name: "Nova Técnica Inata",
      category: "Inata",
      description: "Descreva o conceito principal desta técnica.",
      subTechniques: []
    };
    onAdd(newTechnique);
    setExpandedTechniqueId(newTechnique.id);
  };

  const handleAddSubTechnique = (techniqueId: string) => {
    const technique = techniques.find(t => t.id === techniqueId);
    if (!technique) return;

    const newSubTechnique: SubTechnique = {
      id: Math.random().toString(36).substring(2, 9),
      name: "Nova Habilidade",
      description: "Descreva os efeitos desta habilidade.",
      usage: "Ação Padrão"
    };

    const updatedSubTechniques = [...technique.subTechniques, newSubTechnique];
    onUpdate(techniqueId, 'subTechniques', updatedSubTechniques);
    setExpandedSubTechniqueId(newSubTechnique.id);
  };

  const handleUpdateSubTechnique = (techniqueId: string, subTechniqueId: string, field: keyof SubTechnique, value: string) => {
    const technique = techniques.find(t => t.id === techniqueId);
    if (!technique) return;

    const updatedSubTechniques = technique.subTechniques.map(st =>
      st.id === subTechniqueId ? { ...st, [field]: value } : st
    );
    onUpdate(techniqueId, 'subTechniques', updatedSubTechniques);
  };

  const handleRemoveSubTechnique = (techniqueId: string, subTechniqueId: string) => {
    const technique = techniques.find(t => t.id === techniqueId);
    if (!technique) return;

    const updatedSubTechniques = technique.subTechniques.filter(st => st.id !== subTechniqueId);
    onUpdate(techniqueId, 'subTechniques', updatedSubTechniques);
    if (expandedSubTechniqueId === subTechniqueId) {
      setExpandedSubTechniqueId(null);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <h3 className="font-bold text-slate-300 uppercase tracking-wider text-sm flex items-center gap-2">
           <Wand2 size={16} className="text-curse-400" /> Técnicas Inatas
        </h3>
        <button 
          onClick={handleCreateNewTechnique}
          className="flex items-center gap-1 text-xs bg-curse-600 hover:bg-curse-500 text-white px-3 py-1.5 rounded transition-colors duration-100 font-bold"
        >
          <Plus size={14} /> Nova Técnica
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {techniques.length === 0 && (
          <div className="text-center text-slate-600 text-sm py-10 italic">
            Nenhuma técnica inata criada.
          </div>
        )}

        {techniques.map(tech => (
          <div key={tech.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            
            {/* Technique Header - Conceito Principal */}
            <div 
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-900/50 transition-colors duration-100 border-l-4 border-curse-500"
              onClick={() => toggleExpandTechnique(tech.id)}
            >
              <div className="text-curse-400 transition-transform duration-100">
                {expandedTechniqueId === tech.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Book size={16} className="text-curse-400" />
                    <span className="font-bold text-white text-base">{tech.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    {tech.subTechniques.length} {tech.subTechniques.length === 1 ? 'Habilidade' : 'Habilidades'}
                  </span>
                </div>
                {expandedTechniqueId !== tech.id && tech.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{tech.description}</p>
                )}
              </div>
            </div>

            {/* Technique Editor Body - Expanded */}
            {expandedTechniqueId === tech.id && (
              <div className="border-t border-slate-800 bg-slate-900/30 animate-in slide-in-from-top-2">
                
                {/* Edit Main Concept */}
                <div className="p-4 space-y-3 border-b border-slate-800/50">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Conceito Principal</label>
                    <input 
                      type="text"
                      value={tech.name}
                      onChange={(e) => onUpdate(tech.id, 'name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                      placeholder="Ex: Manipulação de Sangue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição do Conceito</label>
                    <textarea 
                      value={tech.description}
                      onChange={(e) => onUpdate(tech.id, 'description', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-curse-500 focus:outline-none min-h-[60px]"
                      placeholder="Descreva o conceito geral e o funcionamento da sua técnica inata..."
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                    <button 
                      onClick={() => handleAddSubTechnique(tech.id)}
                      className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors duration-100 font-bold"
                    >
                      <Plus size={12} /> Adicionar Habilidade
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Excluir "${tech.name}" e todas suas habilidades?`)) {
                          onRemove(tech.id);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-950/30 transition-colors duration-100"
                    >
                      <Trash2 size={12} /> Excluir Técnica
                    </button>
                  </div>
                </div>

                {/* Sub-Techniques List */}
                <div className="p-3 space-y-2">
                  {tech.subTechniques.length === 0 && (
                    <div className="text-center text-slate-600 text-xs py-4 italic border border-dashed border-slate-800 rounded">
                      Nenhuma habilidade criada. Clique em "Adicionar Habilidade" acima.
                    </div>
                  )}

                  {tech.subTechniques.map((subTech, index) => (
                    <div key={subTech.id} className="bg-slate-950/50 border border-slate-700 rounded-lg overflow-hidden">
                      
                      {/* Sub-Technique Header */}
                      <div 
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-800/50 transition-colors duration-100"
                        onClick={() => toggleExpandSubTechnique(subTech.id)}
                      >
                        <div className="text-slate-500 transition-transform duration-100">
                          {expandedSubTechniqueId === subTech.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                        
                        <Sparkles size={12} className="text-emerald-400" />
                        
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-200 text-xs">{subTech.name}</span>
                          {expandedSubTechniqueId !== subTech.id && (
                            <span className="text-[10px] text-slate-500 ml-2">({subTech.usage})</span>
                          )}
                        </div>
                      </div>

                      {/* Sub-Technique Editor */}
                      {expandedSubTechniqueId === subTech.id && (
                        <div className="p-3 border-t border-slate-700 bg-slate-900/30 space-y-2 animate-in slide-in-from-top-1">
                          
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nome da Habilidade</label>
                            <input 
                              type="text"
                              value={subTech.name}
                              onChange={(e) => handleUpdateSubTechnique(tech.id, subTech.id, 'name', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              placeholder="Ex: Lâmina de Sangue"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Modo de Usar</label>
                            <input 
                              type="text"
                              value={subTech.usage}
                              onChange={(e) => handleUpdateSubTechnique(tech.id, subTech.id, 'usage', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              placeholder="Ex: Ação Padrão, Reação, Passiva..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Descrição e Efeitos</label>
                            <textarea 
                              value={subTech.description}
                              onChange={(e) => handleUpdateSubTechnique(tech.id, subTech.id, 'description', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none min-h-[60px]"
                              placeholder="Descreva os efeitos, alcance, custo, etc..."
                            />
                          </div>

                          <div className="flex justify-end pt-1">
                            <button 
                              onClick={() => {
                                if (confirm(`Excluir "${subTech.name}"?`)) {
                                  handleRemoveSubTechnique(tech.id, subTech.id);
                                }
                              }}
                              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-950/30 transition-colors duration-100"
                            >
                              <Trash2 size={10} /> Excluir
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};
