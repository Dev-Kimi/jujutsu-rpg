
import React, { useState } from 'react';
import { Item } from '../types';
import { MUNDANE_WEAPONS, CURSED_TOOL_GRADES, MundaneWeapon } from '../utils/equipmentData';
import { Plus, Trash2, Package, Minus, Sword, Shield, Info, Coins, Hammer, Zap, BookOpen, AlertTriangle, Edit2, X, CheckCircle } from 'lucide-react';

interface InventoryListProps {
  items: Item[];
  onAdd: (template?: Partial<Item>) => void;
  onUpdate: (id: string, field: keyof Item, value: any) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
  onOpenLibrary?: () => void;
  equippedWeapons?: string[];
  onToggleEquip?: (weaponId: string) => void;
}

type ItemCategory = 'Arma' | 'Munição' | 'Proteção' | 'Geral';

// Notification Component
const Notification: React.FC<{
  notification: {id: string, message: string, type: 'success' | 'error'};
  onClose: (id: string) => void;
}> = ({ notification, onClose }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border shadow-lg animate-in slide-in-from-right-2 duration-300 ${
      notification.type === 'success'
        ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
        : 'bg-red-950/90 border-red-800 text-red-200'
    }`}>
      <CheckCircle size={18} className={notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'} />
      <span className="text-sm flex-1">{notification.message}</span>
      <button
        onClick={() => onClose(notification.id)}
        className="text-slate-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Edit Mundane Weapon Modal Component
const EditMundaneWeaponModal: React.FC<{
  weapon: MundaneWeapon | null;
  onSave: (weapon: MundaneWeapon) => void;
  onAdd: (weapon: Omit<MundaneWeapon, 'id'>) => void;
  onDelete: (weaponId: string) => void;
  onClose: () => void;
}> = ({ weapon, onSave, onAdd, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    name: weapon?.name || '',
    baseDamage: weapon?.baseDamage || '1d6',
    critical: weapon?.critical || '20',
    type: weapon?.type || 'Corpo a Corpo' as 'Corpo a Corpo' | 'Distância'
  });

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (weapon) {
      // Update existing weapon
      onSave({
        ...weapon,
        ...formData
      });
    } else {
      // Add new weapon
      onAdd(formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (weapon && weapon.id.startsWith('custom-')) {
      if (confirm(`Remover "${weapon.name}" do catálogo personalizado?`)) {
        onDelete(weapon.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
          <h3 className="text-lg font-bold text-white">
            {weapon ? 'Editar Arma Mundana' : 'Nova Arma Mundana'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors duration-100">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Arma</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              placeholder="Ex: Espada Longa"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'Corpo a Corpo' | 'Distância' }))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="Corpo a Corpo">Corpo a Corpo</option>
              <option value="Distância">Distância</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dano Base</label>
              <input
                type="text"
                value={formData.baseDamage}
                onChange={(e) => setFormData(prev => ({ ...prev, baseDamage: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="1d8"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Crítico</label>
              <input
                type="text"
                value={formData.critical}
                onChange={(e) => setFormData(prev => ({ ...prev, critical: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="20"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 rounded-b-2xl flex justify-between items-center">
          <div>
            {weapon && weapon.id.startsWith('custom-') && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors duration-100"
              >
                <Trash2 size={14} className="inline mr-1" />
                Remover
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors duration-100 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors duration-100 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {weapon ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InventoryList: React.FC<InventoryListProps> = ({ items, onAdd, onUpdate, onRemove, readOnly, onOpenLibrary, equippedWeapons = [], onToggleEquip }) => {
  const [activeTab, setActiveTab] = useState<'my-items' | 'catalog'>('my-items');
  const [catalogSection, setCatalogSection] = useState<'weapons' | 'cursed'>('weapons');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingWeapon, setEditingWeapon] = useState<MundaneWeapon | null>(null);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([]);
  const [customWeapons, setCustomWeapons] = useState<MundaneWeapon[]>(() => {
    // Load custom weapons from localStorage
    const saved = localStorage.getItem('customMundaneWeapons');
    return saved ? JSON.parse(saved) : [];
  });

  const handleQty = (id: string, current: number, delta: number) => {
    onUpdate(id, 'quantity', Math.max(0, current + delta));
  };

  const handleAddToInventory = (name: string, description: string) => {
    onAdd({
      name: name,
      description: description
    });
    showNotification(`"${name}" adicionado ao inventário!`, 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const saveCustomWeapons = (weapons: MundaneWeapon[]) => {
    setCustomWeapons(weapons);
    localStorage.setItem('customMundaneWeapons', JSON.stringify(weapons));
  };

  const updateMundaneWeapon = (weaponId: string, updates: Partial<MundaneWeapon>) => {
    const allWeapons = [...MUNDANE_WEAPONS, ...customWeapons];
    const weaponIndex = allWeapons.findIndex(w => w.id === weaponId);

    if (weaponIndex >= 0) {
      const weapon = allWeapons[weaponIndex];
      const updatedWeapon = { ...weapon, ...updates };

      if (weaponId.startsWith('custom-')) {
        // Update custom weapon
        const customIndex = customWeapons.findIndex(w => w.id === weaponId);
        const newCustomWeapons = [...customWeapons];
        newCustomWeapons[customIndex] = updatedWeapon;
        saveCustomWeapons(newCustomWeapons);
      } else {
        // Convert to custom weapon
        const newCustomWeapon = { ...updatedWeapon, id: `custom-${Date.now()}` };
        saveCustomWeapons([...customWeapons, newCustomWeapon]);
      }

      showNotification(`"${updatedWeapon.name}" atualizada!`, 'success');
    }
  };

  const deleteMundaneWeapon = (weaponId: string) => {
    if (weaponId.startsWith('custom-')) {
      const newCustomWeapons = customWeapons.filter(w => w.id !== weaponId);
      saveCustomWeapons(newCustomWeapons);
      showNotification('Arma removida do catálogo personalizado!', 'success');
    }
  };

  const addMundaneWeapon = (weapon: Omit<MundaneWeapon, 'id'>) => {
    const newWeapon: MundaneWeapon = {
      ...weapon,
      id: `custom-${Date.now()}`
    };
    saveCustomWeapons([...customWeapons, newWeapon]);
    showNotification(`"${weapon.name}" adicionada ao catálogo!`, 'success');
    return newWeapon;
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
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
      
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
              onClick={() => setActiveTab('catalog')}
              className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors duration-100 font-bold"
              title="Ver catálogo de itens disponíveis"
            >
              <Plus size={14} /> Novo Item
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

              // Check if item is a weapon (has damage dice or is categorized as weapon)
              const hasWeaponCategory = categoryMatch && (
                categoryMatch[1].trim() === 'Arma' ||
                categoryMatch[1].trim().toLowerCase() === 'arma'
              );
              const hasWeaponName = item.name.toLowerCase().includes('espada') ||
                                   item.name.toLowerCase().includes('faca') ||
                                   item.name.toLowerCase().includes('bastão') ||
                                   item.name.toLowerCase().includes('karambit') ||
                                   item.name.toLowerCase().includes('lança') ||
                                   item.name.toLowerCase().includes('machado') ||
                                   item.name.toLowerCase().includes('martelo') ||
                                   item.name.toLowerCase().includes('arco') ||
                                   item.name.toLowerCase().includes('besta') ||
                                   item.name.toLowerCase().includes('punhal') ||
                                   item.name.toLowerCase().includes('adaga');
              const hasWeaponDescription = /arma/i.test(item.description) ||
                                          /dano.*\d+d\d+/i.test(item.description) ||
                                          /tipo.*arma/i.test(item.description);

              const isWeapon = damageMatch !== null || hasWeaponCategory || hasWeaponName || hasWeaponDescription;

              const isEquipped = equippedWeapons.includes(item.id);

              return (
                <div key={item.id} className={`bg-slate-950 border rounded-lg overflow-hidden group animate-in slide-in-from-left-2 duration-300 ${item.isBroken ? 'border-red-900/50 opacity-70' : 'border-slate-800'} ${isEquipped ? 'border-orange-500/50 bg-slate-900/80' : ''}`}>

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
                          {isEquipped && (
                            <span className="ml-2 text-xs text-orange-400 font-normal">(Equipada)</span>
                          )}
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

                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        {/* Equip Button - Only for weapons */}
                        {isWeapon && onToggleEquip && item.id && item.isBroken !== true && (
                          <button
                            onClick={() => onToggleEquip(item.id)}
                            className={`p-1.5 rounded transition-all text-xs ${
                              isEquipped
                                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                : 'opacity-0 group-hover:opacity-100 bg-slate-800 text-slate-400 hover:bg-slate-600 hover:text-white'
                            }`}
                            title={isEquipped ? 'Desequipar' : 'Equipar'}
                            disabled={!item.id}
                          >
                            <Sword size={14} />
                          </button>
                        )}

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
                   <div className="flex justify-between items-center px-2 pb-2">
                     <div className="text-[10px] text-slate-500 italic">
                       Nota: Não causam dano a maldições sem habilidade de Imbuir.
                     </div>
                     <button
                       onClick={() => {
                         setEditingWeapon(null);
                         setShowWeaponModal(true);
                       }}
                       className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors duration-100 font-bold"
                       title="Criar nova arma mundana"
                     >
                       <Plus size={14} /> Nova Arma
                     </button>
                   </div>
                   
                   <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-2 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase">
                      <div>Nome</div>
                      <div className="text-center">Dano</div>
                      <div className="text-center">Crítico</div>
                      <div className="text-center">Ações</div>
                   </div>

                   {/* Original Mundane Weapons */}
                   {MUNDANE_WEAPONS.map(w => {
                      const catalogItem: Item = {
                        id: `catalog-${w.id}`,
                        name: w.name,
                        quantity: 1,
                        description: `Dano: ${w.baseDamage} | Crítico: ${w.critical} | Tipo: ${w.type} | Categoria: Arma | Tipo de Arma: ${w.type === 'Distância' ? 'À Distância' : 'Corpo a Corpo'} | Empunhadura: Uma Mão | Multiplicador: 2 | Tipo de Dano: ${w.type === 'Distância' ? 'Perfurante' : 'Cortante'} | Alcance: ${w.type === 'Distância' ? '30m' : '-'} | Durabilidade: 5 CE | Grau: Mundana | Espaços: 1`
                      };

                      return (
                        <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2 grid grid-cols-[2fr_1fr_1fr_80px] gap-2 items-center hover:border-slate-600 transition-colors group">
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
                           <div className="flex justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingWeapon(w);
                                  setShowWeaponModal(true);
                                }}
                                className="p-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors"
                                title="Editar arma no catálogo"
                              >
                                 <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => setEditingItem(catalogItem)}
                                className="p-1.5 bg-slate-800 text-slate-400 hover:bg-slate-600 hover:text-white rounded transition-colors"
                                title="Editar e adicionar ao inventário"
                              >
                                 <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleAddToInventory(w.name, `Dano: ${w.baseDamage} | Crítico: ${w.critical} | Tipo: ${w.type}`)}
                                className="p-1.5 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors"
                                title="Adicionar ao Inventário"
                              >
                                 <Plus size={12} />
                              </button>
                           </div>
                        </div>
                      );
                   })}

                   {/* Custom Mundane Weapons */}
                   {customWeapons.map(w => {
                      const catalogItem: Item = {
                        id: `catalog-${w.id}`,
                        name: w.name,
                        quantity: 1,
                        description: `Dano: ${w.baseDamage} | Crítico: ${w.critical} | Tipo: ${w.type} | Categoria: Arma | Tipo de Arma: ${w.type === 'Distância' ? 'À Distância' : 'Corpo a Corpo'} | Empunhadura: Uma Mão | Multiplicador: 2 | Tipo de Dano: ${w.type === 'Distância' ? 'Perfurante' : 'Cortante'} | Alcance: ${w.type === 'Distância' ? '30m' : '-'} | Durabilidade: 5 CE | Grau: Mundana | Espaços: 1`
                      };

                      return (
                        <div key={w.id} className="bg-slate-950 border border-emerald-800/50 rounded-lg p-2 grid grid-cols-[2fr_1fr_1fr_80px] gap-2 items-center hover:border-emerald-600/70 transition-colors group">
                           <div>
                              <div className="text-sm font-bold text-emerald-200">{w.name}</div>
                              <div className="text-[10px] text-emerald-500/70 flex items-center gap-1">
                                 {w.type === 'Distância' ? <Info size={10}/> : <Sword size={10}/>} {w.type} • Personalizada
                              </div>
                           </div>
                           <div className="text-center font-mono font-bold text-emerald-300 text-xs bg-slate-950/50 py-1 rounded">
                              {w.baseDamage}
                           </div>
                           <div className="text-center font-mono text-emerald-400 text-xs">
                              {w.critical}
                           </div>
                           <div className="flex justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingWeapon(w);
                                  setShowWeaponModal(true);
                                }}
                                className="p-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors"
                                title="Editar arma no catálogo"
                              >
                                 <Edit2 size={10} />
                              </button>
                              <button
                                onClick={() => setEditingItem(catalogItem)}
                                className="p-1.5 bg-slate-800 text-slate-400 hover:bg-slate-600 hover:text-white rounded transition-colors"
                                title="Editar e adicionar ao inventário"
                              >
                                 <Edit2 size={10} />
                              </button>
                              <button
                                onClick={() => handleAddToInventory(w.name, `Dano: ${w.baseDamage} | Crítico: ${w.critical} | Tipo: ${w.type}`)}
                                className="p-1.5 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors"
                                title="Adicionar ao Inventário"
                              >
                                 <Plus size={10} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remover "${w.name}" do catálogo personalizado?`)) {
                                    deleteMundaneWeapon(w.id);
                                  }
                                }}
                                className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors"
                                title="Remover do catálogo"
                              >
                                 <Trash2 size={10} />
                              </button>
                           </div>
                        </div>
                      );
                   })}
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

                   {CURSED_TOOL_GRADES.map((grade, idx) => {
                      // Convert cursed tool to full Item format for editing
                      const cursedItem: Item = {
                        id: `cursed-${idx}`,
                        name: `Ferramenta ${grade.grade}`,
                        quantity: 1,
                        description: `Durabilidade: ${grade.durabilityCost} | Efeito: ${grade.effect} | Valor: ${grade.price} | Categoria: Geral | Grau: ${grade.grade} | Espaços: 1`
                      };

                      return (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-curse-500/30 transition-colors group">
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
                              <div className="flex gap-2">
                                 <button
                                    onClick={() => setEditingItem(cursedItem)}
                                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded flex items-center justify-center gap-2 transition-colors font-bold uppercase tracking-wider text-[10px]"
                                 >
                                    <Edit2 size={10} /> Editar
                                 </button>
                                 <button
                                    onClick={() => handleAddToInventory(`Ferramenta ${grade.grade}`, `Durabilidade: ${grade.durabilityCost} | Efeito: ${grade.effect} | Valor: ${grade.price}`)}
                                    className="flex-1 py-1.5 bg-slate-800 hover:bg-curse-700 text-slate-400 hover:text-white rounded flex items-center justify-center gap-2 transition-colors font-bold uppercase tracking-wider text-[10px]"
                                 >
                                    <Plus size={10} /> Adicionar
                                 </button>
                              </div>
                           </div>
                        </div>
                      );
                   })}
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
          onAdd={onAdd}
          onClose={() => setEditingItem(null)}
          onNotify={showNotification}
        />
      )}

      {/* Edit Mundane Weapon Modal */}
      {showWeaponModal && (
        <EditMundaneWeaponModal
          weapon={editingWeapon}
          onSave={updateMundaneWeapon}
          onAdd={addMundaneWeapon}
          onDelete={deleteMundaneWeapon}
          onClose={() => {
            setShowWeaponModal(false);
            setEditingWeapon(null);
          }}
        />
      )}

      {/* Notifications */}
      <div className="absolute top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
          />
        ))}
      </div>
    </div>
  );
};

// Edit Item Modal Component
const EditItemModal: React.FC<{
  item: Item;
  onUpdate: (id: string, field: keyof Item, value: any) => void;
  onAdd: (item: Partial<Item>) => void;
  onClose: () => void;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}> = ({ item, onUpdate, onAdd, onClose, onNotify }) => {
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('Arma');
  const [editForm, setEditForm] = useState(() => {
    try {
      // Parse existing item data
      const parsed = parseItemFromDescription(item);
      return {
        name: item.name || '',
        category: parsed.category || 'Geral',
        grade: parsed.grade || 'Mundana',
        spaces: parsed.spaces || 1,
        // Weapon fields
        proficiency: parsed.proficiency || 'Luta',
        weaponType: parsed.weaponType || 'Corte',
        grip: parsed.grip || 'Uma Mão',
        damage: parsed.damage || '1d6',
        critical: parsed.critical || '20',
        multiplier: parsed.multiplier || '2',
        damageType: parsed.damageType || 'Corte',
        range: parsed.range || 'Corpo a corpo',
        durability: parsed.durability || '10',
        // Armor fields
        defense: parsed.defense || 1,
        // General fields
        description: parsed.description || ''
      };
    } catch (error) {
      console.error('Error initializing edit form:', error, item);
      return {
        name: item.name || '',
        category: 'Geral',
        grade: 'Mundana',
        spaces: 1,
        proficiency: 'Luta',
        weaponType: 'Corte',
        grip: 'Uma Mão',
        damage: '1d6',
        critical: '20',
        multiplier: '2',
        damageType: 'Corte',
        range: 'Corpo a corpo',
        durability: '10',
        defense: 1,
        description: ''
      };
    }
  });

  const handleSave = () => {
    try {
      let description = editForm.description || '';

      // Add structured info based on category
      if (editForm.category === 'Arma') {
        description = `${editForm.description || ''} | Categoria: Arma | Tipo: ${editForm.weaponType || 'Corte'} | Empunhadura: ${editForm.grip || 'Uma Mão'} | Dano: ${editForm.damage || '1d6'} | Crítico: ${editForm.critical || '20'} | Multiplicador: ${editForm.multiplier || '2'} | Tipo de Dano: ${editForm.damageType || 'Corte'} | Alcance: ${editForm.range || 'Corpo a corpo'} | Durabilidade: ${editForm.durability || '10'} CE | Grau: ${editForm.grade || 'Mundana'} | Espaços: ${editForm.spaces || 1}`;
      } else if (editForm.category === 'Proteção') {
        description = `${editForm.description || ''} | Categoria: Proteção | Defesa: +${editForm.defense || 1} | Grau: ${editForm.grade || 'Mundana'} | Espaços: ${editForm.spaces || 1}`;
      } else if (editForm.category === 'Munição') {
        description = `${editForm.description || ''} | Categoria: Munição | Grau: ${editForm.grade || 'Mundana'} | Espaços: ${editForm.spaces || 1}`;
      } else {
        description = `${editForm.description || ''} | Categoria: Geral | Grau: ${editForm.grade || 'Mundana'} | Espaços: ${editForm.spaces || 1}`;
      }

      // Check if this is a catalog item being edited (should be added to inventory)
      if (item.id.startsWith('catalog-') || item.id.startsWith('cursed-')) {
        // Add as new item to inventory
        const newItem: Partial<Item> = {
          name: editForm.name,
          description: description
        };

        // Add attack skill for weapons
        if (editForm.category === 'Arma' && editForm.attackSkill) {
          newItem.attackSkill = editForm.attackSkill;
        }

        onAdd(newItem);
        onNotify?.(`"${editForm.name}" adicionado ao inventário!`, 'success');
      } else {
        // Update existing inventory item
        onUpdate(item.id, 'name', editForm.name);
        onUpdate(item.id, 'description', description);

        // Update attack skill for weapons
        if (editForm.category === 'Arma') {
          onUpdate(item.id, 'attackSkill', editForm.attackSkill || 'Luta');
        }

        onNotify?.(`"${editForm.name}" atualizado!`, 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Erro ao salvar item. Tente novamente.');
    }
  };

  // Helper function to parse item data from description
  function parseItemFromDescription(item: Item): any {
    try {
      const desc = item.description || '';
      if (!desc) {
        // Return default values for items without description
        return {
          category: 'Geral',
          grade: 'Mundana',
          spaces: 1,
          proficiency: 'Luta',
          weaponType: 'Corte',
          grip: 'Uma Mão',
          damage: '1d6',
          critical: '20',
          multiplier: '2',
          damageType: 'Corte',
          range: 'Corpo a corpo',
          durability: '10',
          defense: 1,
          description: ''
        };
      }
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
    try {
      if (damageMatch) category = 'Arma';
      else if (defenseMatch) category = 'Proteção';
      else if (desc.toLowerCase().includes('munição')) category = 'Munição';
    } catch (error) {
      console.error('Error determining category:', error);
      category = 'Geral';
    }

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
    } catch (error) {
      console.error('Error parsing item from description:', error, item);
      return {
        category: 'Geral',
        grade: 'Mundana',
        spaces: 1,
        proficiency: 'Luta',
        weaponType: 'Corte',
        grip: 'Uma Mão',
        damage: '1d6',
        critical: '20',
        multiplier: '2',
        damageType: 'Corte',
        range: 'Corpo a corpo',
        durability: '10',
        defense: 1,
        description: item.description || ''
      };
    }
  }
  }

  const getCategoryIcon = (cat: ItemCategory) => {
    switch (cat) {
      case 'Arma': return <Sword size={14} />;
      case 'Munição': return <Zap size={14} />;
      case 'Proteção': return <Shield size={14} />;
      case 'Geral': return <Package size={14} />;
    }
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
        <div className="flex border-b border-slate-800 bg-slate-950">
          {(['Arma', 'Proteção', 'Munição', 'Geral'] as ItemCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Item</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: Espada Lendária"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grau</label>
              <select
                value={editForm.grade || 'Mundana'}
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

          {/* Weapon-specific fields */}
          {activeCategory === 'Arma' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Perícia de Ataque</label>
                <select
                  value={editForm.attackSkill || 'Luta'}
                  onChange={(e) => setEditForm(prev => ({ ...prev, attackSkill: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Luta">Luta</option>
                  <option value="Pontaria">Pontaria</option>
                  <option value="Atletismo">Atletismo</option>
                  <option value="Furtividade">Furtividade</option>
                  <option value="Percepção">Percepção</option>
                  <option value="Intimidação">Intimidação</option>
                </select>
                <p className="text-[9px] text-slate-500 mt-1">Perícia usada para rolar ataques com esta arma</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dano</label>
                  <input
                    type="text"
                    value={editForm.damage || '1d6'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, damage: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 1d8, 2d6+2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Crítico</label>
                  <input
                    type="text"
                    value={editForm.critical || '20'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, critical: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 19-20, 18"
                  />
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição</label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none h-20 resize-none"
              placeholder="Descrição detalhada do item..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors duration-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors duration-100"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
                value={editForm.name || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: Espada Lendária"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grau</label>
              <select
                value={editForm.grade || 'Mundana'}
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

          {/* Attack Skill - Only for weapons */}
          {activeCategory === 'Arma' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Perícia de Ataque</label>
              <select
                value={editForm.attackSkill || 'Luta'}
                onChange={(e) => setEditForm(prev => ({ ...prev, attackSkill: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Luta">Luta</option>
                <option value="Pontaria">Pontaria</option>
                <option value="Atletismo">Atletismo</option>
                <option value="Furtividade">Furtividade</option>
                <option value="Percepção">Percepção</option>
                <option value="Intimidação">Intimidação</option>
              </select>
              <p className="text-[9px] text-slate-500 mt-1">Perícia usada para rolar ataques com esta arma</p>
            </div>
          )}

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
                    value={editForm.proficiency || 'Armas Simples'}
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
                    value={editForm.weaponType || 'Corpo a Corpo'}
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
                    value={editForm.grip || 'Leve'}
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
                    value={editForm.damage || '1d6'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, damage: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 1d8, 2d6+2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Crítico</label>
                  <input
                    type="text"
                    value={editForm.critical || '20'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, critical: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 19-20, 20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Multiplicador</label>
                  <select
                    value={editForm.multiplier || '2'}
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
                    value={editForm.damageType || 'Corte'}
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
                    value={editForm.range || 'Corpo a corpo'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, range: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 30m, - (corpo a corpo)"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Durabilidade (CE)</label>
                  <input
                    type="number"
                    value={editForm.durability || 10}
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
                  value={editForm.defense || 1}
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
              value={editForm.spaces || 1}
              onChange={(e) => setEditForm(prev => ({ ...prev, spaces: parseInt(e.target.value) || 1 }))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              min="1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição</label>
            <textarea
              value={editForm.description || ''}
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
