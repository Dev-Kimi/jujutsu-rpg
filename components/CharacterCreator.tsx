import React, { useState, useEffect } from 'react';
import { Character, Origin, CharacterClass, Attributes, DEFAULT_SKILLS } from '../types';
import { ChevronRight, ChevronLeft, Dna, Shield, Sparkles, User, Sword, Brain, Activity, Wand2, Hammer } from 'lucide-react';

interface CharacterCreatorProps {
  onFinish: (char: Character) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 0, title: "Conceito", icon: User },
  { id: 1, title: "Atributos", icon: Dna },
  { id: 2, title: "Identidade", icon: Sparkles },
];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onFinish, onCancel }) => {
  const [step, setStep] = useState(0);
  
  // Form State
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [origin, setOrigin] = useState<Origin>(Origin.Inato);
  const [characterClass, setCharacterClass] = useState<CharacterClass>("Combatente");
  const [innateTechniqueName, setInnateTechniqueName] = useState<string>("");

  // Attribute State (Default all 1, 4 points to spend)
  // Logic: Base 1. Max 3. Min 0. Total Pool = 9 (5 attrs * 1 base + 4 free).
  const [attributes, setAttributes] = useState<Attributes>({
    FOR: 1, AGI: 1, VIG: 1, INT: 1, PRE: 1
  });

  const totalPoints = 9;
  const currentTotal = Object.values(attributes).reduce((a, b) => a + b, 0);
  const remainingPoints = totalPoints - currentTotal;

  const handleAttrChange = (key: keyof Attributes, delta: number) => {
    const currentVal = attributes[key];
    const newVal = currentVal + delta;
    
    // Constraints: Min 0, Max 3 (Initial limit)
    if (newVal < 0 || newVal > 3) return;
    
    // Check points pool
    if (delta > 0 && remainingPoints <= 0) return;

    setAttributes(prev => ({ ...prev, [key]: newVal }));
  };

  const handleFinish = () => {
    if (!name.trim()) {
      alert("Por favor, dê um nome ao seu personagem.");
      return;
    }
    if (remainingPoints > 0) {
      if(!confirm(`Você ainda tem ${remainingPoints} pontos de atributo não gastos. Deseja continuar mesmo assim?`)) return;
    }

    const newChar: Character = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      imageUrl,
      level: 1,
      origin,
      characterClass,
      attributes,
      skills: JSON.parse(JSON.stringify(DEFAULT_SKILLS)),
      abilities: [],
      techniques: [],
      inventory: [],
      equippedWeapons: [],
      aptitudes: {}, // Initialize empty aptitudes
      innateTechnique: innateTechniqueName ? { name: innateTechniqueName } : undefined
    };
    onFinish(newChar);
  };

  // --- SVG PENTAGON LOGIC ---
  const size = 200;
  const center = size / 2;
  const radius = 80;
  // Order: AGI (Top), INT (Right Top), VIG (Right Bot), PRE (Left Bot), FOR (Left Top)
  // Angles adjusted to match the visual reference (AGI at top)
  const statsOrder: (keyof Attributes)[] = ['AGI', 'INT', 'VIG', 'PRE', 'FOR'];
  const angles = [-90, -18, 54, 126, 198]; 

  const getPoint = (value: number, index: number, maxVal = 5) => {
    const r = (value / maxVal) * radius;
    const angleRad = (angles[index] * Math.PI) / 180;
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad)
    };
  };

  // Generate polygon points string
  const polyPoints = statsOrder.map((key, i) => {
    const { x, y } = getPoint(attributes[key], i, 5); // Scale visual to max 5 for aesthetics
    return `${x},${y}`;
  }).join(' ');

  // Generate background webs (levels 1, 2, 3, 4, 5)
  const webs = [1, 2, 3, 4, 5].map(level => {
    return statsOrder.map((_, i) => {
      const { x, y } = getPoint(level, i, 5);
      return `${x},${y}`;
    }).join(' ');
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col overflow-hidden relative">
      {/* Background FX */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-curse-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header / Steps */}
      <header className="p-6 flex justify-between items-center relative z-10 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md">
        <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
           <User className="text-curse-400" /> Criação de Agente
        </h1>
        <div className="flex gap-2">
          {STEPS.map((s) => (
             <div 
               key={s.id}
               className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                  ${step === s.id ? 'bg-curse-600 text-white' : step > s.id ? 'bg-slate-800 text-emerald-400' : 'text-slate-600'}
               `}
             >
                <s.icon size={12} /> {s.title}
             </div>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-4xl bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl min-h-[500px] flex flex-col">
          
          {/* STEP 0: CONCEPT */}
          {step === 0 && (
            <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-3xl font-black text-white mb-2">Defina seu Caminho</h2>
               <p className="text-slate-400 mb-8 max-w-lg">Escolha a origem dos seus poderes e como você os utiliza em combate.</p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Class Selection */}
                  <div className="space-y-4">
                     <label className="text-xs font-bold text-curse-400 uppercase tracking-widest">Classe</label>
                     <div className="grid grid-cols-1 gap-2">
                        {(["Combatente", "Feiticeiro", "Especialista"] as CharacterClass[]).map(c => (
                          <button
                            key={c}
                            onClick={() => setCharacterClass(c)}
                            className={`p-4 rounded-xl border text-left transition-all flex flex-col items-start gap-3
                              ${characterClass === c
                                ? 'bg-curse-950/40 border-curse-500 shadow-[0_0_20px_rgba(124,58,237,0.2)]'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'}
                            `}
                          >
                             <div className="flex items-center gap-3 w-full">
                               <div className={`p-3 rounded-full ${characterClass === c ? 'bg-curse-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
                                  {c === 'Combatente' && <Sword size={20} />}
                                  {c === 'Feiticeiro' && <Wand2 size={20} />}
                                  {c === 'Especialista' && <Brain size={20} />}
                               </div>
                               <div className="flex-1">
                                  <div className={`font-bold text-lg ${characterClass === c ? 'text-white' : 'text-slate-400'}`}>{c}</div>
                                  <div className="text-xs text-slate-500">
                                    {c === 'Combatente' && 'Mestre do combate físico, usa energia como combustível corporal'}
                                    {c === 'Feiticeiro' && 'Focado no controle refinado e aplicação eficiente de Técnicas Inatas'}
                                    {c === 'Especialista' && 'Estrategista que controla o fluxo do combate e auxilia aliados'}
                                  </div>
                               </div>
                             </div>
                             <div className="text-[10px] text-slate-600 leading-tight">
                               {c === 'Combatente' && 'Especialista em combate corpo-a-corpo, usando reforço corporal e técnicas físicas para dominar o campo de batalha.'}
                               {c === 'Feiticeiro' && 'Dominam o controle preciso da Energia Amaldiçoada, desenvolvendo técnicas complexas e barreiras defensivas.'}
                               {c === 'Especialista' && 'Controlam o ritmo do combate através de técnicas utilitárias, apoio aos aliados e manipulação ambiental.'}
                             </div>
                          </button>
                        ))}
                     </div>
                  </div>

                  {/* Origin Selection */}
                  <div className="space-y-4">
                     <label className="text-xs font-bold text-curse-400 uppercase tracking-widest">Origem</label>
                     <div className="grid grid-cols-2 gap-2">
                        {Object.values(Origin).map(o => (
                           <button
                             key={o}
                             onClick={() => {
                                setOrigin(o);
                                if (o === Origin.RestricaoCelestial) setCharacterClass("Restrição Celestial");
                             }}
                             className={`p-3 rounded-xl border text-left transition-all text-sm font-bold
                               ${origin === o 
                                 ? 'bg-slate-100 text-slate-900 border-white' 
                                 : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}
                             `}
                           >
                              {o}
                           </button>
                        ))}
                     </div>
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-400">
                        {origin === Origin.Inato && "Nascido com aptidão natural para o oculto."}
                        {origin === Origin.Herdado && "Herdeiro de uma técnica de linhagem antiga."}
                        {origin === Origin.Hibrido && "Uma anomalia, misturando sangue humano e maldição."}
                        {origin === Origin.RestricaoCelestial && "Abdicou da energia em troca de proeza física absoluta."}
                     </div>
                  </div>

                  {/* Innate Technique Selection */}
                  <div className="space-y-4 md:col-span-2">
                     <label className="text-xs font-bold text-curse-400 uppercase tracking-widest">Técnica Inata (Opcional)</label>
                     <select
                        value={innateTechniqueName}
                        onChange={(e) => setInnateTechniqueName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-curse-500 appearance-none"
                     >
                        <option value="">Nenhuma / Customizada</option>
                        <option value="Projeção de Feitiçaria">Projeção de Feitiçaria</option>
                     </select>
                     {innateTechniqueName === "Projeção de Feitiçaria" && (
                        <div className="bg-curse-900/20 border border-curse-500/30 p-4 rounded-xl text-sm text-curse-200">
                           <strong className="block text-curse-400 mb-1">Projeção de Feitiçaria</strong>
                           Divide 1 segundo em 24 quadros. Permite movimento extremamente veloz e aprisionamento de inimigos em quadros de animação 2D.
                           <ul className="list-disc list-inside mt-2 opacity-80 text-xs space-y-1">
                              <li>Ganha stacks de velocidade ao seguir a regra dos 24fps.</li>
                              <li>Pode congelar inimigos que falhem em seguir o ritmo.</li>
                           </ul>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* STEP 1: ATTRIBUTES */}
          {step === 1 && (
            <div className="flex-1 flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
               {/* Left Controls */}
               <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-3xl font-black text-white">Atributos</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Distribua seus 4 pontos. Você começa com 1 em tudo.
                      Pode reduzir para 0 para ganhar +1 ponto. Max inicial 3.
                    </p>
                  </div>

                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                     <span className="text-sm font-bold uppercase text-slate-500">Pontos Restantes</span>
                     <span className={`text-3xl font-black ${remainingPoints > 0 ? 'text-curse-400' : remainingPoints < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {remainingPoints}
                     </span>
                  </div>

                  <div className="space-y-2">
                     {statsOrder.map(key => (
                        <div key={key} className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                           <div className="w-12 font-bold text-slate-400">{key}</div>
                           <div className="flex-1 flex items-center gap-2">
                              <button 
                                onClick={() => handleAttrChange(key, -1)}
                                disabled={attributes[key] <= 0}
                                className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 flex items-center justify-center disabled:opacity-30"
                              >
                                -
                              </button>
                              
                              <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-curse-500 transition-all duration-300"
                                   style={{ width: `${(attributes[key] / 3) * 100}%` }}
                                 />
                              </div>

                              <button 
                                onClick={() => handleAttrChange(key, 1)}
                                disabled={attributes[key] >= 3 || remainingPoints <= 0}
                                className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center disabled:opacity-30"
                              >
                                +
                              </button>
                           </div>
                           <div className="w-8 text-center font-bold text-xl text-white">{attributes[key]}</div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Right Pentagon */}
               <div className="flex-1 flex items-center justify-center relative">
                  <div className="relative w-[300px] h-[300px]">
                     <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                        {/* Background Webs */}
                        {webs.map((points, i) => (
                           <polygon 
                             key={i} 
                             points={points} 
                             fill="none" 
                             stroke="#334155" 
                             strokeWidth="1" 
                             opacity={0.3}
                           />
                        ))}
                        {/* Axis Lines */}
                        {angles.map((angle, i) => {
                           const rad = (angle * Math.PI) / 180;
                           const x = center + radius * Math.cos(rad);
                           const y = center + radius * Math.sin(rad);
                           return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#334155" strokeWidth="1" opacity={0.5} />;
                        })}
                        
                        {/* The Data Shape */}
                        <polygon 
                           points={polyPoints}
                           fill="rgba(139, 92, 246, 0.5)"
                           stroke="#8b5cf6"
                           strokeWidth="2"
                           className="transition-all duration-300 ease-out"
                        />

                        {/* Labels */}
                        {statsOrder.map((key, i) => {
                           const { x, y } = getPoint(6, i, 5); // Push label out a bit
                           return (
                              <text 
                                key={key} 
                                x={x} y={y} 
                                textAnchor="middle" 
                                dominantBaseline="middle" 
                                fill="white" 
                                fontSize="10"
                                fontWeight="bold"
                              >
                                 {key}
                              </text>
                           );
                        })}
                     </svg>
                     
                     {/* Decorative Center Text */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-50">Status</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* STEP 2: IDENTITY */}
          {step === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="w-full max-w-md space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-white">Identidade</h2>
                    <p className="text-slate-400">Finalize o registro do seu agente.</p>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-curse-400 uppercase tracking-widest block mb-2">Nome do Agente</label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Yuji Itadori"
                          className="w-full bg-slate-950 border-b-2 border-slate-800 focus:border-curse-500 text-2xl font-bold py-2 text-white placeholder:text-slate-700 outline-none transition-colors"
                          autoFocus
                        />
                     </div>

                     <div>
                        <label className="text-xs font-bold text-curse-400 uppercase tracking-widest block mb-2">URL da Imagem (Opcional)</label>
                        <div className="flex gap-4">
                           <input 
                              type="text" 
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 outline-none focus:border-curse-500"
                           />
                           <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                              {imageUrl ? (
                                 <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                              ) : (
                                 <User size={20} className="text-slate-700" />
                              )}
                           </div>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">Cole um link direto de imagem (Discord, Imgur, etc) para usar no card.</p>
                     </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="bg-curse-900/50 p-2 rounded-full text-curse-400"><Activity size={20}/></div>
                        <div>
                           <div className="text-sm font-bold text-white">{origin}</div>
                           <div className="text-xs text-slate-500">Origem</div>
                        </div>
                     </div>
                     <div className="h-8 w-px bg-slate-800 mx-2"></div>
                     <div className="flex items-center gap-3">
                        <div className="bg-emerald-900/50 p-2 rounded-full text-emerald-400"><Shield size={20}/></div>
                        <div>
                           <div className="text-sm font-bold text-white">{characterClass}</div>
                           <div className="text-xs text-slate-500">Classe</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 flex justify-between items-center border-t border-slate-800 pt-6">
            <button 
              onClick={() => step === 0 ? onCancel() : setStep(s => s - 1)}
              className="px-6 py-2 text-slate-500 hover:text-white font-bold uppercase text-xs tracking-wider transition-colors"
            >
              {step === 0 ? 'Cancelar' : 'Voltar'}
            </button>
            
            <button 
              onClick={() => step === STEPS.length - 1 ? handleFinish() : setStep(s => s + 1)}
              className="bg-white hover:bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-black uppercase text-sm tracking-widest flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-white/10"
            >
              {step === STEPS.length - 1 ? (
                 <>Criar Ficha <Sparkles size={16} /></>
              ) : (
                 <>Próximo <ChevronRight size={16} /></>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};
