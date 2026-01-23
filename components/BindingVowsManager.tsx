import React, { useState, useMemo } from 'react';
import { BindingVow, Character, Skill } from '../types';
import { Plus, Trash2, Edit2, X, Check, Scroll, Filter, ArrowUpDown } from 'lucide-react';

interface BindingVowsManagerProps {
  char: Character;
  onUpdateCharacter: (field: keyof Character | Partial<Character>, value?: any) => void;
  readOnly?: boolean;
}

export const BindingVowsManager: React.FC<BindingVowsManagerProps> = ({ char, onUpdateCharacter, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingVow, setEditingVow] = useState<BindingVow | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<BindingVow>>({
    name: '',
    description: '',
    benefit: '',
    restriction: '',
    bonuses: [],
    isActive: true,
    skillModifiers: []
  });
  const [newBonus, setNewBonus] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [modifierDraft, setModifierDraft] = useState<{ skillName: string; value: number }>({
    skillName: '',
    value: 0
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      benefit: '',
      restriction: '',
      bonuses: [],
      isActive: true,
      skillModifiers: []
    });
    setNewBonus('');
    setEditingVow(null);
    setIsEditing(false);
  };

  const handleEditClick = (vow: BindingVow) => {
    setEditingVow(vow);
    setFormData({ ...vow });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.description) {
      alert("Nome e descrição são obrigatórios.");
      return;
    }

    const currentVows = char.bindingVows || [];
    let updatedVows: BindingVow[];

    if (editingVow) {
      // Update existing
      updatedVows = currentVows.map(v => 
        v.id === editingVow.id ? { ...v, ...formData } as BindingVow : v
      );
    } else {
      // Create new
      const newVow: BindingVow = {
        id: Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
        ...formData
      } as BindingVow;
      updatedVows = [...currentVows, newVow];
    }

    onUpdateCharacter('bindingVows', updatedVows);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este Voto Vinculativo?")) {
      const updatedVows = (char.bindingVows || []).filter(v => v.id !== id);
      onUpdateCharacter('bindingVows', updatedVows);
    }
  };

  const handleToggleActive = (vow: BindingVow) => {
    const updatedVows = (char.bindingVows || []).map(v => 
      v.id === vow.id ? { ...v, isActive: !v.isActive } : v
    );
    onUpdateCharacter('bindingVows', updatedVows);
  };

  const addBonus = () => {
    if (!newBonus.trim()) return;
    setFormData(prev => ({
      ...prev,
      bonuses: [...(prev.bonuses || []), newBonus.trim()]
    }));
    setNewBonus('');
  };

  const removeBonus = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bonuses: (prev.bonuses || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddSkillModifier = () => {
    const value = Number(modifierDraft.value);
    if (!modifierDraft.skillName || isNaN(value)) return;
    if (value < -10 || value > 10) {
      alert('Modificadores devem estar entre -10 e +10.');
      return;
    }

    setFormData(prev => {
      const current = prev.skillModifiers || [];
      const existingIndex = current.findIndex(m => m.skillName === modifierDraft.skillName);
      const next =
        existingIndex >= 0
          ? current.map((m, i) =>
              i === existingIndex ? { ...m, value } : m
            )
          : [...current, { skillName: modifierDraft.skillName, value }];

      const total = next.reduce((sum, m) => sum + m.value, 0);
      if (total < -10 || total > 10) {
        alert('A soma total dos modificadores deve ficar entre -10 e +10.');
        return prev;
      }

      return {
        ...prev,
        skillModifiers: next
      };
    });
  };

  const handleRemoveSkillModifier = (skillName: string) => {
    setFormData(prev => ({
      ...prev,
      skillModifiers: (prev.skillModifiers || []).filter(m => m.skillName !== skillName)
    }));
  };

  const allSkills: Skill[] = useMemo(() => {
    return (char.skills || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [char.skills]);

  const filteredSkills = useMemo(() => {
    const term = skillSearch.toLowerCase();
    if (!term) return allSkills;
    return allSkills.filter(s => s.name.toLowerCase().includes(term));
  }, [allSkills, skillSearch]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">V</span>
                </div>
                Votos Vinculativos
            </h3>
            <p className="text-sm text-slate-400 mt-1">
                Contratos autoimpostos que garantem benefícios em troca de restrições
            </p>
        </div>
        {!readOnly && !isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg transition-colors"
                title="Adicionar Novo Voto"
            >
                <Plus size={20} />
            </button>
        )}
      </div>

      <div className="flex-1 p-4">
        {isEditing ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-white text-lg">
                        {editingVow ? 'Editar Voto' : 'Novo Voto Vinculativo'}
                    </h4>
                    <button onClick={resetForm} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome do Voto</label>
                        <input 
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-purple-500 outline-none"
                            placeholder="Ex: Revelar a Mão"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label>
                        <textarea 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-purple-500 outline-none min-h-[80px]"
                            placeholder="Descrição narrativa do voto..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">Benefício</label>
                            <textarea 
                                value={formData.benefit}
                                onChange={e => setFormData({...formData, benefit: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 outline-none min-h-[60px]"
                                placeholder="O que você ganha..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-red-400 uppercase mb-1">Restrição</label>
                            <textarea 
                                value={formData.restriction}
                                onChange={e => setFormData({...formData, restriction: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-red-500 outline-none min-h-[60px]"
                                placeholder="O que você perde/limita..."
                            />
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                        <label className="block text-xs font-bold text-purple-400 uppercase mb-2">Bônus Específicos</label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                value={newBonus}
                                onChange={e => setNewBonus(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addBonus()}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                                placeholder="Ex: +20% de Dano, +1 Dado em Testes"
                            />
                            <button 
                                onClick={addBonus}
                                className="bg-slate-800 hover:bg-slate-700 text-purple-300 px-3 rounded font-bold"
                            >
                                +
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.bonuses?.map((bonus, idx) => (
                                <span key={idx} className="bg-purple-900/30 border border-purple-500/30 text-purple-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                                    {bonus}
                                    <button onClick={() => removeBonus(idx)} className="hover:text-white"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-curse-400 uppercase">Votação Personalizada (Perícias)</label>
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-slate-500" />
                                <input
                                    type="text"
                                    value={skillSearch}
                                    onChange={e => setSkillSearch(e.target.value)}
                                    placeholder="Buscar perícia..."
                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-40"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="border border-slate-800 rounded p-2">
                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Perícias</div>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                    {filteredSkills.map(skill => {
                                        const activeMod = (formData.skillModifiers || []).find(m => m.skillName === skill.name);
                                        return (
                                            <div key={skill.id} className="flex items-center justify-between gap-2 bg-slate-900/40 border border-slate-800 rounded px-2 py-1">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs text-white font-medium truncate">{skill.name}</div>
                                                    <div className="text-[10px] text-slate-500">{skill.attribute || '-'}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={activeMod?.value ?? (modifierDraft.skillName === skill.name ? modifierDraft.value : 0)}
                                                        onChange={e => setModifierDraft({ skillName: skill.name, value: parseInt(e.target.value) || 0 })}
                                                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center"
                                                    />
                                                    <button
                                                        onClick={() => { setModifierDraft({ skillName: skill.name, value: activeMod?.value ?? 0 }); handleAddSkillModifier(); }}
                                                        className="px-2 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-curse-300"
                                                        title="Adicionar/Atualizar modificador"
                                                    >
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="border border-slate-800 rounded p-2">
                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
                                    <span>Modificadores do Voto</span>
                                    <span className="text-slate-500">Limite total: -10 a +10 | por perícia: -10 a +10</span>
                                </div>
                                <div className="space-y-2">
                                    {(formData.skillModifiers || []).length === 0 && (
                                        <div className="text-xs text-slate-500">Nenhum modificador adicionado.</div>
                                    )}
                                    {(formData.skillModifiers || []).map(mod => (
                                        <div key={mod.skillName} className="flex items-center justify-between gap-2 bg-slate-900/40 border border-slate-800 rounded px-2 py-1">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-white font-medium truncate">{mod.skillName}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={mod.value}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        skillModifiers: (prev.skillModifiers || []).map(m =>
                                                            m.skillName === mod.skillName ? { ...m, value: parseInt(e.target.value) || 0 } : m
                                                        )
                                                    }))}
                                                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center"
                                                />
                                                <button
                                                    onClick={() => handleRemoveSkillModifier(mod.skillName)}
                                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-red-400"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400">
                                    Total atual: {(formData.skillModifiers || []).reduce((sum, m) => sum + m.value, 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase">Visualização em Tempo Real</label>
                            <ArrowUpDown size={14} className="text-slate-500" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(char.skills || []).slice(0, 8).map(skill => {
                                const mod = (formData.skillModifiers || []).find(m => m.skillName === skill.name)?.value || 0;
                                const other = skill.otherValue || 0;
                                const train = skill.value || 0;
                                const total = train + other + mod;
                                return (
                                    <div key={skill.id} className="flex items-center justify-between bg-slate-900/40 border border-slate-800 rounded px-2 py-1">
                                        <div className="text-xs text-white font-medium">{skill.name}</div>
                                        <div className="text-xs font-mono text-slate-300">{train} + {other} + {mod} = <span className="text-curse-300 font-bold">{total}</span></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const data = JSON.stringify(formData);
                                    const blob = new Blob([data], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `voto_${formData.name || 'template'}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold"
                            >
                                Exportar Template
                            </button>
                            <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold cursor-pointer">
                                Importar Template
                                <input
                                    type="file"
                                    accept="application/json"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            try {
                                                const data = JSON.parse(String(reader.result));
                                                setFormData(prev => ({ ...prev, ...data }));
                                            } catch {
                                                alert('Arquivo inválido.');
                                            }
                                        };
                                        reader.readAsText(file);
                                    }}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <button 
                            onClick={handleSave}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 mt-4"
                        >
                            <Check size={18} /> Salvar Voto
                        </button>
                    </div>
                    <button 
                        onClick={handleSave}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4"
                    >
                        <Check size={18} /> Salvar Voto
                    </button>
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                {(!char.bindingVows || char.bindingVows.length === 0) && (
                    <div className="text-center py-12 text-slate-500 italic">
                        <Scroll size={48} className="mx-auto mb-4 opacity-20" />
                        Nenhum Voto Vinculativo ativo.
                    </div>
                )}

                {char.bindingVows?.map(vow => (
                    <div key={vow.id} className={`bg-slate-950 border rounded-lg p-4 transition-all ${vow.isActive ? 'border-purple-500/50 shadow-[0_0_15px_-5px_rgba(168,85,247,0.3)]' : 'border-slate-800 opacity-60'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-bold text-lg ${vow.isActive ? 'text-white' : 'text-slate-400'}`}>{vow.name}</h4>
                                    {!vow.isActive && <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded">Inativo</span>}
                                </div>
                                <p className="text-sm text-slate-300 mb-3">{vow.description}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded p-2">
                                        <span className="text-xs font-bold text-emerald-400 block mb-1">BENEFÍCIO</span>
                                        <span className="text-xs text-emerald-100">{vow.benefit || '-'}</span>
                                    </div>
                                    <div className="bg-red-950/20 border border-red-500/20 rounded p-2">
                                        <span className="text-xs font-bold text-red-400 block mb-1">RESTRIÇÃO</span>
                                        <span className="text-xs text-red-100">{vow.restriction || '-'}</span>
                                    </div>
                                </div>

                                {vow.bonuses && vow.bonuses.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {vow.bonuses.map((bonus, idx) => (
                                            <span key={idx} className="text-[10px] font-bold bg-purple-900/40 text-purple-200 border border-purple-500/30 px-2 py-1 rounded">
                                                {bonus}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {!readOnly && (
                                    <>
                                        <button
                                            onClick={() => handleToggleActive(vow)}
                                            className={`p-2 rounded transition-colors ${
                                                vow.isActive
                                                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                            }`}
                                            title={vow.isActive ? "Desativar" : "Ativar"}
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(vow)}
                                            className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(vow.id)}
                                            className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
