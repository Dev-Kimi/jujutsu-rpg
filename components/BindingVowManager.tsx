import React, { useState } from 'react';
import { BindingVow, Character } from '../types';
import { Plus, Trash2, Edit2, X, Check, Scroll } from 'lucide-react';

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
    isActive: true
  });
  const [newBonus, setNewBonus] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      benefit: '',
      restriction: '',
      bonuses: [],
      isActive: true
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
