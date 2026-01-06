import React, { useState } from 'react';
import { Technique, DieType } from '../types';
import { TECHNIQUE_TEMPLATES } from '../utils/templates';
import { Zap, Plus, Trash2, ChevronDown, ChevronRight, Wand2, Flame, Droplets, Wind, Activity } from 'lucide-react';

interface TechniqueManagerProps {
  techniques: Technique[];
  onAdd: (technique: Technique) => void;
  onUpdate: (id: string, field: keyof Technique, value: any) => void;
  onRemove: (id: string) => void;
}

export const TechniqueManager: React.FC<TechniqueManagerProps> = ({ techniques, onAdd, onUpdate, onRemove }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddFromTemplate = (template: Partial<Technique>) => {
    const newTechnique: Technique = {
      id: Math.random().toString(36).substring(2, 9),
      name: template.name || "Nova Técnica",
      category: "Inata",
      cost: template.cost || "",
      description: template.description || "",
      damageDie: template.damageDie || DieType.d8,
      element: template.element || "Energia",
      range: template.range || "Curto"
    };
    onAdd(newTechnique);
    setShowTemplates(false);
    setExpandedId(newTechnique.id); // Auto expand
  };

  const handleCreateEmpty = () => {
    const newTechnique: Technique = {
      id: Math.random().toString(36).substring(2, 9),
      name: "Nova Técnica Inata",
      category: "Inata",
      cost: "",
      description: "",
      damageDie: DieType.d8,
      element: "Neutro",
      range: ""
    };
    onAdd(newTechnique);
    setExpandedId(newTechnique.id);
  };

  const getElementIcon = (element: string) => {
    const lower = element.toLowerCase();
    if (lower.includes('fogo')) return <Flame size={14} className="text-orange-500" />;
    if (lower.includes('água') || lower.includes('sangue')) return <Droplets size={14} className="text-blue-500" />;
    if (lower.includes('eletricidade') || lower.includes('raio')) return <Zap size={14} className="text-yellow-400" />;
    if (lower.includes('som') || lower.includes('vento')) return <Wind size={14} className="text-slate-400" />;
    return <Activity size={14} className="text-curse-400" />;
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[400px] flex flex-col relative">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <h3 className="font-bold text-slate-300 uppercase tracking-wider text-sm flex items-center gap-2">
           <Wand2 size={16} className="text-curse-400" /> Técnicas Inatas
        </h3>
        <button 
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1 text-xs bg-curse-600 hover:bg-curse-500 text-white px-3 py-1.5 rounded transition-colors font-bold"
        >
          <Plus size={14} /> Nova Técnica
        </button>
      </div>

      {/* Template Selector Modal/Overlay */}
      {showTemplates && (
        <div className="absolute inset-0 z-10 bg-slate-950/95 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-bold">Escolha um Modelo</h4>
            <button onClick={() => setShowTemplates(false)} className="text-slate-500 hover:text-white">Fechar</button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={handleCreateEmpty}
              className="p-3 rounded-lg border border-dashed border-slate-700 hover:border-curse-500 text-slate-400 hover:text-white text-sm font-bold transition-colors text-left"
            >
              + Criar em Branco
            </button>
            
            {TECHNIQUE_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFromTemplate(tpl)}
                className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-left hover:bg-slate-800 transition-colors group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-curse-300 group-hover:text-curse-100">{tpl.name}</span>
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                     d{tpl.damageDie}
                  </span>
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">{tpl.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {techniques.length === 0 && !showTemplates && (
          <div className="text-center text-slate-600 text-sm py-10 italic">
            Nenhuma técnica inata criada.
          </div>
        )}

        {techniques.map(tech => (
          <div key={tech.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden transition-all">
            {/* Header Summary */}
            <div 
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-900/50 transition-colors"
              onClick={() => toggleExpand(tech.id)}
            >
              <div className="text-slate-500 hover:text-curse-400 transition-transform duration-200">
                {expandedId === tech.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 text-sm">{tech.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      {getElementIcon(tech.element)} {tech.element}
                    </span>
                    <span className="text-xs font-mono font-bold text-curse-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      d{tech.damageDie}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Body */}
            {expandedId === tech.id && (
              <div className="p-3 border-t border-slate-800 bg-slate-900/30 space-y-3 animate-in slide-in-from-top-2">
                
                {/* Name & Element */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome</label>
                    <input 
                      type="text"
                      value={tech.name}
                      onChange={(e) => onUpdate(tech.id, 'name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Elemento/Tipo</label>
                    <input 
                      type="text"
                      value={tech.element}
                      onChange={(e) => onUpdate(tech.id, 'element', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mult. Dano</label>
                    <select 
                      value={tech.damageDie}
                      onChange={(e) => onUpdate(tech.id, 'damageDie', parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    >
                      <option value={4}>d4</option>
                      <option value={6}>d6</option>
                      <option value={8}>d8</option>
                      <option value={10}>d10</option>
                      <option value={12}>d12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custo</label>
                    <input 
                      type="text"
                      value={tech.cost}
                      onChange={(e) => onUpdate(tech.id, 'cost', e.target.value)}
                      placeholder="Ex: 5 CE"
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    />
                  </div>
                   <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alcance</label>
                    <input 
                      type="text"
                      value={tech.range}
                      onChange={(e) => onUpdate(tech.id, 'range', e.target.value)}
                      placeholder="Ex: 9m"
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição e Efeitos</label>
                  <textarea 
                    value={tech.description}
                    onChange={(e) => onUpdate(tech.id, 'description', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-curse-500 focus:outline-none min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => onRemove(tech.id)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 size={12} /> Excluir Técnica
                  </button>
                </div>

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};