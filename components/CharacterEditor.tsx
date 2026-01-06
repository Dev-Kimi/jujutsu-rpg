import React from 'react';
import { Character, Origin, Attributes, Skill, CharacterClass } from '../types';
import { User, Dna, BookOpen, Plus, Trash2, Lock } from 'lucide-react';

interface EditorProps {
  char: Character;
  setChar: (c: Character) => void;
  onClose: () => void;
}

export const CharacterEditor: React.FC<EditorProps> = ({ char, setChar, onClose }) => {
  
  const getMaxAttribute = (origin: Origin) => origin === Origin.RestricaoCelestial ? 6 : 5;
  const maxAttrLimit = getMaxAttribute(char.origin);

  const handleChange = (field: keyof Character, value: any) => {
    // If changing origin, clamp attributes if they exceed the new limit
    if (field === 'origin') {
        const newLimit = getMaxAttribute(value as Origin);
        const clampedAttributes = { ...char.attributes };
        
        (Object.keys(clampedAttributes) as Array<keyof Attributes>).forEach(key => {
          if (clampedAttributes[key] > newLimit) {
            clampedAttributes[key] = newLimit;
          }
        });
        
        // Auto-set class if RestricaoCelestial origin selected
        const newClass = (value as Origin) === Origin.RestricaoCelestial ? "Restrição Celestial" : char.characterClass;

        setChar({ 
          ...char, 
          [field]: value,
          characterClass: newClass,
          attributes: clampedAttributes
        });
    } else if (field === 'characterClass') {
       // If class is HR, force Origin to HR (usually implied, but let's keep it flexible or strict based on preference. 
       // The rulebook implies HR is a special class linked to the origin.
       if (value === "Restrição Celestial") {
           setChar({ ...char, characterClass: value, origin: Origin.RestricaoCelestial });
       } else {
           // If moving away from HR class, maybe reset origin if it was HR? 
           // Let's just update class.
           setChar({ ...char, [field]: value });
       }
    } else {
        setChar({ ...char, [field]: value });
    }
  };

  const handleAttrChange = (attr: keyof Attributes, val: number) => {
    const limit = getMaxAttribute(char.origin);
    setChar({
      ...char,
      attributes: {
        ...char.attributes,
        [attr]: Math.min(limit, Math.max(1, val))
      }
    });
  };

  // Skill Management
  const addSkill = () => {
    const newSkill: Skill = {
      id: Math.random().toString(36).substring(2, 9),
      name: "Nova Perícia",
      value: 0
    };
    setChar({
      ...char,
      skills: [...(char.skills || []), newSkill]
    });
  };

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setChar({
      ...char,
      skills: char.skills.map(s => {
        if (s.id !== id) return s;
        // Prevent editing definition of base skills
        if (s.isBase && (field === 'name' || field === 'attribute')) return s;
        return { ...s, [field]: value };
      })
    });
  };

  const removeSkill = (id: string) => {
    setChar({
      ...char,
      skills: char.skills.filter(s => s.id !== id)
    });
  };

  const attributeOptions = Object.keys(char.attributes) as Array<keyof Attributes>;

  // Sort skills so they are easier to find (Alphabetical)
  const sortedSkills = [...(char.skills || [])].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={20} className="text-curse-400"/> Editar Personagem
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Basics */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
              <input 
                type="text" 
                value={char.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-curse-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Classe</label>
                <select 
                  value={char.characterClass}
                  onChange={(e) => handleChange('characterClass', e.target.value as CharacterClass)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:border-curse-500 focus:outline-none"
                >
                  <option value="Combatente">Combatente</option>
                  <option value="Feiticeiro">Feiticeiro</option>
                  <option value="Especialista">Especialista</option>
                  <option value="Restrição Celestial">Restrição Celestial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origem</label>
                <select 
                  value={char.origin}
                  onChange={(e) => handleChange('origin', e.target.value as Origin)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:border-curse-500 focus:outline-none"
                >
                  {Object.values(Origin).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nível (1-20)</label>
                <input 
                  type="number" 
                  min="1" max="20"
                  value={char.level}
                  onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-curse-500 focus:outline-none"
                />
              </div>
          </div>

          {/* Attributes */}
          <div>
            <div className="flex items-center justify-between gap-2 text-curse-300 font-bold mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Dna size={18} /> Atributos
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                Max: {maxAttrLimit}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(char.attributes) as Array<keyof Attributes>).map(attr => (
                <div key={attr} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-300 w-12">{attr}</span>
                  <input 
                    type="range" min="1" max={maxAttrLimit} 
                    value={char.attributes[attr]}
                    onChange={(e) => handleAttrChange(attr, parseInt(e.target.value))}
                    className="flex-1 mx-3 accent-curse-500 h-2 bg-slate-800 rounded-lg"
                  />
                  <input 
                      type="number" 
                      min="1" max={maxAttrLimit}
                      value={char.attributes[attr]}
                      onChange={(e) => handleAttrChange(attr, parseInt(e.target.value) || 1)}
                      className="w-10 bg-slate-950 border border-slate-700 rounded text-center text-sm font-black text-white focus:border-curse-500 focus:outline-none p-1"
                    />
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between text-curse-300 font-bold mb-3 border-b border-slate-800 pb-2">
               <div className="flex items-center gap-2">
                  <BookOpen size={18} /> Perícias
               </div>
               <button 
                  onClick={addSkill}
                  className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-curse-600 text-slate-300 hover:text-white px-2 py-1 rounded transition-colors"
               >
                  <Plus size={14}/> Add
               </button>
            </div>
            
            <div className="space-y-3">
              {(!sortedSkills || sortedSkills.length === 0) && (
                <div className="text-center text-slate-600 text-xs italic py-2">
                  Nenhuma perícia adicionada.
                </div>
              )}
              {sortedSkills.map(skill => (
                 <div 
                   key={skill.id} 
                   className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors
                     ${skill.isBase 
                        ? 'bg-slate-900/80 border-slate-800/50' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'}
                   `}
                 >
                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={skill.name}
                        disabled={skill.isBase}
                        onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                        placeholder="Nome da perícia"
                        className={`flex-1 bg-transparent border-b text-sm focus:outline-none focus:border-curse-500 placeholder:text-slate-700 pb-1
                          ${skill.isBase 
                            ? 'text-slate-500 cursor-not-allowed border-transparent font-medium' 
                            : 'text-slate-200 border-slate-700'}
                        `}
                      />
                      {skill.isBase ? (
                         <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded border border-slate-800 text-slate-600 cursor-help" title="Perícia Base (Fixa)">
                            <Lock size={12} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Base</span>
                         </div>
                      ) : (
                         <button 
                           onClick={() => removeSkill(skill.id)}
                           className="text-slate-600 hover:text-red-400 transition-colors p-1"
                           title="Remover Perícia"
                         >
                           <Trash2 size={16}/>
                         </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <select
                          value={skill.attribute || ""}
                          disabled={skill.isBase}
                          onChange={(e) => updateSkill(skill.id, 'attribute', e.target.value || undefined)}
                          className={`bg-slate-900 border border-slate-700 text-xs rounded p-1.5 focus:outline-none focus:border-curse-500
                            ${skill.isBase ? 'text-slate-500 cursor-not-allowed opacity-70' : 'text-slate-400'}
                          `}
                       >
                          <option value="">- Atributo -</option>
                          {attributeOptions.map(attr => (
                            <option key={attr} value={attr}>{attr}</option>
                          ))}
                       </select>
                       <span className="text-xs text-slate-600 font-bold ml-auto">Bônus</span>
                       <input 
                        type="number" 
                        value={skill.value}
                        onChange={(e) => updateSkill(skill.id, 'value', parseInt(e.target.value) || 0)}
                        className="w-14 bg-slate-900 border border-slate-700 rounded p-1.5 text-center text-sm font-mono text-white focus:border-curse-500 focus:outline-none"
                      />
                    </div>
                 </div>
              ))}
            </div>
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900 sticky bottom-0">
            <button 
              onClick={onClose}
              className="w-full bg-curse-600 hover:bg-curse-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-curse-900/20"
            >
              Salvar Ficha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};