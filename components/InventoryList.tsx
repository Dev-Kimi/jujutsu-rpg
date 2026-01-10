
import React, { useState } from 'react';
import { Item } from '../types';
import { MUNDANE_WEAPONS, CURSED_TOOL_GRADES } from '../utils/equipmentData';
import { Plus, Trash2, Package, Minus, Sword, Shield, Info, Coins, Hammer, Zap, BookOpen, AlertTriangle } from 'lucide-react';

interface InventoryListProps {
  items: Item[];
  onAdd: (template?: Partial<Item>) => void;
  onUpdate: (id: string, field: keyof Item, value: any) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
  onOpenLibrary?: () => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({ items, onAdd, onUpdate, onRemove, readOnly, onOpenLibrary }) => {
  const [activeTab, setActiveTab] = useState<'my-items' | 'catalog'>('my-items');
  const [catalogSection, setCatalogSection] = useState<'weapons' | 'cursed'>('weapons');

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
                  <div className="p-2 flex items-center gap-3">
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

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <input 
                        type="text"
                        value={item.name}
                        onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
                        className={`bg-transparent border-none p-0 text-sm font-bold w-full focus:ring-0 ${item.isBroken ? 'text-red-500 line-through' : 'text-slate-200'}`}
                        placeholder="Nome do Item"
                      />
                      
                      {/* Quick Info - Compact View */}
                      {isDamageItem && (
                        <div className="flex items-center gap-2 mt-0.5">
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
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 hover:bg-red-950/30 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Expanded Details Section */}
                  <div className="px-2 pb-2 space-y-2 border-t border-slate-800/50 pt-2">
                    {/* Parsed Info Display */}
                    {(categoryMatch || typeMatch || spacesMatch) && (
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        {categoryMatch && (
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            Categoria: {categoryMatch[1].trim()}
                          </span>
                        )}
                        {typeMatch && (
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            Tipo: {typeMatch[1].trim()}
                          </span>
                        )}
                        {spacesMatch && (
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            Espaços: {spacesMatch[1]}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Full Description */}
                    <textarea 
                      value={item.description}
                      onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none min-h-[60px] w-full resize-y"
                      placeholder="Descrição (opcional)..."
                    />

                    {/* Broken Toggle (Only if weapon pattern detected) */}
                    {isDamageItem && (
                      <button 
                        onClick={() => onUpdate(item.id, 'isBroken', !item.isBroken)}
                        className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded border transition-colors w-full justify-center ${
                          item.isBroken 
                            ? 'bg-red-950/30 text-red-400 border-red-900 hover:bg-red-950/50' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Hammer size={12} />
                        {item.isBroken ? 'QUEBRADA - Clique para Reparar' : 'Marcar como Quebrada'}
                      </button>
                    )}
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
    </div>
  );
};
