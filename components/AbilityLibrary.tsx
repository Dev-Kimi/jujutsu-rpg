import React, { useState, useEffect } from 'react';
import { Ability } from '../types';
import { PRESET_ABILITIES } from '../utils/presets';
import { Search, Plus, X, BookOpen, ChevronRight, Sword, Wand2, Brain, Hammer, Ghost, Edit2, Save, Trash2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';

let audioCtx: AudioContext | null = null;

interface AbilityLibraryProps {
  onSelect: (ability: Partial<Ability>) => void;
  onClose: () => void;
  initialCategory?: string;
}

export const AbilityLibrary: React.FC<AbilityLibraryProps> = ({ onSelect, onClose, initialCategory }) => {
  const [activeTab, setActiveTab] = useState(initialCategory || 'Combatente');
  const [activeSubTab, setActiveSubTab] = useState('Manipulação');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; cost: string; description: string }>({ name: '', cost: '', description: '' });
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customForm, setCustomForm] = useState<{ name: string; cost: string; description: string }>({ name: '', cost: '', description: '' });
  const [overrides, setOverrides] = useState<Record<string, Partial<Ability>>>({});
  const isAdmin = auth.currentUser?.uid === 'qSsTOdiZE2N2LjDuf4R3CC49cAq2';

  const categories = ['Combatente', 'Feiticeiro', 'Especialista', 'Restrição Celestial', 'Habilidades Amaldiçoadas'];
  const cursedSubCategories = ['Manipulação', 'Barreiras', 'Energia Reversa'];

  // Handle case where initialCategory might be invalid or 'Todos' if passed from somewhere else
  useEffect(() => {
    if (initialCategory && categories.includes(initialCategory)) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    const ref = doc(db, 'config', 'abilityOverrides');
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Record<string, Partial<Ability>>;
        setOverrides(data || {});
      } else {
        setOverrides({});
      }
    }, (err) => {
      console.error('Erro ao carregar overrides de habilidades', err);
    });
    return () => unsubscribe();
  }, []);

  const presetNames = new Set(
    PRESET_ABILITIES.map(p => p.name).filter(Boolean) as string[]
  );
  const customAbilities = Object.entries(overrides)
    .filter(([key]) => !presetNames.has(key))
    .map(([key, ov]) => ({
      name: ov.name || key,
      cost: ov.cost || '',
      description: ov.description || '',
      category: ov.category || 'Combatente',
      subCategory: ov.subCategory,
      baseName: key
    }));

  const allAbilities = [
    ...PRESET_ABILITIES.map(p => {
      const ov = overrides[p.name || ''];
      return { ...p, ...(ov || {}), baseName: p.name };
    }),
    ...customAbilities
  ];

  const filteredAbilities = allAbilities.filter(item => {
    const matchesTab = item.category === activeTab;
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Sub-category filtering logic for Habilidades Amaldiçoadas
    if (activeTab === 'Habilidades Amaldiçoadas' && matchesTab) {
       // If item has a subCategory defined, match it. If not, treat as "Manipulação" (default) or handle accordingly
       // Our presets for cursed abilities now have subCategory.
       const subMatch = (item.subCategory === activeSubTab || (!item.subCategory && activeSubTab === 'Manipulação'));
       return matchesSearch && subMatch;
    }

    return matchesTab && matchesSearch;
  });

  const toggleExpand = (name: string) => {
    setExpandedId(expandedId === name ? null : name);
  };

  const getTabColor = (cat: string, isActive: boolean) => {
    if (!isActive) return 'text-slate-500 border-transparent hover:text-slate-300';
    
    switch(cat) {
      case 'Combatente': return 'text-red-400 border-red-500 bg-red-950/10';
      case 'Feiticeiro': return 'text-curse-400 border-curse-500 bg-curse-950/10';
      case 'Especialista': return 'text-blue-400 border-blue-500 bg-blue-950/10';
      case 'Restrição Celestial': return 'text-slate-200 border-slate-400 bg-slate-800/30';
      case 'Habilidades Amaldiçoadas': return 'text-purple-300 border-purple-500 bg-purple-950/20';
      default: return 'text-white border-slate-500';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch(category) {
      case 'Combatente': return <Sword size={14} className="text-red-400" />;
      case 'Feiticeiro': return <Wand2 size={14} className="text-curse-400" />;
      case 'Especialista': return <Brain size={14} className="text-blue-400" />;
      case 'Restrição Celestial': return <Hammer size={14} className="text-slate-200" />;
      case 'Habilidades Amaldiçoadas': return <Ghost size={14} className="text-purple-400" />;
      default: return <BookOpen size={14} className="text-slate-500" />;
    }
  };

  const beginEdit = (ability: any) => {
    setExpandedId(ability.name || null);
    setEditingName(ability.baseName || ability.name || '');
    setEditForm({
      name: ability.name || '',
      cost: ability.cost || '',
      description: ability.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingName(null);
  };

  const saveEdit = async () => {
    if (!editingName) return;
    const payload: Partial<Ability> = {
      name: editForm.name,
      cost: editForm.cost,
      description: editForm.description,
      category: activeTab,
      subCategory: activeTab === 'Habilidades Amaldiçoadas' ? activeSubTab : undefined
    };
    try {
      const safePayload: Record<string, any> = { ...payload };
      Object.keys(safePayload).forEach(k => {
        if (safePayload[k] === undefined) {
          delete safePayload[k];
        }
      });
      const ref = doc(db, 'config', 'abilityOverrides');
      await setDoc(ref, { [editingName]: safePayload }, { merge: true });
      setOverrides(prev => ({ ...prev, [editingName]: safePayload }));
      setEditingName(null);
    } catch (err) {
      console.error('Erro ao salvar override de habilidade', err);
    }
  };

  const removeOverride = async (abilityName: string) => {
    try {
      const ref = doc(db, 'config', 'abilityOverrides');
      await updateDoc(ref, { [abilityName]: deleteField() });
      setOverrides(prev => {
        const next = { ...prev };
        delete next[abilityName];
        return next;
      });
      if (editingName === abilityName) setEditingName(null);
    } catch (err) {
      console.error('Erro ao remover override de habilidade', err);
    }
  };

  const triggerFeedback = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        (navigator as any).vibrate?.(12);
      }
      const AnyAudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AnyAudioContext) return;
      audioCtx = audioCtx || new AnyAudioContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume?.();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 220;
      gain.gain.value = 0.02;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  };

  const startCustom = () => {
    setIsCreatingCustom(true);
    setCustomForm({ name: '', cost: '', description: '' });
    setEditingName(null);
    setExpandedId(null);
  };

  const cancelCustom = () => {
    setIsCreatingCustom(false);
  };

  const addCustomToSheet = () => {
    triggerFeedback();
    const payload: Partial<Ability> = {
      name: customForm.name?.trim() || 'Habilidade Customizada',
      cost: customForm.cost || '',
      description: customForm.description || '',
      category: activeTab,
      subCategory: activeTab === 'Habilidades Amaldiçoadas' ? activeSubTab : undefined,
    };
    onSelect(payload);
    setIsCreatingCustom(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 w-full sm:max-w-3xl sm:rounded-2xl border-x-0 sm:border border-slate-800 shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 sm:rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-curse-400"/> Biblioteca
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Tabs Area */}
        <div className="shrink-0 bg-slate-950 border-b border-slate-800">
           <div className="flex w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 scroll-smooth px-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setActiveSubTab('Manipulação'); setIsCreatingCustom(false); }}
                className={`flex-none py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap mb-[-1px]
                  ${getTabColor(cat, activeTab === cat)}
                `}
              >
                {cat}
              </button>
            ))}
           </div>
        </div>

        {/* Sub-Tabs (Specific for Habilidades Amaldiçoadas) */}
        {activeTab === 'Habilidades Amaldiçoadas' && (
          <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-3 py-2 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
             {cursedSubCategories.map(sub => (
               <button
                 key={sub}
                 onClick={() => { setActiveSubTab(sub); setIsCreatingCustom(false); }}
                 className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors border
                    ${activeSubTab === sub 
                       ? 'bg-purple-900/50 text-purple-200 border-purple-500/50' 
                       : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}
                 `}
               >
                 {sub}
               </button>
             ))}
          </div>
        )}

        {/* Search */}
        <div className="p-3 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder={`Buscar em ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-curse-500 transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-900/50 custom-scrollbar">
          {filteredAbilities.length === 0 && !isCreatingCustom && (
             <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center">
                <BookOpen size={32} className="mb-3 opacity-20" />
                Nenhuma habilidade encontrada nesta categoria.
             </div>
          )}

          {isCreatingCustom && (
            <div className="bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-slate-900/60 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(activeTab)}
                  <div className="text-sm font-bold text-white">Criar Habilidade</div>
                  {activeTab === 'Habilidades Amaldiçoadas' && (
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 uppercase">
                      {activeSubTab}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={addCustomToSheet}
                    className="bg-curse-600 hover:bg-curse-500 text-white px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"
                    title="Adicionar à ficha"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                  <button
                    onClick={cancelCustom}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-all active:scale-95 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-500 uppercase">Nome</label>
                  <input
                    value={customForm.name}
                    onChange={(e) => setCustomForm(f => ({ ...f, name: e.target.value }))}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
                    placeholder="Ex: Corte Rápido"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-500 uppercase">Custo</label>
                  <input
                    value={customForm.cost}
                    onChange={(e) => setCustomForm(f => ({ ...f, cost: e.target.value }))}
                    className="w-40 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
                    placeholder="Ex: 5 PE"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase mb-1">Descrição</label>
                  <textarea
                    value={customForm.description}
                    onChange={(e) => setCustomForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
                    rows={5}
                    placeholder="Descreva os efeitos..."
                  />
                </div>
              </div>
            </div>
          )}

          {filteredAbilities.map((ability, idx) => (
            <div 
              key={idx} 
              className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors group"
            >
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-900/80 transition-colors"
                onClick={() => toggleExpand(ability.name || '')}
              >
                <div className="flex items-center gap-3">
                   <div className={`transition-transform duration-200 ${expandedId === ability.name ? 'rotate-90 text-curse-400' : 'text-slate-600'}`}>
                      <ChevronRight size={18} />
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-200 group-hover:text-white text-sm flex items-center gap-2">
                        {getCategoryIcon(ability.category)}
                        {ability.name}
                        {ability.subCategory && activeTab === 'Habilidades Amaldiçoadas' && (
                           <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700 uppercase">{ability.subCategory}</span>
                        )}
                     </h3>
                     {expandedId !== ability.name && (
                       <p className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                         {ability.description?.replace(/\[([^\]]+)\]\s*Tier \d+ - Requisitos: [^.]+\.\s*/, '').substring(0, 60) || ''}
                         {(ability.description?.replace(/\[([^\]]+)\]\s*Tier \d+ - Requisitos: [^.]+\.\s*/, '').length || 0) > 60 ? '...' : ''}
                       </p>
                     )}
                   </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); beginEdit(ability); }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-all active:scale-95 flex items-center gap-1"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFeedback();
                      onSelect(ability);
                    }}
                    className="bg-slate-800 hover:bg-curse-600 text-slate-300 hover:text-white p-2 rounded-lg transition-all active:scale-95 flex items-center gap-2"
                    title="Adicionar à ficha"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {expandedId === ability.name && (
                <div className="px-4 pb-4 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50 bg-slate-900/50 mt-1 pt-3 animate-in slide-in-from-top-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                     <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                       Custo: {ability.cost || 'Variável'}
                     </span>
                     {ability.description && ability.description.includes('Tier') && (
                       <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-700/50">
                         {ability.description.match(/Tier \d+/)?.[0] || ''}
                     </span>
                     )}
                     {ability.description && ability.description.includes('Requisitos:') && (
                       <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-700/50 max-w-xs break-words">
                         {ability.description.match(/Requisitos: [^.]*\./)?.[0]?.replace(/\.$/, '') || ''}
                     </span>
                     )}
                  </div>
                  <div className="text-slate-300 leading-relaxed space-y-2">
                    {/* Extract action type */}
                    {ability.description.match(/\[([^\]]+)\]/)?.[1] && (
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                        Tipo de Ação: {ability.description.match(/\[([^\]]+)\]/)?.[1]}
                      </div>
                    )}
                    {/* Extract effect description (everything after the tier/requisitos line) */}
                    {isAdmin && editingName === ((ability as any).baseName || (ability.name || '')) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 uppercase">Nome</label>
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 uppercase">Custo</label>
                          <input
                            value={editForm.cost}
                            onChange={(e) => setEditForm(f => ({ ...f, cost: e.target.value }))}
                            className="w-40 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase mb-1">Descrição</label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
                            rows={5}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1.5 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1"
                          >
                            <Save size={14} /> Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Cancelar
                          </button>
                          {overrides[(ability as any).baseName || (ability.name || '')] && (
                            <button
                              onClick={() => removeOverride((ability as any).baseName || (ability.name || ''))}
                              className="px-3 py-1.5 text-xs font-bold rounded bg-red-700 hover:bg-red-600 text-white flex items-center gap-1"
                            >
                              <Trash2 size={14} /> Remover Override
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line text-slate-300 leading-relaxed">
                        {(() => {
                          const desc = ability.description || '';
                          // Remove the action type, tier and requisitos part
                          const cleaned = desc.replace(/\[([^\]]+)\]\s*Tier\s*\d+\s*-\s*Requisitos:\s*[^.]*\.\s*/i, '');
                          return cleaned.trim() || desc;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 sm:rounded-b-2xl flex justify-between items-center text-xs text-slate-500 shrink-0">
           <span>{filteredAbilities.length} itens</span>
           <button onClick={startCustom} className="hover:text-curse-400 underline">
              Criar Customizada
           </button>
        </div>
      </div>
    </div>
  );
};
