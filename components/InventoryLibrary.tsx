import React, { useState } from 'react';
import { Item } from '../types';
import { Search, Plus, X, BookOpen, Trash2, Edit2, Package } from 'lucide-react';

interface InventoryLibraryProps {
  userItems: Item[];
  onAddToLibrary: (item: Item) => void;
  onUpdateInLibrary: (id: string, field: keyof Item, value: any) => void;
  onRemoveFromLibrary: (id: string) => void;
  onAddToCharacter: (item: Item) => void;
  onClose: () => void;
}

export const InventoryLibrary: React.FC<InventoryLibraryProps> = ({ 
  userItems, 
  onAddToLibrary, 
  onUpdateInLibrary, 
  onRemoveFromLibrary, 
  onAddToCharacter, 
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleCreateNewItem = () => {
    const newItem: Item = {
      id: Math.random().toString(36).substring(2, 9),
      name: "Novo Item",
      quantity: 1,
      description: "Descreva este item..."
    };
    onAddToLibrary(newItem);
    setEditingItemId(newItem.id);
  };

  const handleAddToCharacter = (item: Item) => {
    // Create a copy with new ID for the character
    const itemCopy: Item = {
      ...item,
      id: Math.random().toString(36).substring(2, 9)
    };
    onAddToCharacter(itemCopy);
  };

  const filteredItems = userItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 w-full sm:max-w-3xl sm:rounded-2xl border-x-0 sm:border border-slate-800 shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 sm:rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-400"/> Biblioteca de Itens
            </h2>
            <p className="text-xs text-slate-400 mt-1">Crie itens globais e adicione em qualquer ficha</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors duration-100 p-2 hover:bg-slate-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Search and Add */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/50 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button 
              onClick={handleCreateNewItem}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors duration-100 font-bold text-sm whitespace-nowrap"
            >
              <Plus size={16} /> Novo Item
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 && !searchTerm && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm mb-2">Nenhum item na biblioteca</p>
              <p className="text-slate-600 text-xs">Clique em "Novo Item" para começar</p>
            </div>
          )}

          {filteredItems.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">Nenhum item encontrado</p>
            </div>
          )}

          <div className="space-y-3">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                
                {editingItemId === item.id ? (
                  // Edit Mode
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Item</label>
                      <input 
                        type="text"
                        value={item.name}
                        onChange={(e) => onUpdateInLibrary(item.id, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        placeholder="Ex: Espada Lendária"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantidade Padrão</label>
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateInLibrary(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição</label>
                      <textarea 
                        value={item.description}
                        onChange={(e) => onUpdateInLibrary(item.id, 'description', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-emerald-500 focus:outline-none min-h-[80px]"
                        placeholder="Descreva o item, seus efeitos, dano, propriedades, etc..."
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                      <button 
                        onClick={() => setEditingItemId(null)}
                        className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded hover:bg-slate-800 transition-colors duration-100"
                      >
                        Concluir
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Excluir "${item.name}" da biblioteca?`)) {
                            onRemoveFromLibrary(item.id);
                            if (editingItemId === item.id) setEditingItemId(null);
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-950/30 transition-colors duration-100"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package size={14} className="text-emerald-400 shrink-0" />
                        <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                      
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setEditingItemId(item.id)}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors duration-100"
                        >
                          <Edit2 size={10} /> Editar
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddToCharacter(item)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors duration-100 shrink-0 flex items-center gap-1"
                      title="Adicionar no inventário atual"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 sm:rounded-b-2xl shrink-0">
          <p className="text-xs text-slate-500 text-center">
            Itens criados aqui ficam disponíveis para todas as suas fichas
          </p>
        </div>

      </div>
    </div>
  );
};
