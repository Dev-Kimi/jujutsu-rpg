import React, { useMemo, useState } from 'react';
import { X, Hammer, Sword, Zap, Shield, Box } from 'lucide-react';
import { Item } from '../types';

export type ItemCategory = 'Arma' | 'Munição' | 'Proteção' | 'Geral';

export interface ItemFormState {
  name: string;
  category: ItemCategory;
  grade: string;
  spaces: number;
  // weapon
  proficiency: string;
  weaponType: string;
  grip: string;
  damage: string;
  critical: string;
  multiplier: string;
  durability: string;
  damageType: string;
  range: string;
  // armor
  defense: string;
  // general / ammo
  description: string;
}

const defaultFormState: ItemFormState = {
  name: '',
  category: 'Arma',
  grade: 'Mundana',
  spaces: 1,
  proficiency: 'Armas Simples',
  weaponType: 'Corpo a Corpo',
  grip: 'Leve',
  damage: '1d4',
  critical: '20',
  multiplier: '2',
  durability: '5',
  damageType: 'Balístico',
  range: '-',
  defense: '0',
  description: ''
};

// Build a formatted description string based on the form
export const buildItemDescription = (form: ItemFormState): string => {
  if (form.category === 'Arma') {
    return `Proficiência: ${form.proficiency} | Tipo: ${form.weaponType} | Empunhadura: ${form.grip} | Dano: ${form.damage} | Crítico: ${form.critical} (x${form.multiplier}) | Tipo de Dano: ${form.damageType}${form.range !== '-' ? ` | Alcance: ${form.range}` : ''} | Durabilidade: ${form.durability} CE | Grau: ${form.grade} | Espaços: ${form.spaces}`;
  }
  if (form.category === 'Proteção') {
    return `Defesa: +${form.defense} (Redução de Dano) | Grau: ${form.grade} | Espaços: ${form.spaces}`;
  }
  // Munição ou Geral
  return `${form.description || ''} | Grau: ${form.grade} | Espaços: ${form.spaces}`;
};

// Parse an Item description back into form fields (best-effort)
export const parseItemToForm = (item: Item): ItemFormState => {
  const desc = item.description || '';
  const get = (regex: RegExp, def = '') => {
    const m = desc.match(regex);
    return m ? m[1].trim() : def;
  };

  const damage = get(/Dano:\s*([\dd+\-d]+)/i, '1d4');
  const critical = get(/Crítico:\s*(\d+)/i, '20');
  const multiplier = get(/\(x(\d+)\)/i, '2');
  const damageType = get(/Tipo de Dano:\s*([^|]+)/i, 'Balístico');
  const weaponType = get(/Tipo:\s*([^|]+)/i, 'Corpo a Corpo');
  const proficiency = get(/Proficiência:\s*([^|]+)/i, 'Armas Simples');
  const grip = get(/Empunhadura:\s*([^|]+)/i, 'Leve');
  const range = get(/Alcance:\s*([^|]+)/i, '-');
  const durability = get(/Durabilidade:\s*([\d]+)/i, '5');
  const defense = get(/Defesa:\s*\+?(\d+)/i, '0');
  const spaces = parseInt(get(/Espaços:\s*(\d+)/i, '1'), 10) || 1;
  const grade = get(/Grau:\s*([^|]+)/i, 'Mundana');
  const categoryFromDesc = get(/Categoria:\s*([^|]+)/i, '');

  // Infer category
  let category: ItemCategory = 'Geral';
  if (/Defesa:/i.test(desc)) category = 'Proteção';
  else if (/Dano:/i.test(desc)) category = 'Arma';
  else if (categoryFromDesc) {
    if (/Prote/i.test(categoryFromDesc)) category = 'Proteção';
    else if (/Muni/i.test(categoryFromDesc)) category = 'Munição';
    else if (/Arma/i.test(categoryFromDesc)) category = 'Arma';
  }

  return {
    ...defaultFormState,
    name: item.name || '',
    description: desc.replace(/\s*\|\s*Grau:.*$/i, ''), // basic cleanup
    category,
    grade,
    spaces,
    proficiency,
    weaponType,
    grip,
    damage,
    critical,
    multiplier,
    durability,
    damageType,
    range,
    defense
  };
};

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialForm?: ItemFormState;
  onCancel: () => void;
  onSave: (form: ItemFormState) => void;
}

export const ItemFormModal: React.FC<Props> = ({
  isOpen,
  mode,
  initialForm,
  onCancel,
  onSave
}) => {
  const [form, setForm] = useState<ItemFormState>(initialForm || defaultFormState);
  const [activeCategory, setActiveCategory] = useState<ItemCategory>(initialForm?.category || 'Arma');

  // Sync when initialForm changes
  React.useEffect(() => {
    if (initialForm) {
      setForm(initialForm);
      setActiveCategory(initialForm.category);
    }
  }, [initialForm]);

  const setField = (field: keyof ItemFormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const iconForCat = (cat: ItemCategory) => {
    switch (cat) {
      case 'Arma': return <Sword size={14} />;
      case 'Munição': return <Zap size={14} />;
      case 'Proteção': return <Shield size={14} />;
      default: return <Box size={14} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
          <h3 className="text-lg font-bold text-white">{mode === 'create' ? 'Novo Item' : 'Editar Item'}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors duration-100">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          {(['Arma', 'Munição', 'Proteção', 'Geral'] as ItemCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setField('category', cat); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border-b-2
                ${activeCategory === cat 
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'}
              `}
            >
              {iconForCat(cat)} {cat}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Nome */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome*</label>
            <input 
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              placeholder={activeCategory === 'Arma' ? 'Ex: Katana' : activeCategory === 'Proteção' ? 'Ex: Armadura' : 'Nome do item'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grau*</label>
              <select
                value={form.grade}
                onChange={(e) => setField('grade', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Mundana">Mundana</option>
                <option value="Grau 4">Grau 4</option>
                <option value="Grau 3">Grau 3</option>
                <option value="Grau 2">Grau 2</option>
                <option value="Grau 1">Grau 1</option>
                <option value="Grau Especial">Grau Especial</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Espaços*</label>
              <input 
                type="number"
                value={form.spaces}
                onChange={(e) => setField('spaces', parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                min={1}
              />
            </div>
          </div>

          {activeCategory === 'Arma' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Proficiência</label>
                  <select
                    value={form.proficiency}
                    onChange={(e) => setField('proficiency', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Armas Simples">Armas Simples</option>
                    <option value="Armas Marciais">Armas Marciais</option>
                    <option value="Armas Exóticas">Armas Exóticas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo</label>
                  <select
                    value={form.weaponType}
                    onChange={(e) => setField('weaponType', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Corpo a Corpo">Corpo a Corpo</option>
                    <option value="À Distância">À Distância</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Empunhadura</label>
                  <select
                    value={form.grip}
                    onChange={(e) => setField('grip', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Leve">Leve</option>
                    <option value="Uma Mão">Uma Mão</option>
                    <option value="Duas Mãos">Duas Mãos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dano*</label>
                  <input 
                    type="text"
                    value={form.damage}
                    onChange={(e) => setField('damage', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="1d6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Crítico*</label>
                  <input 
                    type="text"
                    value={form.critical}
                    onChange={(e) => setField('critical', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Multiplicador*</label>
                  <input 
                    type="text"
                    value={form.multiplier}
                    onChange={(e) => setField('multiplier', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Durabilidade*</label>
                  <input 
                    type="text"
                    value={form.durability}
                    onChange={(e) => setField('durability', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    title="Limite de CE antes da arma quebrar"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Dano</label>
                  <select
                    value={form.damageType}
                    onChange={(e) => setField('damageType', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Balístico">Balístico</option>
                    <option value="Corte">Corte</option>
                    <option value="Perfuração">Perfuração</option>
                    <option value="Impacto">Impacto</option>
                    <option value="Energia">Energia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alcance</label>
                <input 
                  type="text"
                  value={form.range}
                  onChange={(e) => setField('range', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ex: 30m ou -"
                />
              </div>
            </>
          )}

          {activeCategory === 'Proteção' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Defesa* (Redução de Dano)</label>
              <input 
                type="text"
                value={form.defense}
                onChange={(e) => setField('defense', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: 5"
              />
            </div>
          )}

          {(activeCategory === 'Munição' || activeCategory === 'Geral') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição</label>
              <textarea 
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-emerald-500 focus:outline-none min-h-[80px]"
                placeholder="Descreva os efeitos e propriedades do item..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 rounded-b-2xl flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors duration-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'create' ? 'Criar Item' : 'Salvar Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const formDefaults = defaultFormState;
