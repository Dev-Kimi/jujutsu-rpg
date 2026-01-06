import React, { useState, useEffect } from 'react';
// --- IMPORTS DO FIREBASE E AUTH ---
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Auth from './components/Auth';

// --- IMPORTS DO JOGO ---
import { Droplet, Zap, Activity, Skull, Flame, User as UserIcon, LogOut } from 'lucide-react';
import { Character, Origin, CurrentStats, DEFAULT_SKILLS, Skill, Ability, Item, Technique, ActionState } from './types';
import { calculateDerivedStats, calculateDomainCost, parseAbilityEffect, parseAbilitySkillTrigger } from './utils/calculations';
import { StatBar } from './components/StatBar';
import { CombatTabs } from './components/CombatTabs';
import { SkillList } from './components/SkillList';
import { AccordionList } from './components/AccordionList';
import { InventoryList } from './components/InventoryList';
import { AbilityLibrary } from './components/AbilityLibrary';
import { CharacterEditor } from './components/CharacterEditor';
import { TechniqueManager } from './components/TechniqueManager';
import { LevelUpSummary } from './components/LevelUpSummary';
import { CharacterSelection } from './components/CharacterSelection';
import { CharacterCreator } from './components/CharacterCreator';

// Helper to generate a fresh character state (Fallback only)
const getInitialChar = (): Character => ({
  id: Math.random().toString(36).substring(2, 9),
  name: "Feiticeiro",
  level: 1,
  origin: Origin.Inato,
  characterClass: "Combatente",
  attributes: { FOR: 1, AGI: 1, VIG: 1, INT: 1, PRE: 1 },
  skills: JSON.parse(JSON.stringify(DEFAULT_SKILLS)),
  abilities: [],
  techniques: [],
  inventory: []
});

type Tab = 'combat' | 'abilities' | 'techniques' | 'inventory' | 'progression';
type ViewMode = 'menu' | 'creator' | 'sheet';

const STORAGE_KEY = 'jjk_rpg_saved_characters';

const App: React.FC = () => {
  // ------------------------------------------------------------------
  // 1. LÓGICA DE LOGIN (O PORTEIRO)
  // ------------------------------------------------------------------
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Monitora se o usuário entrou ou saiu
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Só paramos de carregar DEPOIS que sabemos quem é o usuário
      // Se tiver usuário, vamos carregar os dados dele do banco logo abaixo
      if (!currentUser) setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // ------------------------------------------------------------------
  // 2. ESTADOS DO JOGO
  // ------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  
  // Data State - Começa vazio e preenchemos via Firebase ou LocalStorage
  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);

  const [character, setCharacter] = useState<Character>(getInitialChar());
  
  // UI State
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('combat');
  const [showAbilityLibrary, setShowAbilityLibrary] = useState(false);
  const [abilityLibraryCategory, setAbilityLibraryCategory] = useState<string>('Combatente');

  // ------------------------------------------------------------------
  // 3. CARREGAR E SALVAR DADOS (INTEGRAÇÃO FIREBASE)
  // ------------------------------------------------------------------
  
  // Carregar dados quando o usuário loga
  useEffect(() => {
    if (user) {
      const loadUserData = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.characters) setSavedCharacters(data.characters);
          }
        } catch (error) {
          console.error("Erro ao carregar fichas:", error);
        } finally {
          setLoadingAuth(false); // Libera a tela
        }
      };
      loadUserData();
    }
  }, [user]);

  // Salvar dados no Firebase sempre que a lista de personagens mudar
  useEffect(() => {
    if (user && !loadingAuth && savedCharacters.length > 0) {
      const saveUserData = async () => {
        try {
          await setDoc(doc(db, "users", user.uid), {
            characters: savedCharacters,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error("Erro ao salvar:", error);
        }
      };
      // Espera 2 segundos antes de salvar para não sobrecarregar o banco (Debounce)
      const timeout = setTimeout(saveUserData, 2000);
      return () => clearTimeout(timeout);
    }
  }, [savedCharacters, user, loadingAuth]);


  // ------------------------------------------------------------------
  // 4. LÓGICA DO JOGO (GAMEPLAY) - MANTIDA IGUAL
  // ------------------------------------------------------------------

  // Derived Stats based on Character
  const stats = calculateDerivedStats(character);

  // Current Dynamic Stats
  const [currentStats, setCurrentStats] = useState<CurrentStats>({ pv: 0, ce: 0, pe: 0 });

  // Turn Action State
  const [actionState, setActionState] = useState<ActionState>({
    standard: true,
    movement: 2,
    reactionPenalty: 0
  });

  // Domain Expansion State
  const [domainActive, setDomainActive] = useState(false);
  const [domainRound, setDomainRound] = useState(0);

  // Active Buffs State
  const [activeBuffs, setActiveBuffs] = useState<Ability[]>([]);

  // Robust Stats Initialization & Clamping
  useEffect(() => {
    if (viewMode === 'sheet') {
       if (currentStats.pv === 0 && currentStats.ce === 0 && currentStats.pe === 0 && stats.MaxPV > 0) {
           setCurrentStats({
             pv: stats.MaxPV,
             ce: stats.MaxCE,
             pe: stats.MaxPE
           });
       } else {
           setCurrentStats(prev => ({
             pv: Math.min(prev.pv, stats.MaxPV),
             ce: Math.min(prev.ce, stats.MaxCE),
             pe: Math.min(prev.pe, stats.MaxPE)
           }));
       }
    }
  }, [stats.MaxPV, stats.MaxCE, stats.MaxPE, viewMode]);

  // --- Persistence & Navigation Handlers ---

  const saveCurrentCharacter = () => {
     setSavedCharacters(prev => {
      const exists = prev.some(c => c.id === character.id);
      if (exists) {
        return prev.map(c => c.id === character.id ? character : c);
      } else {
        return [...prev, character];
      }
    });
  };

  const handleSelectCharacter = (char: Character) => {
    setCharacter(char);
    
    const newStats = calculateDerivedStats(char);
    setCurrentStats({ 
      pv: newStats.MaxPV, 
      ce: newStats.MaxCE, 
      pe: newStats.MaxPE 
    });

    setActionState({ standard: true, movement: 2, reactionPenalty: 0 });
    setDomainActive(false);
    setActiveBuffs([]);
    setActiveTab('combat');
    setViewMode('sheet');
  };

  const handleStartCreation = () => {
     setViewMode('creator');
  };

  const handleFinishCreation = (newChar: Character) => {
     setSavedCharacters(prev => [...prev, newChar]);
     handleSelectCharacter(newChar);
  };

  const handleDeleteCharacter = (id: string) => {
    if (character.id === id) {
        setCharacter(getInitialChar());
    }
    setSavedCharacters(prev => prev.filter(c => c.id !== id));
  };

  const handleBackToMenu = () => {
    saveCurrentCharacter(); 
    setViewMode('menu');
  };

  // --- Gameplay Logic Helpers ---

  const updateStat = (key: keyof CurrentStats, val: number) => {
    setCurrentStats(prev => ({ ...prev, [key]: val }));
  };

  const consumeCE = (amount: number) => {
    updateStat('ce', Math.max(0, currentStats.ce - amount));
  };

  const consumePE = (amount: number) => {
    updateStat('pe', Math.max(0, currentStats.pe - amount));
  };

  const handleUseAbility = (cost: { pe: number, ce: number }, abilityName: string, abilityId?: string) => {
    const ability = character.abilities.find(a => a.id === abilityId);
    const effects = ability ? parseAbilityEffect(ability.description) : { attack: 0, defense: 0 };
    const hasCombatBuff = effects.attack > 0 || effects.defense > 0;
    const skillTrigger = ability ? parseAbilitySkillTrigger(ability.description) : null;
    const shouldQueue = hasCombatBuff || skillTrigger;

    if (shouldQueue && ability) {
        const isAlreadyActive = activeBuffs.some(b => b.id === ability.id);
        if (isAlreadyActive) {
            setActiveBuffs(prev => prev.filter(b => b.id !== ability.id));
            return false;
        } else {
            setActiveBuffs(prev => [...prev, ability]);
            return true;
        }
    }

    if (currentStats.pe < cost.pe) {
      alert(`PE Insuficiente para usar ${abilityName}! Necessário: ${cost.pe}, Atual: ${currentStats.pe}`);
      return false;
    }
    if (currentStats.ce < cost.ce) {
      alert(`CE Insuficiente para usar ${abilityName}! Necessário: ${cost.ce}, Atual: ${currentStats.ce}`);
      return false;
    }

    consumePE(cost.pe);
    consumeCE(cost.ce);
    return true;
  };

  const handleConsumeBuffs = (buffsToConsume: Ability[]) => {
      setActiveBuffs(prev => prev.filter(a => !buffsToConsume.some(b => b.id === a.id)));
  };
  
  // Update Wrappers
  const handleSkillUpdate = (id: string, field: keyof Skill, value: any) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s => {
        if (s.id !== id) return s;
        if (s.isBase && (field === 'name' || field === 'attribute')) return s;
        return { ...s, [field]: value };
      })
    }));
  };

  const handleAddSkill = () => {
    const newSkill: Skill = { id: Math.random().toString(36).substring(2, 9), name: "Nova Perícia", value: 0 };
    setCharacter(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
  };

  const handleRemoveSkill = (id: string) => {
    setCharacter(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
  };

  const handleArrayAdd = (field: 'abilities' | 'inventory', category?: string, template?: Partial<Item>) => {
    if (field === 'abilities') {
      if (category) setAbilityLibraryCategory(category);
      setShowAbilityLibrary(true);
      return;
    }
    const id = Math.random().toString(36).substring(2, 9);
    let newItem;
    if (field === 'inventory') {
      newItem = { id, name: template?.name || "", quantity: 1, description: template?.description || "" } as Item;
    } else {
      newItem = { id, name: "", cost: "", description: "", category: category || "Combatente" } as Ability;
    }
    setCharacter(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
  };

  const handleAddTechnique = (technique: Technique) => {
    setCharacter(prev => ({ ...prev, techniques: [...prev.techniques, technique] }));
  };

  const handleTechniqueUpdate = (id: string, field: keyof Technique, value: any) => {
    setCharacter(prev => ({ ...prev, techniques: prev.techniques.map(t => t.id === id ? { ...t, [field]: value } : t) }));
  };

  const handleTechniqueRemove = (id: string) => {
     setCharacter(prev => ({ ...prev, techniques: prev.techniques.filter(t => t.id !== id) }));
  };

  const handleAddAbilityFromLibrary = (ability: Partial<Ability>) => {
    const newAbility: Ability = {
       id: Math.random().toString(36).substring(2, 9),
       name: ability.name || "Nova Habilidade",
       category: ability.category || "Combatente",
       cost: ability.cost || "",
       description: ability.description || ""
    };
    setCharacter(prev => ({ ...prev, abilities: [...prev.abilities, newAbility] }));
    setShowAbilityLibrary(false);
  };

  const handleArrayUpdate = (field: 'abilities' | 'inventory', id: string, itemField: string, value: any) => {
    setCharacter(prev => ({ ...prev, [field]: prev[field].map((item: any) => item.id === id ? { ...item, [itemField]: value } : item) }));
  };

  const handleArrayRemove = (field: 'abilities' | 'inventory', id: string) => {
     setCharacter(prev => ({ ...prev, [field]: prev[field].filter((item: any) => item.id !== id) }));
  };

  const toggleDomain = (initialCost: number) => {
    if (!domainActive) {
      if (currentStats.ce < initialCost) {
        alert("CE Insuficiente para abrir o domínio!");
        return;
      }
      consumeCE(initialCost);
      setDomainActive(true);
      setDomainRound(1);
    } else {
      setDomainActive(false);
      setDomainRound(0);
    }
  };

  const advanceDomainRound = () => {
    const nextRound = domainRound + 1;
    setDomainRound(nextRound);
    const costPE = calculateDomainCost(nextRound);
    if (costPE > 0) {
      if (currentStats.pe < costPE) {
        alert("PE Esgotado! O domínio colapsou.");
        setDomainActive(false);
        setDomainRound(0);
      } else {
        updateStat('pe', currentStats.pe - costPE);
      }
    }
  };

  // ------------------------------------------------------------------
  // 5. RENDERIZAÇÃO (PROTEÇÃO DE TELA)
  // ------------------------------------------------------------------

  // Se estiver carregando o Firebase, mostra tela de loading
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-curse-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">Expandindo Domínio...</p>
      </div>
    );
  }

  // Se NÃO tiver usuário logado, mostra a tela de Login (Auth)
  if (!user) {
    return <Auth />;
  }

  // SE TIVER LOGADO, MOSTRA O JOGO ORIGINAL ABAIXO
  // (Mantive toda a sua lógica de visualização aqui)

  if (viewMode === 'menu') {
     return (
        <CharacterSelection 
           savedCharacters={savedCharacters}
           onSelect={handleSelectCharacter}
           onCreate={handleStartCreation}
           onDelete={handleDeleteCharacter}
        />
     );
  }

  if (viewMode === 'creator') {
     return (
        <CharacterCreator 
           onFinish={handleFinishCreation}
           onCancel={() => setViewMode('menu')}
        />
     );
  }

  // --- SHEET VIEW ---

  const bgClass = domainActive 
    ? "bg-gradient-to-br from-slate-950 via-curse-950 to-slate-950" 
    : "bg-slate-950";

  const borderColor = domainActive ? "border-curse-500/50" : "border-slate-800";

  return (
    <div className={`min-h-screen ${bgClass} text-slate-200 font-sans selection:bg-curse-500/30 transition-colors duration-1000 relative`}>
      {/* Modal Integration */}
      {showAbilityLibrary && (
        <AbilityLibrary 
          initialCategory={abilityLibraryCategory}
          onSelect={handleAddAbilityFromLibrary} 
          onClose={() => setShowAbilityLibrary(false)} 
        />
      )}
      
      {showEditor && (
        <CharacterEditor 
           char={character} 
           setChar={setCharacter} 
           onClose={() => setShowEditor(false)} 
        />
      )}

      {/* Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${borderColor} bg-slate-950/80 px-4 py-3 flex justify-between items-center transition-colors duration-1000`}>
        <div className="flex items-center gap-4">
          <button 
             onClick={handleBackToMenu}
             className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-lg border border-slate-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
             title="Salvar e Voltar"
          >
             <LogOut size={16} /> <span className="hidden sm:inline">Menu</span>
          </button>
          
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">
              JUJUTSU <span className="text-curse-500">RPG</span>
            </h1>
          </div>
          {domainActive && (
            <div className="flex bg-curse-900/20 border border-curse-500 text-curse-200 px-3 py-1 rounded-lg items-center gap-4 animate-pulse">
              <span className="font-bold text-xs uppercase tracking-widest hidden sm:inline">Domínio Ativo</span>
              <span className="text-xs font-mono">Rodada {domainRound}</span>
            </div>
          )}
        </div>

        {/* INFO DO USUÁRIO E BOTÃO SAIR */}
        <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden md:block">{user.email}</span>
            <button 
                onClick={() => {
                  saveCurrentCharacter();
                  signOut(auth);
                }}
                className="text-xs bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 px-3 py-1.5 rounded transition-colors"
            >
                Sair
            </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 pb-24">
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Identity, Attributes, Stats (3 cols) */}
          <section className="md:col-span-1 xl:col-span-3 space-y-6">
            
            {/* Identity Card */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 backdrop-blur-sm relative overflow-hidden group">
              {character.imageUrl && (
                 <div className="absolute inset-0">
                    <img src={character.imageUrl} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                 </div>
              )}
              
              <div className="relative z-10 p-4 space-y-3">
                <button 
                  onClick={() => setShowEditor(true)}
                  className="absolute top-4 right-4 text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg text-slate-300 z-20"
                >
                    Editar
                </button>

                <div className="flex items-center gap-2 mb-2 text-curse-400 border-b border-slate-800 pb-2">
                  <UserIcon size={16} />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Agente</h2>
                </div>
                
                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-2xl font-bold text-white truncate">{character.name}</h3>
                    <span className="text-sm font-mono text-curse-400">Lv.{character.level}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mt-1">
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 backdrop-blur-md">{character.origin}</span>
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 backdrop-blur-md">{character.characterClass}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Bars */}
            <div className="space-y-1">
              <StatBar 
                label="Vida (PV)" 
                icon={<Droplet size={14} className="text-blood-500" />}
                current={currentStats.pv} 
                max={stats.MaxPV} 
                colorClass="bg-blood-500"
                onChange={(v) => updateStat('pv', v)}
              />
              <StatBar 
                label="Energia (CE)" 
                icon={<Zap size={14} className="text-curse-400" />}
                current={currentStats.ce} 
                max={stats.MaxCE} 
                colorClass="bg-curse-500"
                onChange={(v) => updateStat('ce', v)}
              />
              <StatBar 
                label="Esforço (PE)" 
                icon={<Activity size={14} className="text-orange-400" />}
                current={currentStats.pe} 
                max={stats.MaxPE} 
                colorClass="bg-orange-500"
                onChange={(v) => updateStat('pe', v)}
              />
              <div className="flex gap-2">
                <div className="flex-1 mt-2 p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500 uppercase font-bold">Lim. (LL)</span>
                  <span className="text-curse-400 font-black text-lg">{stats.LL}</span>
                </div>
                <div className="flex-1 mt-2 p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500 uppercase font-bold">Mov.</span>
                  <span className="text-emerald-400 font-black text-lg">{stats.Movement}m</span>
                </div>
              </div>
            </div>

            {/* Domain Expansion Control */}
            <section className={`rounded-xl border ${borderColor} p-4 transition-all duration-500 ${domainActive ? 'bg-curse-950/30' : 'bg-slate-900/50'}`}>
              <div className="flex items-center gap-2 mb-4">
                 <Skull size={20} className={domainActive ? "text-curse-400 animate-bounce" : "text-slate-600"} />
                 <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Controle de Domínio</h2>
              </div>
              
              {!domainActive ? (
                <div className="grid grid-cols-3 gap-2">
                  {[50, 150, 200].map(cost => (
                    <button
                      key={cost}
                      onClick={() => toggleDomain(cost)}
                      className="py-2 px-1 bg-slate-950 border border-slate-800 hover:border-curse-500 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-colors"
                    >
                      Ativar ({cost})
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                     <button 
                      onClick={advanceDomainRound}
                      className="flex-1 py-3 bg-curse-600 hover:bg-curse-500 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2"
                     >
                       <Flame size={16} /> Avançar Rodada
                     </button>
                   </div>
                   <button 
                    onClick={() => toggleDomain(0)}
                    className="w-full py-2 bg-slate-800 text-slate-400 hover:text-white font-bold rounded-lg text-xs uppercase tracking-wider"
                   >
                     Fechar Domínio
                   </button>
                </div>
              )}
            </section>
          </section>

          {/* MIDDLE COLUMN: Skills (5 cols) */}
          <section className="md:col-span-1 xl:col-span-5 h-full">
             <SkillList 
                char={character} 
                onUpdateSkill={handleSkillUpdate}
                onAddSkill={handleAddSkill}
                onRemoveSkill={handleRemoveSkill}
                activeBuffs={activeBuffs}
                onConsumeBuff={handleConsumeBuffs}
                currentStats={currentStats}
                consumePE={consumePE}
                consumeCE={consumeCE}
                actionState={actionState} // Passed for penalty logic
             />
          </section>

          {/* RIGHT COLUMN: Main Tabs (4 cols) */}
          <section className="md:col-span-2 xl:col-span-4 flex flex-col gap-4">
            
            {/* Tab Navigation */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
               {(['combat', 'abilities', 'techniques', 'inventory', 'progression'] as Tab[]).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-2 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all whitespace-nowrap flex justify-center items-center gap-1
                      ${activeTab === tab 
                        ? 'bg-curse-600 text-white shadow-lg shadow-curse-900/50' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}
                    `}
                 >
                   {tab === 'combat' && 'Combate'}
                   {tab === 'abilities' && 'Habilid.'}
                   {tab === 'techniques' && 'Técnicas'}
                   {tab === 'inventory' && 'Invent.'}
                   {tab === 'progression' && 'Progressão'}
                 </button>
               ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               {activeTab === 'combat' && (
                  <CombatTabs 
                    char={character}
                    stats={stats}
                    currentStats={currentStats}
                    consumeCE={consumeCE}
                    consumePE={consumePE}
                    activeBuffs={activeBuffs}
                    onConsumeBuffs={handleConsumeBuffs}
                    actionState={actionState} // Shared state
                    setActionState={setActionState} // Updater
                    onUpdateInventory={(id, field, val) => handleArrayUpdate('inventory', id, field, val)}
                  />
               )}
               {activeTab === 'abilities' && (
                 <AccordionList 
                   title="Habilidades"
                   items={character.abilities}
                   categories={['Combatente', 'Feiticeiro', 'Especialista', 'Restrição Celestial', 'Habilidades Amaldiçoadas']}
                   enableTabs={false}
                   onAdd={(cat) => handleArrayAdd('abilities', cat)}
                   onUpdate={(id, field, val) => handleArrayUpdate('abilities', id, field, val)}
                   onRemove={(id) => handleArrayRemove('abilities', id)}
                   placeholderName="Nova Habilidade"
                   onUse={(cost, name) => handleUseAbility(cost, name)}
                   // New prop to pass down ID to find the object
                   onUseWithId={(cost, name, id) => handleUseAbility(cost, name, id)}
                   activeBuffs={activeBuffs}
                 />
               )}
               {activeTab === 'techniques' && (
                 <TechniqueManager 
                    techniques={character.techniques}
                    onAdd={handleAddTechnique}
                    onUpdate={handleTechniqueUpdate}
                    onRemove={handleTechniqueRemove}
                 />
               )}
               {activeTab === 'inventory' && (
                 <InventoryList 
                   items={character.inventory}
                   onAdd={(template) => handleArrayAdd('inventory', undefined, template)}
                   onUpdate={(id, field, val) => handleArrayUpdate('inventory', id, field, val)}
                   onRemove={(id) => handleArrayRemove('inventory', id)}
                 />
               )}
               {activeTab === 'progression' && (
                  <LevelUpSummary char={character} />
               )}
            </div>

          </section>

        </div>
      </main>
    </div>
  );
};

export default App;