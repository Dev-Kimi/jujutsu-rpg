
import React, { useState } from 'react';
import { Item } from '../types';
import { MUNDANE_WEAPONS, CURSED_TOOL_GRADES } from '../utils/equipmentData';
import { Plus, Trash2, Package, Minus, Sword, Shield, Info, Coins, Hammer, Zap, BookOpen, AlertTriangle, Edit2, X } from 'lucide-react';

interface InventoryListProps {
  items: Item[];
  onAdd: (template?: Partial<Item>) => void;
  onUpdate: (id: string, field: keyof Item, value: any) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
  onOpenLibrary?: () => void;
}

type ItemCategory = 'Arma' | 'Munição' | 'Proteção' | 'Geral';

export const InventoryList: React.FC<InventoryListProps> = ({ items, onAdd, onUpdate, onRemove, readOnly, onOpenLibrary }) => {
  const [activeTab, setActiveTab] = useState<'my-items' | 'catalog'>('my-items');
  const [catalogSection, setCatalogSection] = useState<'weapons' | 'cursed'>('weapons');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const handleQty = (id: string, current: number, delta: number) => {
    onUpdate(id, 'quantity', Math.max(0, current + delta));
  };

  const handleAddToInventory = (name: string, description: string) => {
    onAdd({
      name: name,
      description: description
    });
  };

  if (readOnly) {
     // Simplified Read Only View
     return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[200px] flex flex-col p-4">
             <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Package size={16} /> Inventário
             </h4>
             <div className="space-y-2 overflow-y-auto max-h-[400px]">
                 {items.length === 0 && <span className="text-slate-600 text-xs italic">Vazio.</span>}
                 {items.map(item => (
                     <div key={item.id} className={`bg-slate-950 border ${item.isBroken ? 'border-red-900/50' : 'border-slate-800'} rounded p-2 text-xs flex justify-between`}>
                         <div>
                            <span className={`font-bold ${item.isBroken ? 'text-red-500 line-through' : 'text-slate-200'}`}>{item.name}</span>
                            {item.quantity > 1 && <span className="text-slate-500 ml-2">x{item.quantity}</span>}
                            <div className="text-[10px] text-slate-500">{item.description}</div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
     );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
      
      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-800 bg-slate-950">
         <button 
           onClick={() => setActiveTab('my-items')}
           className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2
             ${activeTab === 'my-items' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'}
           `}
         >
           <Package size={16} /> Inventário
         </button>
         <button 
           onClick={() => setActiveTab('catalog')}
           className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2
             ${activeTab === 'catalog' ? 'border-curse-500 text-curse-400 bg-curse-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'}
           `}
         >
           <BookOpen size={16} /> Catálogo
         </button>
      </div>

      {activeTab === 'my-items' ? (
        <>
          <div className="p-3 border-b border-slate-800 flex justify-end gap-2 bg-slate-900/50">
            {onOpenLibrary && (
              <button 
                onClick={onOpenLibrary}
                className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors duration-100 font-bold"
                title="Abrir biblioteca de itens"
              >
                <BookOpen size={14} /> Biblioteca
              </button>
            )}
            <button 
              onClick={() => onAdd()}
              className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors duration-100 font-bold"
            >
              <Plus size={14} /> Novo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {items.length === 0 && (
              <div className="text-center text-slate-600 text-sm py-12 italic flex flex-col items-center">
                <Package size={32} className="mb-2 opacity-20" />
                Inventário vazio.
                <button onClick={() => setActiveTab('catalog')} className="text-emerald-400 underline mt-2">Ver Catálogo</button>
              </div>
            )}

            {items.map(item => {
              // Parse item data from description
              const isDamageItem = /Dano:\s*\d+d\d+/i.test(item.description);
              const damageMatch = item.description.match(/Dano:\s*(\d+d\d+(?:\+\d+)?)/i);
              const criticalMatch = item.description.match(/Crítico:\s*(\d+)/i);
              const categoryMatch = item.description.match(/Categoria:\s*([^|]+)/i);
              const typeMatch = item.description.match(/Tipo:\s*([^|]+)/i);
              const spacesMatch = item.description.match(/Espaços:\s*(\d+)/i);
              return (
                <div key={item.id} className={`bg-slate-950 border rounded-lg overflow-hidden group animate-in slide-in-from-left-2 duration-300 ${item.isBroken ? 'border-red-900/50 opacity-70' : 'border-slate-800'}`}>

                  {/* Header - Always Visible */}
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-slate-900 rounded border border-slate-800">
                        <button
                          onClick={() => handleQty(item.id, item.quantity, -1)}
                          className="px-2 py-1 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-mono text-white min-w-[20px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQty(item.id, item.quantity, 1)}
                          className="px-2 py-1 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Name and Quick Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold ${item.isBroken ? 'text-red-500 line-through' : 'text-slate-200'}`}>
                          {item.name}
                        </div>

                        {/* Quick Info - Always visible */}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {damageMatch && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Dano: {damageMatch[1]}
                            </span>
                          )}
                          {criticalMatch && (
                            <span className="text-[10px] text-purple-400 font-mono">
                              Crítico: {criticalMatch[1]}
                            </span>
                          )}
                          {spacesMatch && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Espaços: {spacesMatch[1]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingItem(item)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded transition-all flex items-center gap-1 text-xs"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onRemove(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 hover:bg-red-950/30 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full">
           {/* Catalog Sub-tabs */}
           <div className="flex p-2 gap-2 bg-slate-900 border-b border-slate-800">
              <button 
                onClick={() => setCatalogSection('weapons')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all
                   ${catalogSection === 'weapons' 
                      ? 'bg-slate-800 text-white border-slate-600' 
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}
                `}
              >
                Armas Mundanas
              </button>
              <button 
                onClick={() => setCatalogSection('cursed')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all
                   ${catalogSection === 'cursed' 
                      ? 'bg-purple-900/30 text-purple-200 border-purple-500/30' 
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}
                `}
              >
                Ferramentas Amaldiçoadas
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-2 bg-slate-950/50">
             
             {/* WEAPONS LIST */}
             {catalogSection === 'weapons' && (
                <div className="space-y-2 animate-in fade-in duration-300">
                   <div className="text-[10px] text-slate-500 px-2 pb-2 italic text-center">
                     Nota: Não causam dano a maldições sem habilidade de Imbuir.
                   </div>
                   
                   <div className="grid grid-cols-[2fr_1fr_1fr_40px] gap-2 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase">
                      <div>Nome</div>
                      <div className="text-center">Dano</div>
                      <div className="text-center">Crítico</div>
                      <div></div>
                   </div>

                   {MUNDANE_WEAPONS.map(w => (
                      <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2 grid grid-cols-[2fr_1fr_1fr_40px] gap-2 items-center hover:border-slate-600 transition-colors">
                         <div>
                            <div className="text-sm font-bold text-slate-200">{w.name}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                               {w.type === 'Distância' ? <Info size={10}/> : <Sword size={10}/>} {w.type}
                            </div>
                         </div>
                         <div className="text-center font-mono font-bold text-slate-300 text-xs bg-slate-950/50 py-1 rounded">
                            {w.baseDamage}
                         </div>
                         <div className="text-center font-mono text-slate-400 text-xs">
                            {w.critical}
                         </div>
                         <div className="flex justify-end">
                            <button 
                              onClick={() => handleAddToInventory(w.name, `Dano: ${w.baseDamage} | Crítico: ${w.critical} | Tipo: ${w.type}`)}
                              className="p-1.5 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors"
                              title="Adicionar ao Inventário"
                            >
                               <Plus size={16} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}

             {/* CURSED TOOLS LIST */}
             {catalogSection === 'cursed' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                   <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-400 mb-2 flex gap-3 items-start">
                      <Info size={16} className="shrink-0 mt-0.5 text-curse-400"/>
                      <p>
                        <strong className="text-curse-300">Regra de Durabilidade:</strong> O custo indica o limite seguro de CE. Se investir mais CE num ataque (Sobrecarga), a arma quebra após o golpe.
                      </p>
                   </div>

                   {CURSED_TOOL_GRADES.map((grade, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-curse-500/30 transition-colors">
                         <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
                            <h4 className="font-bold text-curse-300 text-sm flex items-center gap-2">
                               <Hammer size={14} /> {grade.grade}
                            </h4>
                            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                               <Coins size={10} /> {grade.price}
                            </span>
                         </div>
                         <div className="p-3 text-xs space-y-2">
                            <div className="flex items-start gap-2">
                               <span className="bg-curse-950/40 text-curse-200 px-1.5 rounded border border-curse-500/20 whitespace-nowrap flex items-center gap-1">
                                  <Zap size={10} /> {grade.durabilityCost}
                               </span>
                               <span className="text-slate-400">{grade.effect}</span>
                            </div>
                            <button 
                               onClick={() => handleAddToInventory(`Ferramenta ${grade.grade}`, `Durabilidade: ${grade.durabilityCost} | Efeito: ${grade.effect} | Valor: ${grade.price}`)}
                               className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-curse-700 text-slate-400 hover:text-white rounded flex items-center justify-center gap-2 transition-colors font-bold uppercase tracking-wider text-[10px]"
                            >
                               <Plus size={12} /> Adicionar Modelo
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}

           </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onUpdate={onUpdate}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

// Edit Item Modal Component
const EditItemModal: React.FC<{
  item: Item;
  onUpdate: (id: string, field: keyof Item, value: any) => void;
  onClose: () => void;
}> = ({ item, onUpdate, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('Arma');
  const [editForm, setEditForm] = useState(() => {
    // Parse existing item data
    const parsed = parseItemFromDescription(item);
    return {
      name: item.name,
      category: parsed.category,
      grade: parsed.grade,
      spaces: parsed.spaces,
      // Weapon fields
      proficiency: parsed.proficiency,
      weaponType: parsed.weaponType,
      grip: parsed.grip,
      damage: parsed.damage,
      critical: parsed.critical,
      multiplier: parsed.multiplier,
      damageType: parsed.damageType,
      range: parsed.range,
      durability: parsed.durability,
      // Armor fields
      defense: parsed.defense,
      // General fields
      description: parsed.description
    };
  });

  // Helper function to parse item data from description
  function parseItemFromDescription(item: Item): any {
    const desc = item.description;
    const gradeMatch = desc.match(/Grau:\s*([^|]+)/i);
    const spacesMatch = desc.match(/Espaços:\s*(\d+)/i);
    const proficiencyMatch = desc.match(/Proficiência:\s*([^|]+)/i);
    const weaponTypeMatch = desc.match(/Tipo de Arma:\s*([^|]+)/i);
    const gripMatch = desc.match(/Empunhadura:\s*([^|]+)/i);
    const damageMatch = desc.match(/Dano:\s*([^|]+)/i);
    const criticalMatch = desc.match(/Crítico:\s*([^|]+)/i);
    const multiplierMatch = desc.match(/Multiplicador:\s*([^|]+)/i);
    const damageTypeMatch = desc.match(/Tipo de Dano:\s*([^|]+)/i);
    const rangeMatch = desc.match(/Alcance:\s*([^|]+)/i);
    const durabilityMatch = desc.match(/Durabilidade:\s*([^|]+)/i);
    const defenseMatch = desc.match(/Defesa:\s*([^|]+)/i);

    // Determine category from description content
    let category: ItemCategory = 'Geral';
    if (damageMatch) category = 'Arma';
    else if (defenseMatch) category = 'Proteção';
    else if (desc.toLowerCase().includes('munição')) category = 'Munição';

    return {
      category,
      grade: gradeMatch ? gradeMatch[1].trim() : 'Mundana',
      spaces: spacesMatch ? parseInt(spacesMatch[1]) : 1,
      proficiency: proficiencyMatch ? proficiencyMatch[1].trim() : 'Armas Simples',
      weaponType: weaponTypeMatch ? weaponTypeMatch[1].trim() : 'Corpo a Corpo',
      grip: gripMatch ? gripMatch[1].trim() : 'Leve',
      damage: damageMatch ? damageMatch[1].trim() : '1d4',
      critical: criticalMatch ? criticalMatch[1].trim() : '20',
      multiplier: multiplierMatch ? multiplierMatch[1].trim() : '2',
      damageType: damageMatch ? damageTypeMatch[1].trim() : 'Balístico',
      range: rangeMatch ? rangeMatch[1].trim() : '-',
      durability: durabilityMatch ? durabilityMatch[1].trim() : '5',
      defense: defenseMatch ? defenseMatch[1].trim() : '0',
      description: desc.split('|')[0]?.trim() || desc
    };
  }

  const getCategoryIcon = (cat: ItemCategory) => {
    switch (cat) {
      case 'Arma': return <Sword size={14} />;
      case 'Munição': return <Zap size={14} />;
      case 'Proteção': return <Shield size={14} />;
      case 'Geral': return <Package size={14} />;
    }
  };

  const handleSave = () => {
    let description = editForm.description;

    // Add structured info based on category
    if (editForm.category === 'Arma') {
      description = `${editForm.description} | Categoria: Arma | Tipo: ${editForm.weaponType} | Empunhadura: ${editForm.grip} | Dano: ${editForm.damage} | Crítico: ${editForm.critical} | Multiplicador: ${editForm.multiplier} | Tipo de Dano: ${editForm.damageType} | Alcance: ${editForm.range} | Durabilidade: ${editForm.durability} CE | Grau: ${editForm.grade} | Espaços: ${editForm.spaces}`;
    } else if (editForm.category === 'Proteção') {
      description = `${editForm.description} | Categoria: Proteção | Defesa: +${editForm.defense} | Grau: ${editForm.grade} | Espaços: ${editForm.spaces}`;
    } else if (editForm.category === 'Munição') {
      description = `${editForm.description} | Categoria: Munição | Grau: ${editForm.grade} | Espaços: ${editForm.spaces}`;
    } else {
      description = `${editForm.description} | Categoria: Geral | Grau: ${editForm.grade} | Espaços: ${editForm.spaces}`;
    }

    onUpdate(item.id, 'name', editForm.name);
    onUpdate(item.id, 'description', description);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
          <h3 className="text-lg font-bold text-white">Editar Item</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors duration-100">
            <X size={20} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          {(['Arma', 'Munição', 'Proteção', 'Geral'] as ItemCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setEditForm(prev => ({ ...prev, category: cat })); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border-b-2
                ${activeCategory === cat
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10'
                  : 'border-transparent text-slate-500 hover:text-slate-300'}
              `}
            >
              {getCategoryIcon(cat)} {cat}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Item</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: Espada Lendária"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grau</label>
              <select
                value={editForm.grade}
                onChange={(e) => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Mundana">Mundana</option>
                <option value="Grau 4">Grau 4</option>
                <option value="Grau 3">Grau 3</option>
                <option value="Grau 2">Grau 2</option>
                <option value="Grau 1">Grau 1</option>
                <option value="Especial">Especial</option>
              </select>
            </div>
          </div>

          {/* Category-specific fields */}
          {activeCategory === 'Arma' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Sword size={16} />
                Propriedades da Arma
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Proficiência</label>
                  <select
                    value={editForm.proficiency}
                    onChange={(e) => setEditForm(prev => ({ ...prev, proficiency: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Armas Simples">Armas Simples</option>
                    <option value="Armas Marciais">Armas Marciais</option>
                    <option value="Armas Exóticas">Armas Exóticas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Arma</label>
                  <select
                    value={editForm.weaponType}
                    onChange={(e) => setEditForm(prev => ({ ...prev, weaponType: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Corpo a Corpo">Corpo a Corpo</option>
                    <option value="À Distância">À Distância</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Empunhadura</label>
                  <select
                    value={editForm.grip}
                    onChange={(e) => setEditForm(prev => ({ ...prev, grip: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Leve">Leve</option>
                    <option value="Uma Mão">Uma Mão</option>
                    <option value="Duas Mãos">Duas Mãos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dano</label>
                  <input
                    type="text"
                    value={editForm.damage}
                    onChange={(e) => setEditForm(prev => ({ ...prev, damage: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 1d8, 2d6+2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Crítico</label>
                  <input
                    type="text"
                    value={editForm.critical}
                    onChange={(e) => setEditForm(prev => ({ ...prev, critical: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 19-20, 20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Multiplicador</label>
                  <select
                    value={editForm.multiplier}
                    onChange={(e) => setEditForm(prev => ({ ...prev, multiplier: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="2">x2</option>
                    <option value="3">x3</option>
                    <option value="4">x4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Dano</label>
                  <select
                    value={editForm.damageType}
                    onChange={(e) => setEditForm(prev => ({ ...prev, damageType: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Balístico">Balístico</option>
                    <option value="Cortante">Cortante</option>
                    <option value="Perfurante">Perfurante</option>
                    <option value="Concussão">Concussão</option>
                    <option value="Energia">Energia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alcance</label>
                  <input
                    type="text"
                    value={editForm.range}
                    onChange={(e) => setEditForm(prev => ({ ...prev, range: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 30m, - (corpo a corpo)"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Durabilidade (CE)</label>
                  <input
                    type="number"
                    value={editForm.durability}
                    onChange={(e) => setEditForm(prev => ({ ...prev, durability: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="5"
                    min="1"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Quantidade máxima de CE que pode ser investida antes da arma quebrar</p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'Proteção' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <Shield size={16} />
                Propriedades de Proteção
              </h4>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Defesa (+)</label>
                <input
                  type="number"
                  value={editForm.defense}
                  onChange={(e) => setEditForm(prev => ({ ...prev, defense: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="0"
                  min="0"
                />
                <p className="text-[9px] text-slate-500 mt-1">Redução de dano físico</p>
              </div>
            </div>
          )}

          {/* Spaces field for all categories */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Espaços Ocupados</label>
            <input
              type="number"
              value={editForm.spaces}
              onChange={(e) => setEditForm(prev => ({ ...prev, spaces: parseInt(e.target.value) || 1 }))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              min="1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-emerald-500 focus:outline-none min-h-[80px]"
              placeholder="Descreva o item, seus efeitos, propriedades especiais, etc..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 rounded-b-2xl flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors duration-100 font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg transition-colors duration-100 font-bold flex items-center gap-2"
          >
            <Edit2 size={16} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
