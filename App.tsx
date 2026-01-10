import React, { useState, useEffect, useRef } from 'react';
import { Droplet, Zap, Activity, Skull, Flame, LogOut } from 'lucide-react';
import { Character, Origin, CurrentStats, DEFAULT_SKILLS, Skill, Ability, Item, Technique, ActionState, Attributes } from './types';
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
import { CharacterAttributes } from './components/CharacterAttributes';
import { CampaignManager } from './components/CampaignManager';

// Firebase auth imports
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Auth from './components/Auth';
import UserMenu from './components/UserMenu';
import UserProfile from './components/UserProfile';

// Helper to generate a fresh character state (Fallback only)
const getInitialChar = (): Character => ({
  id: Math.random().toString(36).substring(2, 9),
  name: "Feiticeiro",
  level: 1,
  origin: Origin.Inato,
  characterClass: "Combatente", // Default
  attributes: { FOR: 1, AGI: 1, VIG: 1, INT: 1, PRE: 1 },
  skills: JSON.parse(JSON.stringify(DEFAULT_SKILLS)), // Deep copy to avoid reference issues
  abilities: [],
  techniques: [],
  inventory: [],
  aptitudes: {} // Initialize empty aptitudes
});

type Tab = 'combat' | 'abilities' | 'techniques' | 'inventory' | 'progression' | 'campaigns';
type ViewMode = 'menu' | 'creator' | 'sheet' | 'profile';

const STORAGE_KEY = 'jjk_rpg_saved_characters';
const STORAGE_UID_KEY = 'jjk_rpg_current_user_uid'; // Track which user's data is in localStorage
const APP_VERSION = '1.1.0'; // Update this when you deploy changes

const App: React.FC = () => {
  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('menu');

  // Data State - Don't initialize from localStorage, wait for Firebase
  // This prevents loading wrong user's data on account switch
  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);

  const [character, setCharacter] = useState<Character>(getInitialChar());
  
  // UI State
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('combat');
  const [showAbilityLibrary, setShowAbilityLibrary] = useState(false);
  const [abilityLibraryCategory, setAbilityLibraryCategory] = useState<string>('Combatente');

  // Firebase current user state
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Track if we're still checking auth state
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false); // Track if we're loading characters from Firebase

  // Helper: migrate old technique format to new format
  const migrateTechniques = (techniques: any[]): Technique[] => {
    if (!techniques || techniques.length === 0) return [];
    
    return techniques.map(tech => {
      // Check if it's already in new format (has subTechniques array)
      if (tech.subTechniques && Array.isArray(tech.subTechniques)) {
        return tech as Technique;
      }
      
      // Old format - convert to new format
      return {
        id: tech.id || Math.random().toString(36).substring(2, 9),
        name: tech.name || "Técnica Inata",
        category: tech.category || "Inata",
        description: tech.description || "",
        subTechniques: []
      } as Technique;
    });
  };

  // Helper: migrate a single character's techniques
  const migrateCharacter = (char: Character): Character => {
    return {
      ...char,
      techniques: migrateTechniques(char.techniques || [])
    };
  };

  // Helper: load savedCharacters from Firestore users/{uid}
  const loadUserCharacters = async (uid: string): Promise<Character[]> => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const chars = (userData.savedCharacters as Character[]) || [];
        // Migrate all characters
        return chars.map(migrateCharacter);
      }
      return [];
    } catch (err) {
      console.error('Erro ao carregar savedCharacters do Firestore', err);
      return [];
    }
  };

  // Helper: persist savedCharacters to Firestore users/{uid}
  const persistUserCharacters = async (chars: Character[]) => {
    try {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { savedCharacters: chars, email: auth.currentUser.email || null }, { merge: true });
    } catch (err) {
      console.error('Erro ao persistir savedCharacters no Firestore', err);
    }
  };

  // Load characters from Firebase when user logs in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsCheckingAuth(false); // Mark auth check as complete
      
      if (user) {
        setIsLoadingCharacters(true); // Mark that we're loading characters
        
        // Check if localStorage has data from a different user
        const storedUid = localStorage.getItem(STORAGE_UID_KEY);
        if (storedUid && storedUid !== user.uid) {
          // Different user! Clear old data
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_UID_KEY);
          setSavedCharacters([]);
          setCharacter(getInitialChar());
          setViewMode('menu');
        }
        
        // Load characters from Firebase for current user
        const firebaseChars = await loadUserCharacters(user.uid);
        
        // Check localStorage for same user's data (in case Firebase is empty but we have local data)
        let localChars: Character[] = [];
        const currentStoredUid = localStorage.getItem(STORAGE_UID_KEY);
        if (!currentStoredUid || currentStoredUid === user.uid) {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              localChars = JSON.parse(saved);
            }
          } catch (e) {
            console.error("Failed to parse local characters", e);
          }
        }
        
        // Priority: Firebase > localStorage (for same user)
        // If Firebase has data, use it. Otherwise, use localStorage and sync to Firebase
        if (firebaseChars.length > 0) {
          // Firebase has data - use it
          setSavedCharacters(firebaseChars);
        } else if (localChars.length > 0) {
          // Firebase is empty but we have local data - use local and sync to Firebase
          setSavedCharacters(localChars);
          // Sync to Firebase immediately (but don't wait - do it in background)
          persistUserCharacters(localChars).catch(err => {
            console.error("Erro ao sincronizar personagens locais para Firebase:", err);
          });
        } else {
          // Both empty - start fresh
          setSavedCharacters([]);
        }
        
        // Update localStorage UID to current user
        localStorage.setItem(STORAGE_UID_KEY, user.uid);
        
        setIsLoadingCharacters(false); // Mark loading as complete
      } else {
        // User logged out - clear everything
        setSavedCharacters([]);
        setCharacter(getInitialChar());
        setViewMode('menu');
        // Don't clear localStorage here as user might log back in quickly
      }
    });
    return () => unsub();
  }, []);

  // Save List to LocalStorage whenever it changes (and persist to Firestore)
  useEffect(() => {
    // Don't save if we're still loading characters (prevents overwriting with empty array)
    if (isLoadingCharacters) {
      return;
    }
    
    // Only save to localStorage if we have a current user
    // This prevents saving data from wrong user
    if (currentUser) {
      const storedUid = localStorage.getItem(STORAGE_UID_KEY);
      // Only save if the stored UID matches current user
      if (!storedUid || storedUid === currentUser.uid) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCharacters));
        localStorage.setItem(STORAGE_UID_KEY, currentUser.uid);
      }
      // Always persist to Firestore (unless we're loading)
      persistUserCharacters(savedCharacters).catch(err => {
        console.error("Erro ao persistir personagens no Firestore:", err);
      });
    }
  }, [savedCharacters, currentUser, isLoadingCharacters]);

  // Derived Stats based on Character
  const stats = calculateDerivedStats(character);

  // Current Dynamic Stats
  const [currentStats, setCurrentStats] = useState<CurrentStats>({ pv: 0, ce: 0, pe: 0 });

  // Shared state to control which roll result is shown (skill or combat)
  const [activeRollResult, setActiveRollResult] = useState<'skill' | 'combat' | null>(null);

  // Domain Expansion State
  const [domainActive, setDomainActive] = useState(false);
  const [domainRound, setDomainRound] = useState(0);

  // Active Buffs State
  const [activeBuffs, setActiveBuffs] = useState<Ability[]>([]);

  // Ref to track last saved character for auto-save optimization
  const lastSavedCharacterRef = useRef<string>('');

  // Robust Stats Initialization & Clamping
  useEffect(() => {
    if (viewMode === 'sheet') {
       // If stats are zero (likely fresh load) and Max is > 0, initialize to Max.
       // Since we don't save "Current HP", loading a char always resets to full.
       if (currentStats.pv === 0 && currentStats.ce === 0 && currentStats.pe === 0 && stats.MaxPV > 0) {
           setCurrentStats({
             pv: stats.MaxPV,
             ce: stats.MaxCE,
             pe: stats.MaxPE
           });
       } else {
           // Otherwise, just clamp if Max decreased (e.g. level down)
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
      const updated = exists ? prev.map(c => c.id === character.id ? character : c) : [...prev, character];
      // persistUserCharacters is invoked by the useEffect that watches savedCharacters
      return updated;
    });
  };

  const handleSelectCharacter = (char: Character) => {
    setCharacter(char);
    
    // Update the ref to the loaded character to avoid immediate auto-save
    lastSavedCharacterRef.current = JSON.stringify(char);
    
    // Explicitly calculate and set FULL stats based on the loaded character
    // This helps immediate render before useEffect kicks in
    const newStats = calculateDerivedStats(char);
    setCurrentStats({ 
      pv: newStats.MaxPV, 
      ce: newStats.MaxCE, 
      pe: newStats.MaxPE 
    });

    // Reset temporary states for new session
    setDomainActive(false);
    setActiveBuffs([]);
    setActiveTab('combat');
    setViewMode('sheet');
    setActiveRollResult(null);
  };

  const handleStartCreation = () => {
     setViewMode('creator');
  };

  const handleFinishCreation = (newChar: Character) => {
     // Update ref to the new character since it's already being saved
     lastSavedCharacterRef.current = JSON.stringify(newChar);
     // Save immediately (this will trigger persistence effect)
     setSavedCharacters(prev => {
       const updated = [...prev, newChar];
       return updated;
     });
     // Select and go to sheet
     handleSelectCharacter(newChar);
  };

  const handleDeleteCharacter = (id: string) => {
    // If we delete the currently active character, reset the active state to avoid re-saving a ghost
    if (character.id === id) {
        setCharacter(getInitialChar());
    }
    setSavedCharacters(prev => prev.filter(c => c.id !== id));
    // persistence handled by effect
  };

  const handleBackToMenu = () => {
    saveCurrentCharacter(); // Auto-save on exit (will update savedCharacters and persist)
    setViewMode('menu');
  };

  // Auto-save character when it changes in sheet view
  useEffect(() => {
    // Only auto-save if we're in sheet view and the character has been properly loaded
    if (viewMode !== 'sheet') {
      lastSavedCharacterRef.current = ''; // Reset when leaving sheet view
      return;
    }
    
    // Don't save the initial/fallback character (check if it's the default one)
    const initialChar = getInitialChar();
    if (!character.id || (character.id === initialChar.id && character.name === initialChar.name)) {
      return;
    }
    
    // Check if this character exists in savedCharacters (to avoid saving brand new chars before they're properly initialized)
    const exists = savedCharacters.some(c => c.id === character.id);
    if (!exists && savedCharacters.length > 0) {
      return; // Wait for proper initialization
    }
    
    // Serialize character to compare with last saved version
    const currentCharJson = JSON.stringify(character);
    if (currentCharJson === lastSavedCharacterRef.current) {
      return; // No changes, skip save
    }
    
    // Debounce auto-save to avoid excessive saves during rapid edits
    const timeoutId = setTimeout(() => {
      setSavedCharacters(prev => {
        const charExists = prev.some(c => c.id === character.id);
        const updated = charExists 
          ? prev.map(c => c.id === character.id ? character : c) 
          : [...prev, character];
        
        // Update ref after saving
        lastSavedCharacterRef.current = JSON.stringify(character);
        return updated;
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [character, viewMode]); // Watch character and viewMode

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
  const handleCharUpdate = (field: keyof Character, value: any) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
  };

  const handleAttributeUpdate = (attr: keyof Attributes, val: number) => {
    setCharacter(prev => ({
        ...prev,
        attributes: { ...prev.attributes, [attr]: val }
    }));
  };

  const handleSkillUpdate = (id: string, field: keyof Skill, value: any) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s => {
        if (s.id !== id) return s;
        // Permite trocar atributo das perícias base; apenas bloqueia renomear
        if (s.isBase && field === 'name') return s;
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

  const handleAptitudeUpdate = (category: keyof import('./types').AptitudeLevels, level: number) => {
    setCharacter(prev => ({
      ...prev,
      aptitudes: {
        ...prev.aptitudes,
        [category]: Math.max(0, level) // Ensure level is at least 0
      }
    }));
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

  // --- RENDER ---

  // If not logged in, show Auth screen
  // Show nothing while checking auth state to avoid flashing login screen
  if (isCheckingAuth) {
    return null; // Or a minimal loading screen if preferred
  }

  // Only show Auth screen if we've checked and confirmed no user
  if (!currentUser) {
    return <Auth />;
  }

  if (viewMode === 'profile') {
    if (!currentUser) {
      setViewMode('menu');
      return null;
    }
    return <UserProfile user={currentUser} onBack={() => setViewMode('menu')} />;
  }

  if (viewMode === 'menu') {
     return (
        <>
          <div className="fixed top-3 right-3 z-50">
            <UserMenu user={currentUser} onProfileClick={() => setViewMode('profile')} />
          </div>
          <CharacterSelection 
             savedCharacters={savedCharacters}
             onSelect={handleSelectCharacter}
             onCreate={handleStartCreation}
             onDelete={handleDeleteCharacter}
          />
        </>
     );
  }

  if (viewMode === 'creator') {
     return (
        <>
          <div className="fixed top-3 right-3 z-50">
            <UserMenu user={currentUser} onProfileClick={() => setViewMode('profile')} />
          </div>
          <CharacterCreator 
             onFinish={handleFinishCreation}
             onCancel={() => setViewMode('menu')}
          />
        </>
     );
  }

  // --- SHEET VIEW ---

  const bgClass = domainActive 
    ? "bg-gradient-to-br from-slate-950 via-curse-950 to-slate-950" 
    : "bg-slate-950";

  const borderColor = domainActive ? "border-curse-500/50" : "border-slate-800";

  return (
    <div className={`min-h-screen ${bgClass} text-slate-200 font-sans selection:bg-curse-500/30 transition-colors duration-150 relative`}>
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
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${borderColor} bg-slate-950/80 px-4 py-3 flex justify-between items-center transition-colors duration-150`}>
        <div className="flex items-center gap-4">
          <button 
             onClick={handleBackToMenu}
             className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-lg border border-slate-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors duration-100"
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

        {/* Right area: user menu */}
        <div className="flex items-center gap-4">
          <UserMenu user={currentUser} onProfileClick={() => setViewMode('profile')} />
        </div>
      </header>

      {/* If Campaign Tab Active, it takes over Main */}
      {activeTab === 'campaigns' ? (
          <div className="max-w-[1600px] mx-auto p-4 pb-24 h-full">
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar mb-6">
                {(['combat', 'abilities', 'techniques', 'inventory', 'progression', 'campaigns'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-2 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all duration-100 whitespace-nowrap flex justify-center items-center gap-1
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
                    {tab === 'campaigns' && 'Campanhas'}
                    </button>
                ))}
            </div>
            <CampaignManager currentUserChar={character} />
          </div>
      ) : (
      <main className="max-w-[1600px] mx-auto p-4 pb-24">
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Identity, Attributes, Stats (3 cols) */}
          <section className="md:col-span-1 xl:col-span-3 space-y-6">
            
            {/* New Character Identity & Attributes Component */}
            <CharacterAttributes 
               char={character}
               onUpdate={handleCharUpdate}
               onUpdateAttribute={handleAttributeUpdate}
            />

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
            <section className={`rounded-xl border ${borderColor} p-4 transition-all duration-150 ${domainActive ? 'bg-curse-950/30' : 'bg-slate-900/50'}`}>
              <div className="flex items-center gap-2 mb-4">
                 <Skull size={20} className={domainActive ? "text-curse-400" : "text-slate-600"} />
                 <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Controle de Domínio</h2>
              </div>
              
              {!domainActive ? (
                <div className="grid grid-cols-3 gap-2">
                  {[50, 150, 200].map(cost => (
                    <button
                      key={cost}
                      onClick={() => toggleDomain(cost)}
                      className="py-2 px-1 bg-slate-950 border border-slate-800 hover:border-curse-500 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-colors duration-100"
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
                activeRollResult={activeRollResult}
                setActiveRollResult={setActiveRollResult}
             />
          </section>

          {/* RIGHT COLUMN: Main Tabs (4 cols) */}
          <section className="md:col-span-2 xl:col-span-4 flex flex-col gap-4">
            
            {/* Tab Navigation */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
               {(['combat', 'abilities', 'techniques', 'inventory', 'progression', 'campaigns'] as Tab[]).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-2 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all duration-100 whitespace-nowrap flex justify-center items-center gap-1
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
                   {tab === 'campaigns' && 'Campanhas'}
                 </button>
               ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-100">
               {activeTab === 'combat' && (
                  <CombatTabs 
                    char={character}
                    stats={stats}
                    currentStats={currentStats}
                    consumeCE={consumeCE}
                    consumePE={consumePE}
                    activeBuffs={activeBuffs}
                    onConsumeBuffs={handleConsumeBuffs}
                    activeRollResult={activeRollResult}
                    setActiveRollResult={setActiveRollResult}
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
                  <LevelUpSummary char={character} onUpdateAptitude={handleAptitudeUpdate} />
               )}
            </div>

          </section>

        </div>
      </main>
      )}
      
      {/* Version Footer */}
      <footer className="fixed bottom-2 right-2 pointer-events-none z-10">
        <span className="text-[10px] text-slate-700/60 font-mono select-none">
          v{APP_VERSION}
        </span>
      </footer>
    </div>
  );
};

export default App;
