import React, { useState } from 'react';
import { Technique, SubTechnique } from '../types';
import { PRESET_TECHNIQUES } from '../utils/templates';
import { Search, Plus, X, BookOpen, ChevronDown, ChevronRight, Wand2, Sparkles, Trash2, Edit2, Lock } from 'lucide-react';
import { TechniqueCreatePage } from './TechniqueCreatePage';

interface TechniqueLibraryProps {
  userTechniques: Technique[];
  onAddToLibrary: (technique: Technique) => void;
  onUpdateInLibrary: (id: string, field: keyof Technique, value: any) => void;
  onRemoveFromLibrary: (id: string) => void;
  onAddToCharacter: (technique: Technique) => void;
  onClose: () => void;
}

export const TechniqueLibrary: React.FC<TechniqueLibraryProps> = ({ 
  userTechniques, 
  onAddToLibrary, 
  onUpdateInLibrary, 
  onRemoveFromLibrary, 
  onAddToCharacter, 
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTechniqueId, setExpandedTechniqueId] = useState<string | null>(null);
  const [expandedSubTechniqueId, setExpandedSubTechniqueId] = useState<string | null>(null);
  const [editingTechniqueId, setEditingTechniqueId] = useState<string | null>(null);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [editingTechniqueData, setEditingTechniqueData] = useState<Technique | null>(null);
  const [focusSubTechniqueId, setFocusSubTechniqueId] = useState<string | null>(null);

  const toggleExpandTechnique = (id: string) => {
    setExpandedTechniqueId(expandedTechniqueId === id ? null : id);
    setExpandedSubTechniqueId(null);
  };

  const toggleExpandSubTechnique = (id: string) => {
    setExpandedSubTechniqueId(expandedSubTechniqueId === id ? null : id);
  };

  const handleCreateNewTechnique = () => {
    setShowCreatePage(true);
  };

  const handleAddSubTechnique = (techniqueId: string) => {
    const technique = userTechniques.find(t => t.id === techniqueId);
    if (!technique) return;

    const newSubTechnique: SubTechnique = {
      id: Math.random().toString(36).substring(2, 9),
      name: "Nova Habilidade",
      description: "Descreva os efeitos desta habilidade.",
      usage: "Ação Padrão"
    };

    const updatedSubTechniques = [...technique.subTechniques, newSubTechnique];
    onUpdateInLibrary(techniqueId, 'subTechniques', updatedSubTechniques);
    setExpandedSubTechniqueId(newSubTechnique.id);
  };

  const handleUpdateSubTechnique = (techniqueId: string, subTechniqueId: string, field: keyof SubTechnique, value: string) => {
    const technique = userTechniques.find(t => t.id === techniqueId);
    if (!technique) return;

    const updatedSubTechniques = technique.subTechniques.map(st =>
      st.id === subTechniqueId ? { ...st, [field]: value } : st
    );
    onUpdateInLibrary(techniqueId, 'subTechniques', updatedSubTechniques);
  };

  const handleRemoveSubTechnique = (techniqueId: string, subTechniqueId: string) => {
    const technique = userTechniques.find(t => t.id === techniqueId);
    if (!technique) return;

    const updatedSubTechniques = technique.subTechniques.filter(st => st.id !== subTechniqueId);
    onUpdateInLibrary(techniqueId, 'subTechniques', updatedSubTechniques);
    if (expandedSubTechniqueId === subTechniqueId) {
      setExpandedSubTechniqueId(null);
    }
  };

  const getRangeLabel = (sub: SubTechnique) => {
    if (sub.range?.trim()) return sub.range.trim();
    if (sub.rangeType === 'Toque') return 'Toque (Adjacente)';
    if (sub.rangeType === 'Distância' && sub.rangeValue) return `Distância (${sub.rangeValue})`;
    return '';
  };

  const handleAddToCharacter = (technique: Technique) => {
    // Create a copy with new ID for the character
    const techniqueCopy: Technique = {
      ...technique,
      id: Math.random().toString(36).substring(2, 9),
      subTechniques: technique.subTechniques.map(st => ({
        ...st,
        id: Math.random().toString(36).substring(2, 9)
      }))
    };
    onAddToCharacter(techniqueCopy);
  };

  const allTechniques = [...PRESET_TECHNIQUES, ...userTechniques];
  
  const filteredTechniques = allTechniques.filter(tech =>
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPreset = (id: string) => PRESET_TECHNIQUES.some(p => p.id === id);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 w-full sm:max-w-4xl sm:rounded-2xl border-x-0 sm:border border-slate-800 shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {showCreatePage ? (
          <TechniqueCreatePage
            title={editingTechniqueData ? "Editar Técnica" : "Nova Técnica"}
            submitLabel={editingTechniqueData ? "Salvar Alterações" : "Adicionar à Biblioteca"}
            initialTechnique={editingTechniqueData || undefined}
            initialFocusSubTechniqueId={focusSubTechniqueId || undefined}
            onCancel={() => {
              setShowCreatePage(false);
              setEditingTechniqueData(null);
              setFocusSubTechniqueId(null);
            }}
            onCreate={(technique) => {
              if (editingTechniqueData) {
                onUpdateInLibrary(editingTechniqueData.id, 'name', technique.name);
                onUpdateInLibrary(editingTechniqueData.id, 'description', technique.description);
                onUpdateInLibrary(editingTechniqueData.id, 'subTechniques', technique.subTechniques);
                setExpandedTechniqueId(editingTechniqueData.id);
                setEditingTechniqueId(null);
                setEditingTechniqueData(null);
                setFocusSubTechniqueId(null);
                setShowCreatePage(false);
              } else {
                onAddToLibrary(technique);
                setExpandedTechniqueId(technique.id);
                setEditingTechniqueId(null);
                setShowCreatePage(false);
              }
            }}
          />
        ) : (
          <>
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 sm:rounded-t-2xl shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen size={20} className="text-curse-400"/> Biblioteca de Técnicas
                </h2>
                <p className="text-xs text-slate-400 mt-1">Crie técnicas globais e adicione em qualquer ficha</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors duration-100 p-2 hover:bg-slate-800 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text"
                    placeholder="Buscar técnicas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-curse-500 focus:outline-none"
                  />
                </div>
                <button 
                  onClick={handleCreateNewTechnique}
                  className="flex items-center gap-2 bg-curse-600 hover:bg-curse-500 text-white px-4 py-2 rounded-lg transition-colors duration-100 font-bold text-sm whitespace-nowrap"
                >
                  <Plus size={16} /> Nova Técnica
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredTechniques.length === 0 && !searchTerm && (
                <div className="text-center py-12">
                  <Wand2 size={48} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-400 text-sm mb-2">Nenhuma técnica na biblioteca</p>
                  <p className="text-slate-600 text-xs">Clique em "Nova Técnica" para começar</p>
                </div>
              )}

              {filteredTechniques.length === 0 && searchTerm && (
                <div className="text-center py-12">
                  <Search size={48} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-400 text-sm">Nenhuma técnica encontrada</p>
                </div>
              )}

              <div className="space-y-3">
                {filteredTechniques.map(tech => (
                  <div key={tech.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                    
                    <div className="flex items-center gap-3 p-3 border-l-4 border-curse-500">
                  <button
                    onClick={() => toggleExpandTechnique(tech.id)}
                    className="text-curse-400 hover:text-curse-300 transition-colors duration-100"
                  >
                    {expandedTechniqueId === tech.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  
                  <Wand2 size={16} className="text-curse-400" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                         <h3 className="font-bold text-white text-sm truncate">{tech.name}</h3>
                         {isPreset(tech.id) && (
                            <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                               <Lock size={8} /> Sistema
                            </span>
                         )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                          {tech.subTechniques.length} {tech.subTechniques.length === 1 ? 'Habilidade' : 'Habilidades'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCharacter(tech);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-bold transition-colors duration-100"
                          title="Adicionar na ficha atual"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    {expandedTechniqueId !== tech.id && tech.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{tech.description}</p>
                    )}
                  </div>
                </div>

                {/* Technique Expanded Content */}
                {expandedTechniqueId === tech.id && (
                  <div className="border-t border-slate-800 bg-slate-900/30 animate-in slide-in-from-top-2">
                    
                    {/* Edit Mode */}
                    {editingTechniqueId === tech.id && !isPreset(tech.id) ? (
                      <div className="p-4 space-y-3 border-b border-slate-800/50">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Técnica</label>
                          <input 
                            type="text"
                            value={tech.name}
                            onChange={(e) => onUpdateInLibrary(tech.id, 'name', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                            placeholder="Ex: Manipulação de Sangue"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição do Conceito</label>
                          <textarea 
                            value={tech.description}
                            onChange={(e) => onUpdateInLibrary(tech.id, 'description', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-curse-500 focus:outline-none min-h-[60px]"
                            placeholder="Descreva o conceito geral e o funcionamento da técnica..."
                          />
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                          <button 
                            onClick={() => handleAddSubTechnique(tech.id)}
                            className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors duration-100 font-bold"
                          >
                            <Plus size={12} /> Adicionar Habilidade
                          </button>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingTechniqueId(null)}
                              className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded hover:bg-slate-800 transition-colors duration-100"
                            >
                              Concluir
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Excluir "${tech.name}" da biblioteca?`)) {
                                  onRemoveFromLibrary(tech.id);
                                }
                              }}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-950/30 transition-colors duration-100"
                            >
                              <Trash2 size={12} /> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-b border-slate-800/50">
                        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 mb-3">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Técnica Principal</div>
                          <p className="text-sm text-slate-300">{tech.description}</p>
                        </div>
                        {!isPreset(tech.id) && (
                            <button
                            onClick={() => {
                              setEditingTechniqueData(tech);
                              setFocusSubTechniqueId(null);
                              setShowCreatePage(true);
                            }}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-3 py-1 rounded hover:bg-slate-800 transition-colors duration-100"
                            >
                            <Edit2 size={12} /> Editar
                            </button>
                        )}
                        {isPreset(tech.id) && (
                            <p className="text-[10px] text-slate-600 italic">Técnicas de sistema não podem ser editadas diretamente. Adicione à ficha para usar.</p>
                        )}
                      </div>
                    )}

                    {/* Sub-Techniques List */}
                    <div className="p-3 space-y-2">
                      {tech.subTechniques.length === 0 && (
                        <div className="text-center text-slate-600 text-xs py-4 italic border border-dashed border-slate-800 rounded">
                          Nenhuma habilidade criada. {editingTechniqueId === tech.id ? 'Clique em "Adicionar Habilidade" acima.' : 'Clique em "Editar" para adicionar.'}
                        </div>
                      )}

                      {tech.subTechniques.map((subTech) => {
                        const rangeLabel = getRangeLabel(subTech);
                        const resistanceLabel = subTech.resistanceTest && subTech.resistanceTest !== 'Nenhum' ? subTech.resistanceTest : '';
                        const topAttributes = [
                          { label: 'Execução', value: subTech.usage?.trim() || '' },
                          { label: 'Alcance', value: rangeLabel },
                          { label: 'Resistência', value: resistanceLabel }
                        ].filter(item => item.value);
                        return (
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
                              {expandedSubTechniqueId !== subTech.id && subTech.usage && (
                                <span className="text-[10px] text-slate-500 ml-2">({subTech.usage})</span>
                              )}
                            </div>
                            {!isPreset(tech.id) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTechniqueData(tech);
                                  setFocusSubTechniqueId(subTech.id);
                                  setShowCreatePage(true);
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                                title="Editar esta habilidade"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>

                          {/* Sub-Technique Editor */}
                          {expandedSubTechniqueId === subTech.id && editingTechniqueId === tech.id && (
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
                                 <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Dado de Dano/Efeito</label>
                                 <select
                                    value={subTech.diceFace || 'd6'}
                                    onChange={(e) => handleUpdateSubTechnique(tech.id, subTech.id, 'diceFace', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                                 >
                                     <option value="d4">d4</option>
                                     <option value="d6">d6</option>
                                     <option value="d8">d8</option>
                                     <option value="d10">d10</option>
                                     <option value="d12">d12</option>
                                     <option value="d20">d20</option>
                                 </select>
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

                          {/* Sub-Technique View Only */}
                          {expandedSubTechniqueId === subTech.id && editingTechniqueId !== tech.id && (
                            <div className="p-3 border-t border-slate-700 bg-slate-900/30 space-y-2">
                              {topAttributes.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                                  {topAttributes.map((item) => (
                                    <div key={item.label} className="flex gap-2">
                                      <span className="text-slate-500">{item.label}:</span>
                                      <span className="text-slate-300">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Descrição:</span>
                                <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{subTech.description}</p>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                    </div>

                  </div>
                )}

              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 sm:rounded-b-2xl shrink-0">
          <p className="text-xs text-slate-500 text-center">
            Técnicas criadas aqui ficam disponíveis para todas as suas fichas
          </p>
        </div>
          </>
        )}

      </div>
    </div>
  );
};
