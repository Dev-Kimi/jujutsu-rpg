import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Droplet, Zap, Activity, Skull, Flame, LogOut } from 'lucide-react';
import { Character, Origin, CurrentStats, DEFAULT_SKILLS, Skill, Ability, Item, Technique, ActionState, Attributes, Condition, BindingVow } from './types';
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
import { TechniqueLibrary } from './components/TechniqueLibrary';
import { InventoryLibrary } from './components/InventoryLibrary';

// Firebase auth imports
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
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
  equippedWeapons: [],
  aptitudes: {}, // Initialize empty aptitudes
  bindingVows: [], // Initialize empty binding vows
  conditions: [] // Initialize empty conditions
});

type Tab = 'combat' | 'abilities' | 'techniques' | 'inventory' | 'progression' | 'campaigns' | 'binding-vows';
type ViewMode = 'menu' | 'creator' | 'sheet' | 'profile';

const STORAGE_KEY = 'jjk_rpg_saved_characters';
const STORAGE_UID_KEY = 'jjk_rpg_current_user_uid'; // Track which user's data is in localStorage
const APP_VERSION = '1.5.0'; // Update this when you deploy changes

const App: React.FC = () => {
  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('menu');

  // Data State - Don't initialize from localStorage, wait for Firebase
  // This prevents loading wrong user's data on account switch
  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);
  const [userTechniques, setUserTechniques] = useState<Technique[]>([]); // Global technique library for user
  const [userInventoryItems, setUserInventoryItems] = useState<Item[]>([]); // Global inventory library for user

  const [character, setCharacter] = useState<Character>(getInitialChar());
  
  // UI State
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('combat');
  const [showAbilityLibrary, setShowAbilityLibrary] = useState(false);
  const [abilityLibraryCategory, setAbilityLibraryCategory] = useState<string>('Combatente');
  const [showTechniqueLibrary, setShowTechniqueLibrary] = useState(false);
  const [showInventoryLibrary, setShowInventoryLibrary] = useState(false);

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
      techniques: migrateTechniques(char.techniques || []),
      equippedWeapons: char.equippedWeapons || []
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

  // Helper: load user's technique library from Firestore
  const loadUserTechniques = async (uid: string): Promise<Technique[]> => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return (userData.userTechniques as Technique[]) || [];
      }
      return [];
    } catch (err) {
      console.error('Erro ao carregar técnicas do usuário do Firestore', err);
      return [];
    }
  };

  // Helper: load user's inventory library from Firestore
  const loadUserInventoryItems = async (uid: string): Promise<Item[]> => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return (userData.userInventoryItems as Item[]) || [];
      }
      return [];
    } catch (err) {
      console.error('Erro ao carregar itens do usuário do Firestore', err);
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

  // Helper: persist user's technique library to Firestore
  const persistUserTechniques = async (techniques: Technique[]) => {
    try {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { userTechniques: techniques }, { merge: true });
    } catch (err) {
      console.error('Erro ao persistir técnicas do usuário no Firestore', err);
    }
  };

  // Helper: persist user's inventory library to Firestore
  const persistUserInventoryItems = async (items: Item[]) => {
    try {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { userInventoryItems: items }, { merge: true });
    } catch (err) {
      console.error('Erro ao persistir itens do usuário no Firestore', err);
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
        const firebaseTechniques = await loadUserTechniques(user.uid);
        const firebaseInventoryItems = await loadUserInventoryItems(user.uid);
        
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

        // Load user techniques and inventory items
        setUserTechniques(firebaseTechniques);
        setUserInventoryItems(firebaseInventoryItems);
        
        // Update localStorage UID to current user
        localStorage.setItem(STORAGE_UID_KEY, user.uid);
        
        setIsLoadingCharacters(false); // Mark loading as complete
      } else {
        // User logged out - clear everything
        setSavedCharacters([]);
        setUserTechniques([]);
        setUserInventoryItems([]);
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

  // Save user techniques to Firestore whenever they change
  useEffect(() => {
    if (isLoadingCharacters) {
      return;
    }
    
    if (currentUser) {
      persistUserTechniques(userTechniques).catch(err => {
        console.error("Erro ao persistir técnicas no Firestore:", err);
      });
    }
  }, [userTechniques, currentUser, isLoadingCharacters]);

  // Save user inventory items to Firestore whenever they change
  useEffect(() => {
    if (isLoadingCharacters) {
      return;
    }
    
    if (currentUser) {
      persistUserInventoryItems(userInventoryItems).catch(err => {
        console.error("Erro ao persistir itens no Firestore:", err);
      });
    }
  }, [userInventoryItems, currentUser, isLoadingCharacters]);

  // Derived Stats based on Character
  const stats = calculateDerivedStats(character);

  // Current Dynamic Stats
  const [currentStats, setCurrentStats] = useState<CurrentStats>({ pv: 0, ce: 0, pe: 0 });

  const [activeCombatCampaignIds, setActiveCombatCampaignIds] = useState<string[]>([]);
  const lastSavedCombatMirrorRef = useRef<string>('');

  // Shared state to control which roll result is shown (skill or combat)
  const [activeRollResult, setActiveRollResult] = useState<'skill' | 'combat' | null>(null);

  // Domain Expansion State
  const [domainActive, setDomainActive] = useState(false);
  const [domainRound, setDomainRound] = useState(0);
  const [domainType, setDomainType] = useState<'incomplete' | 'complete' | null>(null);

  // Active Buffs State
  const [activeBuffs, setActiveBuffs] = useState<Ability[]>([]);

  // Helper functions for conditions
  const getConditionBorderColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'border-yellow-500/50';
      case 'moderate': return 'border-orange-500/50';
      case 'major': return 'border-red-500/50';
      case 'extreme': return 'border-purple-500/50';
      default: return 'border-slate-700';
    }
  };

  const getConditionSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30';
      case 'moderate': return 'bg-orange-600/20 text-orange-300 border border-orange-500/30';
      case 'major': return 'bg-red-600/20 text-red-300 border border-red-500/30';
      case 'extreme': return 'bg-purple-600/20 text-purple-300 border border-purple-500/30';
      default: return 'bg-slate-600/20 text-slate-300 border border-slate-500/30';
    }
  };

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

  useEffect(() => {
    if (!currentUser) {
      setActiveCombatCampaignIds([]);
      return;
    }
    if (!character?.id) {
      setActiveCombatCampaignIds([]);
      return;
    }

    const combatKey = `${currentUser.uid}_${character.id}`;
    const q = query(
      collection(db, 'campaigns'),
      where('activeCombatParticipantKeys', 'array-contains', combatKey)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveCombatCampaignIds(snapshot.docs.map(d => d.id));
    }, (error) => {
      console.error('Error listening active combats for current character:', error);
      setActiveCombatCampaignIds([]);
    });

    return () => unsubscribe();
  }, [currentUser, character?.id]);

  // Listener for Master updates (e.g. Round Advance)
  useEffect(() => {
      if (!currentUser || !character?.id || activeCombatCampaignIds.length === 0) return;
      
      // Listen to the first active campaign (assuming single combat focus)
      const campaignId = activeCombatCampaignIds[0];
      const key = `${currentUser.uid}_${character.id}`;
      const stateRef = doc(db, 'campaigns', campaignId, 'characterStates', key);

      const unsub = onSnapshot(stateRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          
          // Sync Domain State from Master
          // Only update if specifically changed to avoid overwriting local transient state unnecessarily
          if (data.domainRound !== undefined && data.domainRound !== domainRound) {
               setDomainRound(data.domainRound);
               // If Master advanced round and deducted PE, sync PE
               if (data.currentStats) {
                   setCurrentStats(prev => ({
                       ...prev,
                       pe: data.currentStats.pe,
                       ce: data.currentStats.ce
                   }));
               }
          }
          if (data.domainActive !== undefined && data.domainActive !== domainActive) {
               // If transitioning from Active to Inactive (Remote Close), apply Exhaustion
               if (domainActive && !data.domainActive) {
                   const turns = domainType === 'incomplete' ? 2 : 4;
                   const burnoutDebuff: Ability = {
                       id: Math.random().toString(36).substring(2, 9),
                       name: "Exaustão de Técnica",
                       description: `Técnica inata inutilizável por ${turns} turnos.`,
                       cost: "",
                       category: "Status"
                   };
                   setActiveBuffs(prev => [...prev, burnoutDebuff]);
                   setDomainType(null);
                   setDomainRound(0);
               }
               setDomainActive(data.domainActive);
          }
      });

      return () => unsub();
  }, [activeCombatCampaignIds, currentUser, character?.id, domainRound, domainActive]);

  useEffect(() => {
    if (!currentUser) return;
    if (!character?.id) return;
    if (activeCombatCampaignIds.length === 0) {
      lastSavedCombatMirrorRef.current = '';
      return;
    }

    const derived = calculateDerivedStats(character);
    const payload = {
      userId: currentUser.uid,
      characterId: character.id,
      characterName: character.name,
      level: character.level,
      imageUrl: character.imageUrl,
      currentStats,
      maxStats: { pv: derived.MaxPV, ce: derived.MaxCE, pe: derived.MaxPE },
      domainActive,
      domainRound,
      domainType,
      projectionStacks: character.projectionStacks,
      updatedAt: Date.now()
    };

    const json = JSON.stringify({ payload, activeCombatCampaignIds });
    if (json === lastSavedCombatMirrorRef.current) return;

    const timeoutId = setTimeout(async () => {
      try {
        const key = `${currentUser.uid}_${character.id}`;
        for (const campaignId of activeCombatCampaignIds) {
          const stateRef = doc(db, 'campaigns', campaignId, 'characterStates', key);
          await setDoc(stateRef, payload, { merge: true });
        }
        lastSavedCombatMirrorRef.current = json;
      } catch (error) {
        console.error('Error mirroring main sheet state to active combats:', error);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [activeCombatCampaignIds, character, currentStats, currentUser]);

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

  const handleToggleEquipWeapon = (weaponId: string) => {
    try {
      setCharacter(prev => {
        const equippedWeapons = prev.equippedWeapons || [];
        const isEquipped = equippedWeapons.includes(weaponId);
        const newEquippedWeapons = isEquipped
          ? equippedWeapons.filter(id => id !== weaponId)
          : [...equippedWeapons, weaponId];

        return {
          ...prev,
          equippedWeapons: newEquippedWeapons
        };
      });
    } catch (error) {
      console.error('Error toggling weapon equip:', error);
      alert('Erro ao equipar/desequipar arma. Tente novamente.');
    }
  };

  const handleAddSkill = () => {
    const newSkill: Skill = { id: Math.random().toString(36).substring(2, 9), name: "Nova Perícia", value: 0 };
    setCharacter(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
  };

  const handleRemoveSkill = (id: string) => {
    setCharacter(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
  };

  const handleArrayAdd = useCallback((field: 'abilities' | 'inventory', category?: string, template?: Partial<Item>) => {
    try {
    if (field === 'abilities') {
      if (category) setAbilityLibraryCategory(category);
      setShowAbilityLibrary(true);
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    let newItem;

    if (field === 'inventory') {
        newItem = {
          id,
          name: template?.name || "",
          quantity: 1,
          description: template?.description || "",
          ...(template?.attackSkill && { attackSkill: template.attackSkill })
        } as Item;
        console.log('Adding new inventory item:', newItem);
    } else {
      newItem = { id, name: "", cost: "", description: "", category: category || "Combatente" } as Ability;
    }

      setCharacter(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), newItem]
      }));
    } catch (error) {
      console.error('Error adding item:', error, { field, category, template });
      alert('Erro ao adicionar item. Tente novamente.');
    }
  }, []);

  // Character technique handlers
  const handleAddTechnique = (technique: Technique) => {
    setCharacter(prev => ({ ...prev, techniques: [...prev.techniques, technique] }));
  };

  const handleTechniqueUpdate = (id: string, field: keyof Technique, value: any) => {
    setCharacter(prev => ({ ...prev, techniques: prev.techniques.map(t => t.id === id ? { ...t, [field]: value } : t) }));
  };

  const handleTechniqueRemove = (id: string) => {
     setCharacter(prev => ({ ...prev, techniques: prev.techniques.filter(t => t.id !== id) }));
  };

  // User library technique handlers
  const handleAddTechniqueToLibrary = (technique: Technique) => {
    setUserTechniques(prev => [...prev, technique]);
  };

  const handleUpdateTechniqueInLibrary = (id: string, field: keyof Technique, value: any) => {
    setUserTechniques(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleRemoveTechniqueFromLibrary = (id: string) => {
    setUserTechniques(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTechniqueToCharacter = (technique: Technique) => {
    handleAddTechnique(technique);
    setShowTechniqueLibrary(false);
  };

  // User library inventory handlers
  const handleAddItemToLibrary = (item: Item) => {
    setUserInventoryItems(prev => [...prev, item]);
  };

  const handleUpdateItemInLibrary = (id: string, field: keyof Item, value: any) => {
    setUserInventoryItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleRemoveItemFromLibrary = (id: string) => {
    setUserInventoryItems(prev => prev.filter(i => i.id !== id));
  };

  const handleAddItemToCharacter = (item: Item) => {
    handleArrayAdd('inventory', undefined, item);
    setShowInventoryLibrary(false);
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

  const handleArrayUpdate = useCallback((field: 'abilities' | 'inventory', id: string, itemField: string, value: any) => {
    try {
      console.log('Updating item:', field, id, itemField, value);
      setCharacter(prev => {
        const currentItems = prev[field] || [];
        const updatedItems = currentItems.map((item: any) => {
          if (item.id === id) {
            const updatedItem = { ...item, [itemField]: value };
            console.log('Updated item:', updatedItem);
            return updatedItem;
          }
          return item;
        });

        return {
          ...prev,
          [field]: updatedItems
        };
      });
    } catch (error) {
      console.error('Error updating item:', error, { field, id, itemField, value });
      alert('Erro ao atualizar item. Tente novamente.');
    }
  }, []);

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

  const activateDomain = (type: 'incomplete' | 'complete', ceCost: number, reqLevel: number) => {
    // Activation Logic
    if (character.level < reqLevel) {
      alert(`Nível insuficiente! Requer nível ${reqLevel}.`);
        return;
      }

    if (currentStats.ce < ceCost) {
      alert(`CE insuficiente para Expandir Domínio! Você precisa de ${ceCost} CE.`);
      return;
    }

    consumeCE(ceCost);
      setDomainActive(true);
    setDomainType(type);
      setDomainRound(1);
  };

  const closeDomain = () => {
     // Burnout Logic
     const turns = domainType === 'incomplete' ? 2 : 4;
     const burnoutDebuff: Ability = {
       id: Math.random().toString(36).substring(2, 9),
       name: "Exaustão de Técnica",
       description: `Técnica inata inutilizável por ${turns} turnos.`,
       cost: "",
       category: "Status"
     };
     setActiveBuffs(prev => [...prev, burnoutDebuff]);

      setDomainActive(false);
      setDomainRound(0);
     setDomainType(null);
  };

  const advanceDomainRound = (force: boolean = false) => {
    const nextRound = domainRound + 1;
    let maintenanceCost = 0;

    // Check Duration Limits & Costs
    // Segundo as regras: manutenção começa APÓS 2 turnos
    if (domainType === 'incomplete') {
        if (nextRound > 2) {
            alert("Domínio Incompleto não pode exceder 2 rodadas!");
            closeDomain();
            return;
        }
        // Manutenção começa na rodada 3 (após 2 turnos)
        if (nextRound > 2) maintenanceCost = 50;
    } else if (domainType === 'complete') {
        if (nextRound > 5) {
            alert("Domínio Completo não pode exceder 5 rodadas!");
            closeDomain();
            return;
        }
        // Manutenção começa na rodada 3 (após 2 turnos)
        if (nextRound === 3) maintenanceCost = 50;
        else if (nextRound > 3) maintenanceCost = 50; // 50 PE por rodada de manutenção
    }

    // Process Maintenance
    if (maintenanceCost > 0) {
        if (!force) {
            // Logic handled by UI calling this with force=true
            return;
        }
        if (currentStats.pe < maintenanceCost) {
            alert(`PE Insuficiente para manter o domínio! Necessário: ${maintenanceCost} PE.`);
            closeDomain();
            return;
        }
        consumePE(maintenanceCost);
    }

    setDomainRound(nextRound);
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

      {showTechniqueLibrary && (
        <TechniqueLibrary 
          userTechniques={userTechniques}
          onAddToLibrary={handleAddTechniqueToLibrary}
          onUpdateInLibrary={handleUpdateTechniqueInLibrary}
          onRemoveFromLibrary={handleRemoveTechniqueFromLibrary}
          onAddToCharacter={handleAddTechniqueToCharacter}
          onClose={() => setShowTechniqueLibrary(false)}
        />
      )}

      {showInventoryLibrary && (
        <InventoryLibrary 
          userItems={userInventoryItems}
          onAddToLibrary={handleAddItemToLibrary}
          onUpdateInLibrary={handleUpdateItemInLibrary}
          onRemoveFromLibrary={handleRemoveItemFromLibrary}
          onAddToCharacter={handleAddItemToCharacter}
          onClose={() => setShowInventoryLibrary(false)}
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
            <CampaignManager currentUserChar={character} onUpdateCurrentUserChar={setCharacter} />
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
                <div className="flex-1 mt-2 p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-xs font-mono group relative">
                  <span className="text-slate-500 uppercase font-bold">Lim. (LL)</span>
                  <span className="text-curse-400 font-black text-lg">{stats.LL}</span>
                  <div className="hidden group-hover:flex absolute bottom-full left-0 mb-2 bg-slate-900 text-slate-100 text-xs px-3 py-2 border border-slate-700 shadow-xl max-w-[200px] whitespace-normal z-20">
                    <strong>Liberação (LL):</strong> Volume máximo de CE controlado. Concede bônus passivos em perícias físicas (+LL) e limita reforços corporais.
                  </div>
                </div>
                <div className="flex-1 mt-2 p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500 uppercase font-bold">Mov.</span>
                  <span className="text-emerald-400 font-black text-lg">{stats.Movement}m</span>
                </div>
              </div>
            </div>

      {/* Domain Expansion Control (Side Panel) */}
      <section className={`rounded-xl border ${borderColor} p-4 transition-all duration-150 ${domainActive ? 'bg-curse-950/30' : 'bg-slate-900/50'}`}>
              <div className="flex items-center gap-2 mb-4">
           <Skull size={20} className={domainActive ? "text-curse-400" : "text-slate-600"} />
                 <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Controle de Domínio</h2>
              </div>
              
              {!domainActive ? (
          <div className="flex flex-col gap-2">
            {[
              { label: 'Incompleto', type: 'incomplete', ce: 150, level: 10 },
              { label: 'Completo', type: 'complete', ce: 250, level: 16 },
            ].map((opt) => {
              const isDisabled = character.level < opt.level;
              return (
                    <button
                  key={opt.label}
                  disabled={isDisabled}
                  onClick={() => activateDomain(opt.type as any, opt.ce, opt.level)}
                  className={`py-2 px-3 flex justify-between items-center rounded-lg border text-xs font-bold transition-all duration-100
                    ${isDisabled
                      ? 'bg-slate-950/50 border-slate-800 text-slate-700 cursor-not-allowed'
                      : 'bg-slate-950 border-slate-700 hover:border-curse-500 text-slate-300 hover:text-white hover:bg-slate-900'
                    }
                  `}
                  title={isDisabled ? `Requer Nível ${opt.level}` : ""}
                >
                  <span className="uppercase tracking-wide">{opt.label}</span>
                  {isDisabled ? (
                     <span className="text-[10px] font-mono text-red-900 bg-red-950/20 px-1 rounded">Lv.{opt.level}</span>
                  ) : (
                     <span className="text-[10px] font-mono text-curse-400">{opt.ce} CE</span>
                  )}
                    </button>
              );
            })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
             <div className="p-3 bg-slate-950/50 rounded border border-slate-800 text-center">
                <div className="text-curse-400 text-xs font-bold uppercase mb-1">Domínio Ativo</div>
                <div className="text-white font-mono text-sm">
                  Rodada {domainRound} / {domainType === 'incomplete' ? 2 : 5}
                   </div>
                <div className="mt-2 text-[10px] text-slate-500">
                   Controles disponíveis na aba <strong>Combate</strong>.
                </div>
             </div>
             
                   <button 
              onClick={closeDomain}
              className="w-full py-2 bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                   >
               Encerrar
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
               {(['combat', 'abilities', 'techniques', 'inventory', 'progression', 'binding-vows', 'campaigns'] as Tab[]).map(tab => (
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
                   {tab === 'binding-vows' && 'Votos'}
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
                        onUpdateCharacter={handleCharUpdate}
                        domainActive={domainActive}
                        domainRound={domainRound}
                        domainType={domainType}
                        onAdvanceDomain={advanceDomainRound}
                        onCloseDomain={closeDomain}
                     />)
                     {/* Conditions Section */}
                     <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden mt-4">
                        <div className="p-4 border-b border-slate-800">
                           <h3 className="text-lg font-bold text-white">Condições Ativas</h3>
                           <p className="text-sm text-slate-400 mt-1">
                              Status negativos que afetam capacidades e defesas
                           </p>
                        </div>
                        <div className="p-4">
                           {character.conditions && character.conditions.length > 0 ? (
                              <div className="space-y-3">
                                 {character.conditions.map(condition => (
                                    <div key={condition.id} className={`border rounded-lg p-3 ${condition.isActive ? 'border-red-500/50' : 'border-slate-700 opacity-50'}`}>
                                       <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`font-bold ${condition.isActive ? 'text-white' : 'text-slate-500'}`}>{condition.name}</h4>
                                                <span className="text-xs px-2 py-0.5 rounded uppercase font-bold bg-red-600/20 text-red-300 border border-red-500/30">
                                                   {condition.severity}
                                                </span>
                                             </div>
                                             <p className="text-sm text-slate-300 mb-2">{condition.description}</p>
                                             <div className="space-y-1">
                                                {condition.effects.map((effect, idx) => (
                                                   <div key={idx} className="text-xs text-red-400 flex items-center gap-1">
                                                      <span>•</span>
                                                      <span>{effect}</span>
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                          <div className="flex flex-col gap-2 ml-4">
                                             <button
                                                onClick={() => {
                                                   setCharacter(prev => ({
                                                      ...prev,
                                                      conditions: prev.conditions?.map(c =>
                                                         c.id === condition.id ? { ...c, isActive: !c.isActive } : c
                                                      ) || []
                                                   }));
                                                }}
                                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                                   condition.isActive
                                                      ? 'bg-red-600 hover:bg-red-500 text-white'
                                                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                                }`}
                                             >
                                                {condition.isActive ? 'Ativo' : 'Inativo'}
                                             </button>
                                             <button
                                                onClick={() => {
                                                   if (confirm(`Remover a condição "${condition.name}"?`)) {
                                                      setCharacter(prev => ({
                                                         ...prev,
                                                         conditions: prev.conditions?.filter(c => c.id !== condition.id) || []
                                                      }));
                                                   }
                                                }}
                                                className="px-3 py-1 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                                             >
                                                Remover
                                             </button>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="text-center py-8">
                                 <div className="text-4xl mb-4">✅</div>
                                 <p className="text-slate-400">Nenhuma condição ativa</p>
                                 <p className="text-sm text-slate-500 mt-1">O personagem está em perfeitas condições</p>
                              </div>
                           )}
                           <div className="border-t border-slate-800 pt-4 mt-4">
                              <div className="grid grid-cols-2 gap-3">
                                 {[
                                    { name: "Atordoado", desc: "Não pode realizar ações", effects: ["Não pode agir", "-4 em defesas"], severity: 'major' as const },
                                    { name: "Indefeso", desc: "Não pode se defender", effects: ["Não pode usar reações", "-10 em defesas"], severity: 'extreme' as const },
                                    { name: "Vulnerável", desc: "Mais suscetível a danos", effects: ["+2 em rolagens de dano contra você"], severity: 'moderate' as const },
                                    { name: "Exausto", desc: "Fadiga extrema", effects: ["-2 em todos os testes", "-1 ação por turno"], severity: 'moderate' as const }
                                 ].map(cond => (
                                    <button
                                       key={cond.name}
                                       onClick={() => {
                                          const newCondition: Condition = {
                                             id: Math.random().toString(36).substring(2, 9),
                                             name: cond.name,
                                             description: cond.desc,
                                             effects: cond.effects,
                                             severity: cond.severity,
                                             isActive: true
                                          };
                                          setCharacter(prev => ({
                                             ...prev,
                                             conditions: [...(prev.conditions || []), newCondition]
                                          }));
                                       }}
                                       className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg transition-colors text-sm"
                                    >
                                       + {cond.name}
                                    </button>
                                 ))}
                                 <button
                                    onClick={() => {
                                       const newCondition: Condition = {
                                          id: Math.random().toString(36).substring(2, 9),
                                          name: "Condição Personalizada",
                                          description: "Descreva o efeito desta condição",
                                          effects: ["-2 em testes relacionados"],
                                          severity: 'minor',
                                          isActive: true
                                       };
                                       setCharacter(prev => ({
                                          ...prev,
                                          conditions: [...(prev.conditions || []), newCondition]
                                       }));
                                    }}
                                    className="py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-sm"
                                 >
                                    + Personalizada
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                        <div className="p-4 border-b border-slate-800">
                           <h3 className="text-lg font-bold text-white">Condições Ativas</h3>
                           <p className="text-sm text-slate-400 mt-1">
                              Status negativos que afetam capacidades e defesas
                           </p>
                        </div>
                           <div className="p-4">
                              {character.conditions && character.conditions.length > 0 ? (
                                 <div className="space-y-3">
                                    {character.conditions.map(condition => (
                                       <div key={condition.id} className={`border rounded-lg p-3 ${condition.isActive ? 'border-red-500/50' : 'border-slate-700 opacity-50'}`}>
                                          <div className="flex items-start justify-between">
                                             <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                   <h4 className={`font-bold ${condition.isActive ? 'text-white' : 'text-slate-500'}`}>{condition.name}</h4>
                                                   <span className="text-xs px-2 py-0.5 rounded uppercase font-bold bg-red-600/20 text-red-300 border border-red-500/30">
                                                      {condition.severity}
                                                   </span>
                                                   {condition.duration && (
                                                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                         {condition.duration} turnos
                                                      </span>
                                                   )}
                                                </div>
                                                <p className="text-sm text-slate-300 mb-2">{condition.description}</p>

                                                <div className="space-y-1">
                                                   {condition.effects.map((effect, idx) => (
                                                      <div key={idx} className="text-xs text-red-400 flex items-center gap-1">
                                                         <span>•</span>
                                                         <span>{effect}</span>
                                                      </div>
                                                   ))}
                                                </div>
                                             </div>

                                             <div className="flex flex-col gap-2 ml-4">
                                          <button
                                             onClick={() => {
                                                setCharacter(prev => ({
                                                   ...prev,
                                                   conditions: prev.conditions?.map(c =>
                                                      c.id === condition.id ? { ...c, isActive: !c.isActive } : c
                                                   ) || []
                                                }));
                                             }}
                                             className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                                condition.isActive
                                                   ? 'bg-red-600 hover:bg-red-500 text-white'
                                                   : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                             }`}
                                          >
                                             {condition.isActive ? 'Ativo' : 'Inativo'}
                                          </button>

                                          <button
                                             onClick={() => {
                                                if (confirm(`Remover a condição "${condition.name}"?`)) {
                                                   setCharacter(prev => ({
                                                      ...prev,
                                                      conditions: prev.conditions?.filter(c => c.id !== condition.id) || []
                                                   }));
                                                }
                                             }}
                                             className="px-3 py-1 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                                          >
                                             Remover
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="text-center py-8">
                              <div className="text-4xl mb-4">✅</div>
                              <p className="text-slate-400">Nenhuma condição ativa</p>
                              <p className="text-sm text-slate-500 mt-1">O personagem está em perfeitas condições</p>
                           </div>
                        )}

                        <div className="border-t border-slate-800 pt-4 mt-4">
                           <div className="grid grid-cols-2 gap-3">
                              {/* Quick Add Common Conditions */}
                              {[
                                 { name: "Atordoado", desc: "Não pode realizar ações", effects: ["Não pode agir", "-4 em defesas"], severity: 'major' as const },
                                 { name: "Indefeso", desc: "Não pode se defender", effects: ["Não pode usar reações", "-10 em defesas"], severity: 'extreme' as const },
                                 { name: "Vulnerável", desc: "Mais suscetível a danos", effects: ["+2 em rolagens de dano contra você"], severity: 'moderate' as const },
                                 { name: "Exausto", desc: "Fadiga extrema", effects: ["-2 em todos os testes", "-1 ação por turno"], severity: 'moderate' as const }
                              ].map(cond => (
                                 <button
                                    key={cond.name}
                                    onClick={() => {
                                       const newCondition: Condition = {
                                          id: Math.random().toString(36).substring(2, 9),
                                          name: cond.name,
                                          description: cond.desc,
                                          effects: cond.effects,
                                          severity: cond.severity,
                                          isActive: true
                                       };

                                       setCharacter(prev => ({
                                          ...prev,
                                          conditions: [...(prev.conditions || []), newCondition]
                                       }));
                                    }}
                                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg transition-colors text-sm"
                                 >
                                    + {cond.name}
                                 </button>
                              ))}

                              {/* Custom Condition */}
                              <button
                                 onClick={() => {
                                    const newCondition: Condition = {
                                       id: Math.random().toString(36).substring(2, 9),
                                       name: "Condição Personalizada",
                                       description: "Descreva o efeito desta condição",
                                       effects: ["-2 em testes relacionados"],
                                       severity: 'minor',
                                       isActive: true
                                    };

                                    setCharacter(prev => ({
                                       ...prev,
                                       conditions: [...(prev.conditions || []), newCondition]
                                    }));
                                 }}
                                 className="py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-sm"
                              >
                                 + Personalizada
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
                  </>
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
                    onOpenLibrary={() => setShowTechniqueLibrary(true)}
                 />
               )}
               {activeTab === 'inventory' && (
                 <InventoryList 
                   items={character.inventory}
                   onAdd={(template) => handleArrayAdd('inventory', undefined, template)}
                   onUpdate={(id, field, val) => handleArrayUpdate('inventory', id, field, val)}
                   onRemove={(id) => handleArrayRemove('inventory', id)}
                  onOpenLibrary={() => setShowInventoryLibrary(true)}
                  equippedWeapons={character.equippedWeapons}
                  onToggleEquip={handleToggleEquipWeapon}
                 />
               )}
               {activeTab === 'progression' && (
                  <LevelUpSummary char={character} onUpdateAptitude={handleAptitudeUpdate} />
               )}
               {activeTab === 'binding-vows' && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
                     <div className="p-4 border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                             <span className="text-xs font-bold text-white">V</span>
                           </div>
                           Votos Vinculativos
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                           Contratos autoimpostos que garantem benefícios em troca de restrições
                        </p>
                     </div>

                     <div className="flex-1 p-4 space-y-4">
                        {character.bindingVows && character.bindingVows.length > 0 ? (
                           character.bindingVows.map(vow => (
                              <div key={vow.id} className={`bg-slate-950 border rounded-lg p-4 ${vow.isActive ? 'border-purple-500/50' : 'border-slate-800 opacity-60'}`}>
                                 <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                       <h4 className="font-bold text-white">{vow.name}</h4>
                                       <p className="text-sm text-slate-300 mt-1">{vow.description}</p>

                                       <div className="mt-3 space-y-2">
                                          <div className="flex items-center gap-2">
                                             <span className="text-xs font-bold text-emerald-400">BENEFÍCIO:</span>
                                             <span className="text-sm text-slate-200">{vow.benefit}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                             <span className="text-xs font-bold text-red-400">RESTRIÇÃO:</span>
                                             <span className="text-sm text-slate-200">{vow.restriction}</span>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="flex flex-col gap-2 ml-4">
                                       <button
                                          onClick={() => {
                                             setCharacter(prev => ({
                                                ...prev,
                                                bindingVows: prev.bindingVows?.map(v =>
                                                   v.id === vow.id ? { ...v, isActive: !v.isActive } : v
                                                ) || []
                                             }));
                                          }}
                                          className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                             vow.isActive
                                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                          }`}
                                       >
                                          {vow.isActive ? 'Ativo' : 'Inativo'}
                                       </button>

                                       <button
                                          onClick={() => {
                                             if (confirm(`Remover o voto "${vow.name}"?`)) {
                                                setCharacter(prev => ({
                                                   ...prev,
                                                   bindingVows: prev.bindingVows?.filter(v => v.id !== vow.id) || []
                                                }));
                                             }
                                          }}
                                          className="px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                                       >
                                          Remover
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="text-center py-12">
                              <div className="text-4xl mb-4">📜</div>
                              <p className="text-slate-400">Nenhum Voto Vinculativo ativo</p>
                              <p className="text-sm text-slate-500 mt-1">Crie contratos autoimpostos para obter benefícios especiais</p>
                           </div>
                        )}

                        <div className="border-t border-slate-800 pt-4">
                           <button
                              onClick={() => {
                                 const newVow = {
                                    id: Math.random().toString(36).substring(2, 9),
                                    name: "Novo Voto Vinculativo",
                                    description: "Descreva seu contrato autoimposto",
                                    benefit: "Benefício garantido",
                                    restriction: "Restrição imposta",
                                    isActive: false,
                                    createdAt: Date.now()
                                 };

                                 setCharacter(prev => ({
                                    ...prev,
                                    bindingVows: [...(prev.bindingVows || []), newVow]
                                 }));
                              }}
                              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                           >
                              <span>+</span>
                              Novo Voto Vinculativo
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>

          </section>

        </div>
      </main>
      )}
      
      {/* Version Footer */}
      <footer className="fixed bottom-2 right-2 pointer-events-none z-10">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-1 shadow-lg">
          <span className="text-xs text-slate-300 font-mono select-none font-semibold">
            Jujutsu RPG v{APP_VERSION}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
