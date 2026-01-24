import React, { useState, useEffect } from 'react';
import { Ability } from '../types';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Zap,
  Search,
  Play,
  CheckCircle,
  Pause,
} from 'lucide-react';
import { parseAbilityCost } from '../utils/calculations';

interface AccordionListProps {
  title: string;
  items: Ability[];
  onAdd: (category?: string) => void;
  onUpdate: (id: string, field: keyof Ability, value: any) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
  placeholderName?: string;
  placeholderCost?: string;
  categories?: string[];
  enableTabs?: boolean;
  onUse?: (cost: { pe: number; ce: number }, name: string) => boolean;
  onUseWithId?: (
    cost: { pe: number; ce: number },
    name: string,
    id: string
  ) => boolean;
  activeBuffs?: Ability[];
  llLimit?: number;
  externalRctView?: 'padrao' | 'rct';
}

export const AccordionList: React.FC<AccordionListProps> = ({
  title,
  items,
  onAdd,
  onUpdate,
  onRemove,
  readOnly = false,
  placeholderName = 'Nome da Habilidade',
  placeholderCost = 'Custo',
  categories,
  enableTabs = true,
  onUse,
  onUseWithId,
  activeBuffs = [],
  llLimit,
  externalRctView,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(
    categories ? categories[0] : 'Todos'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [variableInputs, setVariableInputs] = useState<
    Record<string, { pe: number; ce: number }>
  >({});
  const [usingId, setUsingId] = useState<string | null>(null);
  const [rctView, setRctView] = useState<'padrao' | 'rct'>('padrao');

  useEffect(() => {
    if (externalRctView) {
      setRctView(externalRctView);
    }
  }, [externalRctView]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleUseClick = (e: React.MouseEvent, item: Ability) => {
    e.stopPropagation();

    // Prefer the ID version if available
    const useFunc = onUseWithId
      ? (cost: { pe: number; ce: number }, name: string) =>
          onUseWithId(cost, name, item.id)
      : onUse;

    if (!useFunc) return;

    const parsed = parseAbilityCost(item.cost);

    if (parsed.isVariable) {
      if (usingId === item.id) {
        setUsingId(null);
      } else {
        setUsingId(item.id);
        setVariableInputs((prev) => ({
          ...prev,
          [item.id]: { pe: parsed.pe, ce: parsed.ce },
        }));
      }
    } else {
      useFunc({ pe: parsed.pe, ce: parsed.ce }, item.name);
    }
  };

  const confirmVariableUse = (item: Ability) => {
    const useFunc = onUseWithId
      ? (cost: { pe: number; ce: number }, name: string) =>
          onUseWithId(cost, name, item.id)
      : onUse;

    if (!useFunc) return;
    const inputs = variableInputs[item.id] || { pe: 0, ce: 0 };
    const success = useFunc(inputs, item.name);
    if (success) {
      setUsingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    let matchesCategory = true;
    if (categories && enableTabs) {
      matchesCategory = (item.category || categories[0]) === activeCategory;
    }
    const isRCT =
      (item.subCategory && item.subCategory.toLowerCase() === 'energia reversa') ||
      /energia\s+reversa/i.test(item.name || '') ||
      /energia\s+reversa/i.test(item.description || '');
    const matchesToggle = rctView === 'rct' ? isRCT : !isRCT;
    return matchesSearch && matchesCategory && matchesToggle;
  });

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <h3 className="font-bold text-slate-300 uppercase tracking-wider text-sm flex items-center gap-2">
          <Zap size={16} className="text-curse-400" /> {title}
        </h3>
        <button
          onClick={() => onAdd(categories ? activeCategory : undefined)}
          className="flex items-center gap-1 text-xs bg-curse-600 hover:bg-curse-500 text-white px-3 py-1.5 rounded transition-colors font-bold"
        >
          <Plus size={14} /> Nova
        </button>
      </div>

      {categories && enableTabs && (
        <div className="flex border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors
                ${
                  activeCategory === cat
                    ? 'border-curse-500 text-white bg-slate-800/50'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <div className="border-b border-slate-800 bg-slate-950/30" />

      {/* Search Bar */}
      <div className="p-2 border-b border-slate-800 bg-slate-900">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={14}
          />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-300 focus:outline-none focus:border-curse-500 transition-colors placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredItems.length === 0 && (
          <div className="text-center text-slate-600 text-sm py-8 italic flex flex-col items-center gap-2">
            <span>Nenhum item encontrado.</span>
            {categories && enableTabs && (
              <button
                onClick={() => onAdd(activeCategory)}
                className="text-curse-400 hover:text-curse-300 text-xs underline"
              >
                Adicionar em {activeCategory}
              </button>
            )}
          </div>
        )}

        {filteredItems.map((item) => {
          const isActive = activeBuffs.some((b) => b.id === item.id);

          return (
            <div
              key={item.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                isActive
                  ? 'bg-curse-950/20 border-curse-500/50'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              {/* Header / Summary */}
              <div className="flex items-center gap-2 p-3 hover:bg-slate-900/50 transition-colors relative">
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="text-slate-500 hover:text-curse-400 transition-transform duration-200"
                >
                  {expandedId === item.id ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.name}
                    readOnly={readOnly}
                    onChange={(e) => {
                      if (readOnly) return;
                      onUpdate(item.id, 'name', e.target.value);
                    }}
                    placeholder={placeholderName}
                    className={`w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-slate-600 p-0 truncate ${
                      isActive ? 'text-curse-300' : 'text-slate-200'
                    }`}
                  />
                  {!enableTabs && item.category && (
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-0.5">
                      {item.category}
                    </div>
                  )}
                </div>

                {/* Cost Display / Edit */}
                <input
                  type="text"
                  value={item.cost}
                  readOnly={readOnly}
                  onChange={(e) => {
                    if (readOnly) return;
                    onUpdate(item.id, 'cost', e.target.value);
                  }}
                  placeholder={placeholderCost}
                  className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-right text-curse-300 placeholder:text-slate-700 focus:border-curse-500 focus:outline-none"
                />

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {(onUse || onUseWithId) &&
                    item.cost &&
                    !item.cost.toLowerCase().includes('passivo') && (
                      <button
                        onClick={(e) => handleUseClick(e, item)}
                        className={`p-1.5 rounded-lg transition-colors 
                             ${
                               isActive
                                 ? 'bg-curse-600 text-white animate-pulse'
                                 : usingId === item.id
                                 ? 'bg-emerald-600 text-white'
                                 : 'bg-slate-800 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300'
                             }
                          `}
                        title={
                          isActive
                            ? 'Desativar (Na fila)'
                            : usingId === item.id
                            ? 'Cancelar Uso'
                            : 'Usar Habilidade'
                        }
                      >
                        {isActive ? (
                          <Pause size={14} />
                        ) : (
                          <Play
                            size={14}
                            className={usingId === item.id ? '' : 'ml-0.5'}
                          />
                        )}
                      </button>
                    )}
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-slate-600 hover:text-red-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Variable Cost Input Area */}
              {usingId === item.id && (
                <div className="bg-slate-900 p-3 border-t border-b border-slate-800 animate-in slide-in-from-top-2">
                  <div className="text-xs text-emerald-400 font-bold uppercase mb-2">
                    Definir Custo Variável
                  </div>
                  <div className="flex gap-4 items-end">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">
                        Gastar PE
                      </label>
                      {/x\s*pe/i.test(item.cost) ? (
                        <input
                          type="number"
                          min="0"
                          value={variableInputs[item.id]?.pe || 0}
                          onChange={(e) =>
                            setVariableInputs((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                pe: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-20 bg-slate-950 border border-slate-700 rounded p-1 text-center font-mono text-white focus:border-emerald-500 outline-none"
                        />
                      ) : (
                        <span className="w-20 inline-block text-center font-mono text-slate-300 bg-slate-800 border border-slate-700 rounded px-2 py-1">
                          {parseAbilityCost(item.cost).pe}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">
                        Gastar CE
                      </label>
                      {/x\s*ce/i.test(item.cost) && typeof llLimit === 'number' ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={llLimit}
                            step={1}
                            value={variableInputs[item.id]?.ce ?? 0}
                            onChange={(e) =>
                              setVariableInputs((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  ce: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="flex-1 h-2 bg-slate-800 rounded-lg accent-curse-500"
                          />
                          <span className="w-16 text-center font-mono text-white bg-slate-800 border border-slate-700 rounded px-2 py-1">
                            {variableInputs[item.id]?.ce ?? 0}
                          </span>
                        </div>
                      ) : (
                        <span className="w-20 inline-block text-center font-mono text-slate-300 bg-slate-800 border border-slate-700 rounded px-2 py-1">
                          {parseAbilityCost(item.cost).ce}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => confirmVariableUse(item)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded flex items-center gap-2 h-[30px]"
                    >
                      <CheckCircle size={14} /> Confirmar
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded Content */}
              {expandedId === item.id && (
                <div className="p-3 pt-0 border-t border-slate-800/50 bg-slate-900/30 animate-in slide-in-from-top-1">
                  {categories && (
                    <div className="flex justify-end mb-2 pt-2">
                      <select
                        value={item.category || categories[0]}
                        disabled={readOnly}
                        onChange={(e) => {
                          if (readOnly) return;
                          onUpdate(item.id, 'category', e.target.value);
                        }}
                        className={`bg-slate-950 text-[10px] uppercase font-bold border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-curse-500 ${
                          readOnly
                            ? 'text-slate-600 opacity-70 cursor-not-allowed'
                            : 'text-slate-500'
                        }`}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <textarea
                    value={item.description}
                    readOnly={readOnly}
                    onChange={(e) => {
                      if (readOnly) return;
                      onUpdate(item.id, 'description', e.target.value);
                    }}
                    placeholder="Descrição..."
                    className={`w-full bg-transparent text-xs focus:outline-none resize-none min-h-[80px] leading-relaxed placeholder:text-slate-700 ${
                      readOnly ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
