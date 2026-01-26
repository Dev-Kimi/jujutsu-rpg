import React, { useState, useEffect, useRef } from 'react';
import { AptitudeLevels, Campaign, CampaignParticipant, Character, CurrentStats, DiceRollLog as DiceRollLogType, Ability, Technique } from '../types';
import { Users, Plus, Play, Eye, ArrowLeft, Crown, Shield, X, MapPin, Trash2, UserMinus, Edit2, Save, Dices, RefreshCw, Square } from 'lucide-react';
import { db, auth } from '../firebase'; // Ensure you have this configured
import { collection, addDoc, updateDoc, arrayUnion, arrayRemove, query, onSnapshot, doc, getDoc, deleteDoc, orderBy, setDoc, where, limit, writeBatch } from 'firebase/firestore';
import { CharacterAttributes } from './CharacterAttributes';
import { StatBar } from './StatBar';
import { SkillList } from './SkillList';
import { AccordionList } from './AccordionList';
import { InventoryList } from './InventoryList';
import { BindingVowsManager } from './BindingVowsManager';
import { CombatTabs } from './CombatTabs';
import { TechniqueManager } from './TechniqueManager';
import { LevelUpSummary } from './LevelUpSummary';
import { MasterCombatTracker } from './MasterCombatTracker';
import { calculateDerivedStats, parseAbilityEffect, parseAbilitySkillTrigger } from '../utils/calculations';
import { DiceRollLog } from './DiceRollLog';

interface CampaignManagerProps {
  currentUserChar: Character;
  savedCharacters: Character[];
  initialSelectedCampaignId?: string | null;
  onRequestAddCharacterToCampaign?: (payload: {
    campaignId: string;
    eligibleCharacterIds: string[];
    selectedCharacterId: string;
  }) => void;
  onUpdateCurrentUserChar?: (nextChar: Character) => void;
}

type SheetTab = 'combat' | 'abilities' | 'techniques' | 'inventory' | 'progression' | 'binding-vows';

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  currentUserChar,
  savedCharacters,
  initialSelectedCampaignId,
  onRequestAddCharacterToCampaign,
  onUpdateCurrentUserChar
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'sheet' | 'combat'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  
  // Sheet State
  const [viewingChar, setViewingChar] = useState<Character | null>(null);
  const [viewingStats, setViewingStats] = useState<CurrentStats>({ pv: 0, ce: 0, pe: 0 });
  const [viewingParticipant, setViewingParticipant] = useState<CampaignParticipant | null>(null);
  const [showDiceLog, setShowDiceLog] = useState(false);
  const [activeRollResult, setActiveRollResult] = useState<'skill' | 'combat' | null>(null);
  const [sheetTab, setSheetTab] = useState<SheetTab>('combat');
  const [abilitiesRctView, setAbilitiesRctView] = useState<'padrao' | 'rct'>('padrao');
  const [activeBuffs, setActiveBuffs] = useState<Ability[]>([]);

  const [combatRolls, setCombatRolls] = useState<DiceRollLogType[]>([]);

  const [showCombatSetup, setShowCombatSetup] = useState(false);
  const [combatSelectedKeys, setCombatSelectedKeys] = useState<Record<string, boolean>>({});
  const [activeCombatParticipants, setActiveCombatParticipants] = useState<CampaignParticipant[]>([]);
  const [isPreparingCombat, setIsPreparingCombat] = useState(false);
  const [isProcessingRound, setIsProcessingRound] = useState(false);

  const [showAddCharacterPrompt, setShowAddCharacterPrompt] = useState(false);
  const [addCharacterId, setAddCharacterId] = useState<string>('');

  const lastSavedCharRef = useRef<string>('');
  const lastSavedStatsRef = useRef<string>('');

  useEffect(() => {
    if (sheetTab !== 'abilities') {
      setAbilitiesRctView('padrao');
    }
  }, [sheetTab]);

  // 1. Fetch Campaigns
  useEffect(() => {
    const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const camps: Campaign[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Campaign));
      setCampaigns(camps);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedCampaign) return;
    const updated = campaigns.find(c => c.id === selectedCampaign.id);
    if (!updated) return;
    setSelectedCampaign(updated);
  }, [campaigns, selectedCampaign]);

  useEffect(() => {
    if (!initialSelectedCampaignId) return;
    if (view !== 'list') return;
    if (selectedCampaign?.id === initialSelectedCampaignId) {
      setView('detail');
      return;
    }
    const target = campaigns.find(c => c.id === initialSelectedCampaignId);
    if (!target) return;
    setSelectedCampaign(target);
    setView('detail');
  }, [initialSelectedCampaignId, campaigns, view, selectedCampaign?.id]);

  useEffect(() => {
    if (!selectedCampaign) return;
    if (!selectedCampaign.activeCombatActive) return;
    if (!selectedCampaign.activeCombatParticipants) return;
    if (selectedCampaign.activeCombatParticipants.length === 0) return;
    setActiveCombatParticipants(selectedCampaign.activeCombatParticipants);
  }, [selectedCampaign]);

  useEffect(() => {
    if (view !== 'combat') {
      setCombatRolls([]);
      return;
    }
    if (!selectedCampaign) return;

    const q = query(
      collection(db, 'diceRolls'),
      where('campaignId', '==', selectedCampaign.id),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DiceRollLogType, 'id'>)
      } as DiceRollLogType));
      setCombatRolls(next);
    }, (error) => {
      console.error('Error fetching combat dice rolls:', error);
    });

    return () => unsubscribe();
  }, [view, selectedCampaign]);

  // 2. Actions
  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    if (!auth.currentUser) return alert("Você precisa estar logado.");

    try {
      await addDoc(collection(db, "campaigns"), {
        name: newCampaignName,
        description: newCampaignDesc,
        gmId: auth.currentUser.uid,
        participants: [],
        participantIds: [auth.currentUser.uid],
        createdAt: Date.now()
      });
      setNewCampaignName('');
      setNewCampaignDesc('');
      // UI stays on list, subscription updates it
    } catch (error) {
      console.error("Error creating campaign", error);
      alert("Erro ao criar campanha.");
    }
  };

  const handleJoinCampaign = async (campaign: Campaign) => {
    if (!auth.currentUser) return alert("Faça login.");
    
    // Check if already in
    const alreadyIn = campaign.participants.some(p => p.userId === auth.currentUser?.uid && p.characterId === currentUserChar.id);
    if (alreadyIn) return alert("Este personagem já está nesta campanha.");

    const newParticipant: CampaignParticipant = {
      userId: auth.currentUser.uid,
      characterId: currentUserChar.id,
      characterName: currentUserChar.name,
      characterClass: currentUserChar.characterClass,
      level: currentUserChar.level,
      imageUrl: currentUserChar.imageUrl
    };

    try {
      const campRef = doc(db, "campaigns", campaign.id);
      await updateDoc(campRef, {
        participants: arrayUnion(newParticipant),
        participantIds: arrayUnion(auth.currentUser.uid)
      });

      try {
        const stats = calculateDerivedStats(currentUserChar);
        const key = `${newParticipant.userId}_${newParticipant.characterId}`;
        const stateRef = doc(db, 'campaigns', campaign.id, 'characterStates', key);
        await setDoc(stateRef, {
          userId: newParticipant.userId,
          characterId: newParticipant.characterId,
          characterName: newParticipant.characterName,
          level: newParticipant.level,
          imageUrl: newParticipant.imageUrl,
          characterClass: currentUserChar.characterClass,
          origin: currentUserChar.origin,
          pre: currentUserChar.attributes.PRE,
          currentStats: { pv: stats.MaxPV, ce: stats.MaxCE, pe: stats.MaxPE },
          maxStats: { pv: stats.MaxPV, ce: stats.MaxCE, pe: stats.MaxPE },
          actionState: { standard: true, movement: 2, reactionPenalty: 0 },
          updatedAt: Date.now()
        }, { merge: true });
      } catch (error) {
        console.error('Error creating campaign character state', error);
      }

      // Local update for immediate feedback (though snapshot handles it)
      setSelectedCampaign({
        ...campaign,
        participants: [...campaign.participants, newParticipant]
      });
    } catch (error) {
      console.error("Error joining", error);
    }
  };

  useEffect(() => {
    if (!selectedCampaign) return;
    if (view !== 'sheet') return;
    if (!viewingParticipant) return;
    if (!viewingChar) return;
    if (!auth.currentUser) return;

    const isSelf = viewingParticipant.userId === auth.currentUser.uid;
    if (!isSelf) return;

    const derived = calculateDerivedStats(viewingChar);
    const payload = {
      userId: viewingParticipant.userId,
      characterId: viewingParticipant.characterId,
      characterName: viewingChar.name,
      level: viewingChar.level,
      imageUrl: viewingChar.imageUrl,
      characterClass: viewingChar.characterClass,
      origin: viewingChar.origin,
      pre: viewingChar.attributes.PRE,
      currentStats: viewingStats,
      maxStats: { pv: derived.MaxPV, ce: derived.MaxCE, pe: derived.MaxPE },
      updatedAt: Date.now()
    };

    const json = JSON.stringify(payload);
    if (json === lastSavedStatsRef.current) return;

    const timeoutId = setTimeout(async () => {
      try {
        const key = `${viewingParticipant.userId}_${viewingParticipant.characterId}`;
        const stateRef = doc(db, 'campaigns', selectedCampaign.id, 'characterStates', key);
        await setDoc(stateRef, payload, { merge: true });
        lastSavedStatsRef.current = json;
      } catch (error) {
        console.error('Error saving campaign currentStats', error);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [selectedCampaign, view, viewingParticipant, viewingChar, viewingStats]);

  const handleViewCharacter = async (participant: CampaignParticipant) => {
    if (!selectedCampaign) return;
    
    const isGM = selectedCampaign.gmId === auth.currentUser?.uid;
    const isSelf = participant.userId === auth.currentUser?.uid;
    
    // Only GM can view other players' sheets
    if (!isSelf && !isGM) {
      alert("Apenas o Mestre da Campanha pode visualizar as fichas dos participantes.");
      return;
    }
    
    // If it's me, use the currentUserChar directly
    if (isSelf) {
        // Check if the character ID matches
        if (currentUserChar.id === participant.characterId) {
            setViewingChar(currentUserChar);
            const stats = calculateDerivedStats(currentUserChar);
            let nextStats: CurrentStats = { pv: stats.MaxPV, ce: stats.MaxCE, pe: stats.MaxPE };
            try {
              const key = `${participant.userId}_${participant.characterId}`;
              const stateRef = doc(db, 'campaigns', selectedCampaign.id, 'characterStates', key);
              const snap = await getDoc(stateRef);
              const data = snap.exists() ? (snap.data() as any) : undefined;
              if (data?.currentStats) {
                nextStats = data.currentStats as CurrentStats;
              }
            } catch (error) {
              console.error('Error loading currentStats for self in campaign sheet', error);
            }
            setViewingStats(nextStats);
            setViewingParticipant(participant);
            lastSavedCharRef.current = JSON.stringify(currentUserChar);
            setSheetTab('combat');
            setAbilitiesRctView('padrao');
            setActiveBuffs([]);
            setView('sheet');
            return;
        } else {
            alert("O personagem selecionado na campanha não corresponde ao personagem atual.");
            return;
        }
    }

    // GM viewing another player's sheet
    try {
        const userDocRef = doc(db, "users", participant.userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // Check if savedCharacters exists and is an array
            const characters = (userData.savedCharacters as Character[]) || [];
            
            if (!Array.isArray(characters) || characters.length === 0) {
                alert("O jogador não possui personagens salvos no banco de dados.");
                return;
            }
            
            const target = characters.find(c => c.id === participant.characterId);
            
            if (target) {
                setViewingChar(target);
                const stats = calculateDerivedStats(target);
                // For read-only, we assume full health/resources or you'd need to sync CurrentStats to Firestore too.
                // Here we set to MAX for display purposes.
                setViewingStats({ pv: stats.MaxPV, ce: stats.MaxCE, pe: stats.MaxPE });
                setViewingParticipant(participant);
                lastSavedCharRef.current = JSON.stringify(target);
                setSheetTab('combat');
                setAbilitiesRctView('padrao');
                setActiveBuffs([]);
                setView('sheet');
            } else {
                alert(`Personagem com ID "${participant.characterId}" não encontrado no banco de dados do jogador.`);
            }
        } else {
            alert("Dados do jogador não encontrados. O jogador pode não ter criado nenhum personagem ainda.");
        }
    } catch (error) {
        console.error("Error fetching character", error);
        alert("Erro ao carregar ficha: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSaveCharacterToUser = async (userId: string, characterToSave: Character) => {
    if (!selectedCampaign) return;
    
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const characters = (userData.savedCharacters as Character[]) || [];
        
        // Update the character in the array
        const updatedCharacters = characters.map(c => 
          c.id === characterToSave.id ? characterToSave : c
        );
        
        // Save back to Firestore
        await setDoc(userDocRef, {
          ...userData,
          savedCharacters: updatedCharacters
        }, { merge: true });
        
        // Update participant info in campaign if name/level changed
        const campRef = doc(db, "campaigns", selectedCampaign.id);
        const updatedParticipants = selectedCampaign.participants.map(p => 
          p.userId === userId && p.characterId === characterToSave.id
            ? { ...p, characterName: characterToSave.name, level: characterToSave.level, characterClass: characterToSave.characterClass }
            : p
        );
        
        await updateDoc(campRef, {
          participants: updatedParticipants
        });
        
        // Update local state
        setSelectedCampaign({
          ...selectedCampaign,
          participants: updatedParticipants
        });
      }
    } catch (error) {
      console.error("Error saving character", error);
    }
  };

  useEffect(() => {
    if (!viewingChar || !viewingParticipant || view !== 'sheet') return;
    if (!auth.currentUser) return;

    const isSelf = viewingParticipant.userId === auth.currentUser.uid;
    if (isSelf) return;
    if (!selectedCampaign) return;
    const isGM = selectedCampaign.gmId === auth.currentUser.uid;
    if (!isGM) return;

    const json = JSON.stringify(viewingChar);
    if (json === lastSavedCharRef.current) return;

    const timeoutId = setTimeout(async () => {
      await handleSaveCharacterToUser(viewingParticipant.userId, viewingChar);
      lastSavedCharRef.current = json;
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [viewingChar, viewingParticipant, view, selectedCampaign]);

  useEffect(() => {
    if (!viewingParticipant) return;
    if (!auth.currentUser) return;
    const isSelf = viewingParticipant.userId === auth.currentUser.uid;
    if (!isSelf) return;
    if (view !== 'sheet') return;
    setViewingChar(currentUserChar);
  }, [currentUserChar, viewingParticipant, view]);

  const handleRemoveParticipant = async (campaign: Campaign, participant: CampaignParticipant) => {
    if (!auth.currentUser) return alert("Faça login.");
    
    // Only GM or the participant themselves can remove
    const isGM = campaign.gmId === auth.currentUser.uid;
    const isSelf = participant.userId === auth.currentUser.uid;
    
    if (!isGM && !isSelf) {
      alert("Apenas o Mestre da Campanha ou o próprio jogador podem remover participantes.");
      return;
    }

    if (!confirm(`Tem certeza que deseja remover ${participant.characterName} da campanha?`)) {
      return;
    }

    try {
      const campRef = doc(db, "campaigns", campaign.id);
      await updateDoc(campRef, {
        participants: arrayRemove(participant),
        participantIds: arrayRemove(participant.userId)
      });
      // Update local state immediately
      if (selectedCampaign && selectedCampaign.id === campaign.id) {
        setSelectedCampaign({
          ...selectedCampaign,
          participants: selectedCampaign.participants.filter(p => 
            !(p.userId === participant.userId && p.characterId === participant.characterId)
          )
        });
      }
    } catch (error) {
      console.error("Error removing participant", error);
      alert("Erro ao remover participante.");
    }
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (!auth.currentUser) return alert("Faça login.");
    
    if (campaign.gmId !== auth.currentUser.uid) {
      alert("Apenas o criador da campanha pode deletá-la.");
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar a campanha "${campaign.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const campRef = doc(db, "campaigns", campaign.id);
      await deleteDoc(campRef);
      // If we're viewing this campaign, go back to list
      if (selectedCampaign && selectedCampaign.id === campaign.id) {
        setView('list');
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error("Error deleting campaign", error);
      alert("Erro ao deletar campanha.");
    }
  };

  const updateViewingChar = (updater: (prev: Character) => Character) => {
    setViewingChar(prev => {
       if (!prev) return null;
       return updater(prev);
    });
  };

  // Sync viewingChar changes to parent (currentUserChar) if it's the user's character
  useEffect(() => {
    if (!viewingChar || !viewingParticipant || !auth.currentUser) return;
    const isSelf = viewingParticipant.userId === auth.currentUser.uid;
    if (isSelf && onUpdateCurrentUserChar) {
      onUpdateCurrentUserChar(viewingChar);
    }
  }, [viewingChar]);

  const handleCharUpdate = (field: keyof Character | Partial<Character>, value?: any) => {
    if (typeof field === 'object') {
        updateViewingChar(prev => ({ ...prev, ...field }));
    } else {
        updateViewingChar(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAttributeUpdate = (attr: keyof import('../types').Attributes, val: number) => {
    updateViewingChar(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: val }
    }));
  };

  const handleSkillUpdate = (id: string, field: keyof import('../types').Skill, value: any) => {
    updateViewingChar(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleAddSkill = () => {
    const newSkill: import('../types').Skill = {
      id: Math.random().toString(36).substring(2, 9),
      name: "Nova Perícia",
      value: 0
    };
    updateViewingChar(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
  };

  const handleRemoveSkill = (id: string) => {
    updateViewingChar(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== id)
    }));
  };

  const handleArrayUpdate = (field: 'abilities' | 'inventory', id: string, itemField: string, value: any) => {
    updateViewingChar(prev => ({
      ...prev,
      [field]: prev[field].map((item: any) => item.id === id ? { ...item, [itemField]: value } : item)
    }));
  };

  const handleArrayAdd = (field: 'abilities' | 'inventory', category?: string, template?: Partial<import('../types').Item>) => {
    const id = Math.random().toString(36).substring(2, 9);
    let newItem;
    if (field === 'inventory') {
      newItem = { id, name: template?.name || "", quantity: 1, description: template?.description || "" } as import('../types').Item;
    } else {
      newItem = { id, name: "", cost: "", description: "", category: category || "Combatente" } as import('../types').Ability;
    }
    updateViewingChar(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
  };

  const handleArrayRemove = (field: 'abilities' | 'inventory', id: string) => {
    updateViewingChar(prev => ({
      ...prev,
      [field]: prev[field].filter((item: any) => item.id !== id)
    }));
  };

  const handleToggleEquipWeapon = (weaponId: string) => {
    updateViewingChar(prev => {
      const equippedWeapons = prev.equippedWeapons || [];
      const isEquipped = equippedWeapons.includes(weaponId);
      const newEquippedWeapons = isEquipped
        ? equippedWeapons.filter(id => id !== weaponId)
        : [...equippedWeapons, weaponId];
      return { ...prev, equippedWeapons: newEquippedWeapons };
    });
  };

  const handleAptitudeUpdate = (category: keyof AptitudeLevels, level: number) => {
    updateViewingChar(prev => ({
      ...prev,
      aptitudes: {
        ...(prev.aptitudes || {}),
        [category]: level
      }
    }));
  };

  const handleAddTechnique = (technique: Technique) => {
    updateViewingChar(prev => ({
      ...prev,
      techniques: [...(prev.techniques || []), technique]
    }));
  };

  const handleTechniqueUpdate = (id: string, field: keyof Technique, value: any) => {
    updateViewingChar(prev => ({
      ...prev,
      techniques: (prev.techniques || []).map(t => (t.id === id ? { ...t, [field]: value } : t))
    }));
  };

  const handleTechniqueRemove = (id: string) => {
    updateViewingChar(prev => ({
      ...prev,
      techniques: (prev.techniques || []).filter(t => t.id !== id)
    }));
  };

  const handleUseAbility = (cost: { pe: number; ce: number }, abilityName: string, abilityId?: string) => {
    if (!viewingChar) return false;
    const ability = abilityId
      ? viewingChar.abilities.find(a => a.id === abilityId)
      : viewingChar.abilities.find(a => a.name === abilityName);

    if (!ability) return false;

    const effects = parseAbilityEffect(ability.description || '');
    const hasCombatBuff = effects.attack > 0 || effects.defense > 0;
    const skillTrigger = parseAbilitySkillTrigger(ability.description || '');
    const shouldQueue = hasCombatBuff || skillTrigger;

    if (shouldQueue) {
      const isAlreadyActive = activeBuffs.some(b => b.id === ability.id);
      if (isAlreadyActive) {
        setActiveBuffs(prev => prev.filter(b => b.id !== ability.id));
        return false;
      }

      if (viewingStats.pe < cost.pe) {
        alert(`PE Insuficiente para usar ${abilityName}! Necessário: ${cost.pe}, Atual: ${viewingStats.pe}`);
        return false;
      }
      if (viewingStats.ce < cost.ce) {
        alert(`CE Insuficiente para usar ${abilityName}! Necessário: ${cost.ce}, Atual: ${viewingStats.ce}`);
        return false;
      }

      setViewingStats(prev => ({
        ...prev,
        pe: Math.max(0, prev.pe - cost.pe),
        ce: Math.max(0, prev.ce - cost.ce)
      }));

      setActiveBuffs(prev => [...prev, { ...ability, paid: true }]);
      return true;
    }

    if (viewingStats.pe < cost.pe) {
      alert(`PE Insuficiente para usar ${abilityName}! Necessário: ${cost.pe}, Atual: ${viewingStats.pe}`);
      return false;
    }
    if (viewingStats.ce < cost.ce) {
      alert(`CE Insuficiente para usar ${abilityName}! Necessário: ${cost.ce}, Atual: ${viewingStats.ce}`);
      return false;
    }

    setViewingStats(prev => ({
      ...prev,
      pe: Math.max(0, prev.pe - cost.pe),
      ce: Math.max(0, prev.ce - cost.ce)
    }));

    return true;
  };

  const handleConsumeBuffs = (buffsToConsume: Ability[]) => {
    setActiveBuffs(prev => prev.filter(a => !buffsToConsume.some(b => b.id === a.id)));
  };

  const handleAdvanceRound = async () => {
    if (!selectedCampaign) return;
    if (activeCombatParticipants.length === 0) return;

    setIsProcessingRound(true);
    try {
      const refs = activeCombatParticipants.map((p) => {
        const key = `${p.userId}_${p.characterId}`;
        return {
          key,
          p,
          ref: doc(db, 'campaigns', selectedCampaign.id, 'characterStates', key)
        };
      });

      const snaps = await Promise.all(refs.map(({ ref }) => getDoc(ref)));

      const batch = writeBatch(db);
      const now = Date.now();

      snaps.forEach((snap, idx) => {
        const { ref, p } = refs[idx];
        const data = snap.exists() ? (snap.data() as any) : undefined;

        const current: CurrentStats = data?.currentStats || { pv: 0, ce: 0, pe: 0 };
        const max: CurrentStats = data?.maxStats || current;
        const level: number = data?.level ?? p.level ?? 0;
        const pre: number = data?.pre ?? data?.attributes?.PRE ?? 0;
        const characterClass: string | undefined = data?.characterClass ?? p.characterClass;
        const origin: string | undefined = data?.origin;
        const isRestrictionCelestial = characterClass === 'Restrição Celestial' || origin === 'Restrição Celestial';

        const unconscious = current.pv <= 0;

        let nextCE = current.ce;
        let nextPE = current.pe;

        if (!unconscious) {
          if (isRestrictionCelestial) {
            nextCE = 0;
          } else {
            const recovered = level + pre;
            nextCE = Math.min(current.ce + recovered, max.ce ?? current.ce + recovered);
          }

          nextPE = Math.min(current.pe + 1, max.pe ?? current.pe + 1);
        }

        // --- Domain Maintenance Logic (Master Auto-Process) ---
        // "Se um domínio for mantido à força, a dedução de PE deve ser processada automaticamente no início do turno."
        let nextDomainActive = data?.domainActive;
        let nextDomainRound = data?.domainRound;
        const domainType = data?.domainType;

        if (nextDomainActive && nextDomainRound !== undefined) {
           const potentialRound = nextDomainRound + 1;
           let cost = 0;
           let shouldClose = false;

           if (domainType === 'incomplete') {
               if (potentialRound > 2) shouldClose = true;
               else if (potentialRound === 2) cost = 50;
           } else if (domainType === 'complete') {
               if (potentialRound > 5) shouldClose = true;
               else if (potentialRound === 4) cost = 50;
               else if (potentialRound === 5) cost = 100;
           }

           if (shouldClose) {
               nextDomainActive = false;
               nextDomainRound = 0;
           } else if (cost > 0) {
               if (nextPE >= cost) {
                   nextPE -= cost;
                   nextDomainRound = potentialRound;
               } else {
                   // Insufficient PE to maintain
                   nextDomainActive = false;
                   nextDomainRound = 0;
               }
           } else {
               // Free round advance
               nextDomainRound = potentialRound;
           }
        }

        const updates: any = {
          currentStats: {
            ...current,
            ce: nextCE,
            pe: nextPE
          },
          actionState: { standard: true, movement: 2, reactionPenalty: 0 },
          updatedAt: now
        };

        if (nextDomainActive !== undefined) updates.domainActive = nextDomainActive;
        if (nextDomainRound !== undefined) updates.domainRound = nextDomainRound;

        batch.set(ref, updates, { merge: true });
      });

      await batch.commit();
      alert('Rodada processada: Recursos regenerados e ações resetadas.');
    } catch (error) {
      console.error('Error processing round batch:', error);
      alert('Erro ao processar rodada. Veja o console para detalhes.');
    } finally {
      setIsProcessingRound(false);
    }
  };

  // --- RENDERERS ---

  if (view === 'combat' && selectedCampaign) {
    const isGM = selectedCampaign.gmId === auth.currentUser?.uid;
    if (!isGM) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 pb-20">
          <button
            onClick={() => setView('detail')}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
            Acesso restrito ao Mestre.
          </div>
        </div>
      );
    }

    const handleEndCombat = async () => {
        if (!selectedCampaign) return;
        if (!confirm("ATENÇÃO: Deseja realmente encerrar o combate? Isso desativará o modo de combate para todos.")) return;

        try {
            const campRef = doc(db, 'campaigns', selectedCampaign.id);
            await updateDoc(campRef, {
                activeCombatActive: false,
                activeCombatParticipants: [],
                activeCombatParticipantKeys: []
            });
            setActiveCombatParticipants([]);
            setView('detail');
        } catch (error) {
            console.error("Error ending combat", error);
            alert("Erro ao encerrar combate.");
        }
    };

    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 pb-20">
        <div className="sticky top-0 z-20 bg-slate-900 border-curse-500 border-b p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('detail')}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">Painel de Combate</h2>
              <div className="text-xs text-slate-500">{selectedCampaign.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
               onClick={handleEndCombat}
               className="bg-red-900/50 hover:bg-red-800/80 text-red-200 px-3 py-2 rounded-lg flex items-center gap-2 border border-red-500/30 transition-all font-bold text-xs uppercase tracking-wider mr-4"
               title="Encerrar Combate Definitivamente"
            >
               <Square size={14} fill="currentColor" /> Encerrar Combate
            </button>
            <div className="h-8 w-px bg-slate-800 mx-2"></div>
            <button
              onClick={handleAdvanceRound}
              disabled={isProcessingRound || activeCombatParticipants.length === 0}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                (isProcessingRound || activeCombatParticipants.length === 0)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Encerrar Rodada / Próxima Rodada"
            >
              <RefreshCw size={18} className={isProcessingRound ? 'animate-spin' : ''} />
              {isProcessingRound ? 'Processando...' : 'Encerrar Rodada'}
            </button>
            <button
              onClick={() => {
                setView('detail');
              }}
              className="text-slate-400 hover:text-white flex items-center gap-2"
            >
              <X />
            </button>
          </div>
        </div>

        {activeCombatParticipants.length === 0 ? (
          <div className="text-center text-slate-500 italic py-12">
            Nenhum participante selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8">
              <MasterCombatTracker
                campaignId={selectedCampaign.id}
                participants={activeCombatParticipants}
              />
            </div>
            <div className="xl:col-span-4 space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Dices size={16} className="text-curse-400" /> Log de Dados
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">Últimos 100</div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3">
                  {combatRolls
                    .filter(r => activeCombatParticipants.some(p => p.userId === r.userId && p.characterName === r.characterName))
                    .slice(0, 60)
                    .map((roll) => (
                      <div
                        key={roll.id}
                        className="bg-slate-900/30 border border-slate-800 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{roll.characterName}</span>
                          <span className="text-curse-400 font-semibold text-sm">{roll.rollName}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {roll.breakdown || `[${roll.rolls.join(', ')}] = ${roll.total}`}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono mt-2">
                          {new Date(roll.timestamp).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'sheet' && viewingChar) {
     const stats = calculateDerivedStats(viewingChar);
     const consumeCE = (amount: number) => {
       setViewingStats(prev => ({ ...prev, ce: Math.max(0, prev.ce - amount) }));
     };
     const consumePE = (amount: number) => {
       setViewingStats(prev => ({ ...prev, pe: Math.max(0, prev.pe - amount) }));
     };
     const consumePV = (amount: number) => {
       setViewingStats(prev => ({ ...prev, pv: Math.max(0, prev.pv - amount) }));
     };
     
     return (
        <div className="animate-in slide-in-from-bottom-5 duration-300 pb-20">
           {/* Header */}
           <div className="sticky top-0 z-20 bg-slate-900 border-curse-500 border-b p-4 flex items-center justify-between shadow-lg">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setView('detail');
                      setViewingParticipant(null);
                    }} 
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                  >
                     <ArrowLeft />
                  </button>
                  <div>
                     <h2 className="text-xl font-bold text-white">{viewingChar.name}</h2>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setView('detail');
                      setViewingParticipant(null);
                    }} 
                    className="text-slate-400 hover:text-white"
                  >
                     <X />
                  </button>
               </div>
           </div>
           
           <div className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-start">
               {/* Identity & Stats */}
               <section className="md:col-span-1 xl:col-span-3 space-y-6">
                  <CharacterAttributes 
                     char={viewingChar} 
                     onUpdate={handleCharUpdate}
                     onUpdateAttribute={handleAttributeUpdate}
                     campaignId={selectedCampaign?.id}
                  />
                  <div className="space-y-1 opacity-90">
                     <StatBar 
                       label="Vida (PV)" 
                       current={viewingStats.pv} 
                       max={stats.MaxPV} 
                       colorClass="bg-blood-500" 
                       onChange={(v) => setViewingStats({ ...viewingStats, pv: v })}
                     />
                     <StatBar 
                       label="Energia (CE)" 
                       current={viewingStats.ce} 
                       max={stats.MaxCE} 
                       colorClass="bg-curse-500" 
                       onChange={(v) => setViewingStats({ ...viewingStats, ce: v })}
                     />
                     <StatBar 
                       label="Esforço (PE)" 
                       current={viewingStats.pe} 
                       max={stats.MaxPE} 
                       colorClass="bg-orange-500" 
                       onChange={(v) => setViewingStats({ ...viewingStats, pe: v })}
                     />
                  </div>
               </section>

               {/* Skills */}
               <section className="md:col-span-1 xl:col-span-5">
                  <SkillList 
                    char={viewingChar} 
                    onUpdateSkill={handleSkillUpdate}
                    onAddSkill={handleAddSkill}
                    onRemoveSkill={handleRemoveSkill}
                    campaignId={selectedCampaign?.id}
                    activeBuffs={activeBuffs}
                    onConsumeBuff={handleConsumeBuffs}
                    currentStats={viewingStats}
                    consumePE={consumePE}
                    consumeCE={consumeCE}
                    activeRollResult={activeRollResult}
                    setActiveRollResult={setActiveRollResult}
                  />
               </section>

               {/* Tabs */}
               <section className="md:col-span-2 xl:col-span-4 flex flex-col gap-4">
                  <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pb-2">
                    {(['combat', 'abilities', 'techniques', 'inventory', 'progression', 'binding-vows'] as SheetTab[]).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setSheetTab(tab)}
                        className={`flex-1 py-2 px-2 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all duration-100 whitespace-nowrap flex justify-center items-center gap-1
                          ${sheetTab === tab 
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
                      </button>
                    ))}
                  </div>

                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-100">
                    {sheetTab === 'combat' && (
                      <CombatTabs
                        char={viewingChar}
                        stats={stats}
                        currentStats={viewingStats}
                        consumeCE={consumeCE}
                        consumePE={consumePE}
                        consumePV={consumePV}
                        activeBuffs={activeBuffs}
                        onConsumeBuffs={handleConsumeBuffs}
                        activeRollResult={activeRollResult}
                        setActiveRollResult={setActiveRollResult}
                        onUpdateInventory={(id, field, val) => handleArrayUpdate('inventory', id, field, val)}
                        onUpdateCharacter={handleCharUpdate}
                        campaignId={selectedCampaign?.id}
                      />
                    )}

                    {sheetTab === 'abilities' && (
                      <>
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => setAbilitiesRctView((prev) => (prev === 'rct' ? 'padrao' : 'rct'))}
                            className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-curse-600 hover:bg-curse-500 text-white shadow-lg hover:shadow-curse-900/50 active:scale-95 border border-curse-500/50 transition-colors"
                            title={abilitiesRctView === 'rct' ? 'Voltar para habilidades padrão' : 'Ir para habilidades de Energia Reversa'}
                          >
                            {abilitiesRctView === 'rct' ? 'Voltar' : 'Energia Reversa'}
                          </button>
                        </div>
                        <AccordionList 
                          title="Habilidades"
                          items={viewingChar.abilities}
                          categories={['Combatente', 'Feiticeiro', 'Especialista', 'Restrição Celestial', 'Habilidades Amaldiçoadas']}
                          enableTabs={false}
                          onAdd={(cat) => handleArrayAdd('abilities', cat)}
                          onUpdate={(id, field, val) => handleArrayUpdate('abilities', id, field, val)}
                          onRemove={(id) => handleArrayRemove('abilities', id)}
                          readOnly={true}
                          placeholderName="Nova Habilidade"
                          onUse={(cost, name) => handleUseAbility(cost, name)}
                          onUseWithId={(cost, name, id) => handleUseAbility(cost, name, id)}
                          activeBuffs={activeBuffs}
                          llLimit={stats.LL}
                          externalRctView={abilitiesRctView}
                        />
                      </>
                    )}

                    {sheetTab === 'techniques' && (
                      <TechniqueManager 
                        techniques={viewingChar.techniques || []}
                        onAdd={handleAddTechnique}
                        onUpdate={handleTechniqueUpdate}
                        onRemove={handleTechniqueRemove}
                        onOpenLibrary={() => alert('Biblioteca de técnicas não disponível nesta visualização.')}
                        characterLevel={viewingChar.level}
                        llValue={stats.LL}
                        currentCE={viewingStats.ce}
                        onConsumeCE={consumeCE}
                      />
                    )}

                    {sheetTab === 'inventory' && (
                      <InventoryList 
                        items={viewingChar.inventory} 
                        onAdd={(template) => handleArrayAdd('inventory', undefined, template)}
                        onUpdate={(id, field, val) => handleArrayUpdate('inventory', id, field, val)}
                        onRemove={(id) => handleArrayRemove('inventory', id)}
                        equippedWeapons={viewingChar.equippedWeapons}
                        onToggleEquip={handleToggleEquipWeapon}
                      />
                    )}

                    {sheetTab === 'progression' && (
                      <LevelUpSummary char={viewingChar} onUpdateAptitude={handleAptitudeUpdate} />
                    )}

                    {sheetTab === 'binding-vows' && (
                      <BindingVowsManager 
                        char={viewingChar} 
                        onUpdateCharacter={handleCharUpdate} 
                      />
                    )}
                  </div>
               </section>
           </div>
        </div>
     );
  }

  if (view === 'detail' && selectedCampaign) {
    const isParticipant = selectedCampaign.participants.some(p => p.userId === auth.currentUser?.uid);
    const isGM = selectedCampaign.gmId === auth.currentUser?.uid;
    const uid = auth.currentUser?.uid || '';
    const eligibleCharacters = uid
      ? savedCharacters.filter(c => !selectedCampaign.participants.some(p => p.userId === uid && p.characterId === c.id))
      : [];

    const toggleCombatPick = (p: CampaignParticipant) => {
      const key = `${p.userId}_${p.characterId}`;
      setCombatSelectedKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const selectedForCombat = selectedCampaign.participants.filter(p => combatSelectedKeys[`${p.userId}_${p.characterId}`]);

    const handleConfirmCombat = async () => {
      if (!selectedCampaign) return;
      if (selectedForCombat.length === 0) return;

      setIsPreparingCombat(true);
      try {
        const campRef = doc(db, 'campaigns', selectedCampaign.id);
        for (const p of selectedForCombat) {
          const key = `${p.userId}_${p.characterId}`;
          const stateRef = doc(db, 'campaigns', selectedCampaign.id, 'characterStates', key);

          let maxStats: CurrentStats | undefined;
          let pre: number | undefined;
          let origin: any | undefined;
          let characterClass: string | undefined;
          try {
            if (p.userId === auth.currentUser?.uid && currentUserChar.id === p.characterId) {
              const derived = calculateDerivedStats(currentUserChar);
              maxStats = { pv: derived.MaxPV, ce: derived.MaxCE, pe: derived.MaxPE };
              pre = currentUserChar.attributes.PRE;
              origin = currentUserChar.origin;
              characterClass = currentUserChar.characterClass;
            } else {
              const userDocRef = doc(db, 'users', p.userId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const chars = (userData.savedCharacters as Character[]) || [];
                const target = chars.find(c => c.id === p.characterId);
                if (target) {
                  const derived = calculateDerivedStats(target);
                  maxStats = { pv: derived.MaxPV, ce: derived.MaxCE, pe: derived.MaxPE };
                  pre = target.attributes.PRE;
                  origin = target.origin;
                  characterClass = target.characterClass;
                }
              }
            }
          } catch (error) {
            console.error('Error preparing maxStats for combatant', error);
          }

          let shouldInitCurrent = false;
          try {
            const existing = await getDoc(stateRef);
            const data = existing.exists() ? (existing.data() as any) : undefined;
            shouldInitCurrent = !data?.currentStats;
          } catch (error) {
            console.error('Error reading characterStates doc', error);
            shouldInitCurrent = true;
          }

          const payload: any = {
            userId: p.userId,
            characterId: p.characterId,
            characterName: p.characterName,
            level: p.level,
            imageUrl: p.imageUrl,
            characterClass,
            origin,
            pre,
            actionState: { standard: true, movement: 2, reactionPenalty: 0 },
            updatedAt: Date.now()
          };

          if (maxStats) {
            payload.maxStats = maxStats;
            if (shouldInitCurrent) {
              payload.currentStats = maxStats;
            }
          }

          try {
            await setDoc(stateRef, payload, { merge: true });
          } catch (error) {
            console.error('Error saving characterStates doc', error);
          }
        }

        try {
          await updateDoc(campRef, {
            activeCombatActive: true,
            activeCombatParticipants: selectedForCombat,
            activeCombatParticipantKeys: selectedForCombat.map(p => `${p.userId}_${p.characterId}`),
            activeCombatStartedAt: Date.now(),
            activeCombatStartedBy: auth.currentUser?.uid || ''
          });
        } catch (error) {
          console.error('Error persisting active combat to campaign', error);
        }

        setActiveCombatParticipants(selectedForCombat);
        setShowCombatSetup(false);
        setView('combat');
      } finally {
        setIsPreparingCombat(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
         <button 
           onClick={() => setView('list')} 
           className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4"
         >
            <ArrowLeft size={16} /> Voltar para Campanhas
         </button>

         <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-2">
                  <div>
                     <h1 className="text-3xl font-black text-white mb-2">{selectedCampaign.name}</h1>
                     <p className="text-slate-400">{selectedCampaign.description}</p>
                  </div>
                  {isGM && (
                     <button
                        onClick={() => handleDeleteCampaign(selectedCampaign)}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
                        title="Deletar Campanha"
                     >
                        <Trash2 size={18} />
                     </button>
                  )}
               </div>
               
               <div className="mt-6 flex gap-4 flex-wrap">
                  {!isParticipant && (
                    <button 
                      onClick={() => handleJoinCampaign(selectedCampaign)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
                    >
                       <Play size={18} /> Entrar com {currentUserChar.name}
                    </button>
                  )}
                  {(isParticipant || isGM) && (
                    <button 
                      onClick={() => setShowDiceLog(true)}
                      className="bg-curse-600 hover:bg-curse-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-curse-900/20 transition-all"
                    >
                       <Dices size={18} /> Log de Rolagens
                    </button>
                  )}
                  {isGM && (
                    selectedCampaign.activeCombatActive && (selectedCampaign.activeCombatParticipants?.length || 0) > 0 ? (
                      <button
                        onClick={() => {
                          setActiveCombatParticipants(selectedCampaign.activeCombatParticipants || []);
                          setView('combat');
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all"
                      >
                        <Shield size={18} /> Continuar Combate
                      </button>
                    ) : (
                     <button
                      onClick={() => {
                        setCombatSelectedKeys({});
                        setShowCombatSetup(true);
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all"
                     >
                      <Play size={18} /> Iniciar Novo Combate
                     </button>
                    )
                  )}
               </div>
            </div>
            <MapPin className="absolute right-[-20px] top-[-20px] text-slate-800 w-48 h-48 opacity-20 pointer-events-none" />
         </div>

         <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Users size={16} /> Participantes ({selectedCampaign.participants.length})
              </h3>
              <button
                onClick={() => {
                  setAddCharacterId(prev => prev || eligibleCharacters[0]?.id || '');
                  setShowAddCharacterPrompt(true);
                }}
                disabled={!auth.currentUser || eligibleCharacters.length === 0}
                title={
                  !auth.currentUser
                    ? 'Faça login para adicionar personagens.'
                    : eligibleCharacters.length === 0
                      ? 'Nenhum personagem elegível para adicionar.'
                      : 'Adicionar personagem à campanha.'
                }
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  (!auth.currentUser || eligibleCharacters.length === 0)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-curse-600 hover:bg-curse-500 text-white shadow-lg shadow-curse-900/20'
                }`}
              >
                <Plus size={18} /> Adicionar Personagem
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {selectedCampaign.participants.map((p, idx) => {
                 const canRemove = isGM || p.userId === auth.currentUser?.uid;
                 const canView = isGM || p.userId === auth.currentUser?.uid; // Only GM or self can view
                 return (
                   <div 
                      key={idx}
                      className={`bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4 transition-all group relative ${
                        canView ? 'hover:border-curse-500/50 hover:bg-slate-900 cursor-pointer' : 'opacity-75'
                      }`}
                   >
                      {canView ? (
                        <button
                           onClick={() => handleViewCharacter(p)}
                           className="flex items-center gap-4 flex-1 text-left"
                        >
                           <div className="w-12 h-12 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shrink-0">
                              {p.imageUrl ? (
                                 <img src={p.imageUrl} alt={p.characterName} className="w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">{p.characterName.charAt(0)}</div>
                              )}
                           </div>
                           <div>
                              <div className="font-bold text-white group-hover:text-curse-300 transition-colors">{p.characterName}</div>
                              <div className="text-xs text-slate-500">Lv.{p.level} {p.characterClass}</div>
                              {p.userId === selectedCampaign.gmId && (
                                 <div className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                                    <Crown size={10} /> Mestre
                                 </div>
                              )}
                           </div>
                        </button>
                      ) : (
                        <div className="flex items-center gap-4 flex-1">
                           <div className="w-12 h-12 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shrink-0">
                              {p.imageUrl ? (
                                 <img src={p.imageUrl} alt={p.characterName} className="w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">{p.characterName.charAt(0)}</div>
                              )}
                           </div>
                           <div>
                              <div className="font-bold text-white">{p.characterName}</div>
                              <div className="text-xs text-slate-500">Lv.{p.level} {p.characterClass}</div>
                              {p.userId === selectedCampaign.gmId && (
                                 <div className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                                    <Crown size={10} /> Mestre
                                 </div>
                              )}
                           </div>
                        </div>
                      )}
                      {canRemove && (
                         <button
                            onClick={(e) => {
                               e.stopPropagation();
                               handleRemoveParticipant(selectedCampaign, p);
                            }}
                            className="p-2 hover:bg-red-600/20 hover:text-red-400 text-slate-600 rounded-lg transition-colors"
                            title="Remover da Campanha"
                         >
                            <UserMinus size={18} />
                         </button>
                      )}
                   </div>
                 );
               })}
            </div>
         </div>

         {showAddCharacterPrompt && (
           <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
                 <h3 className="text-lg font-bold text-white">Escolher Personagem</h3>
                 <button
                   onClick={() => setShowAddCharacterPrompt(false)}
                   className="text-slate-400 hover:text-white transition-colors duration-100"
                 >
                   <X size={20} />
                 </button>
               </div>

               <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                 {!auth.currentUser ? (
                   <div className="text-slate-500 italic text-sm">Faça login para adicionar um personagem.</div>
                 ) : eligibleCharacters.length === 0 ? (
                   <div className="text-slate-500 italic text-sm">Nenhum personagem elegível para adicionar nesta campanha.</div>
                 ) : (
                   eligibleCharacters.map((c) => {
                     const checked = addCharacterId === c.id;
                     return (
                       <label
                         key={c.id}
                         className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                           checked ? 'bg-curse-950/30 border-curse-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                         }`}
                       >
                         <input
                           type="radio"
                           name="add-character-to-campaign"
                           checked={checked}
                           onChange={() => setAddCharacterId(c.id)}
                           className="accent-curse-500"
                         />
                         <div className="w-10 h-10 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shrink-0">
                           {c.imageUrl ? (
                             <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">
                               {c.name.charAt(0)}
                             </div>
                           )}
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="font-bold text-white truncate">{c.name}</div>
                           <div className="text-xs text-slate-500">Lv.{c.level} {c.characterClass}</div>
                         </div>
                       </label>
                     );
                   })
                 )}
               </div>

               <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900 rounded-b-2xl">
                 <button
                   onClick={() => setShowAddCharacterPrompt(false)}
                   className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                 >
                   Cancelar
                 </button>
                 <button
                   onClick={() => {
                     if (!selectedCampaign) return;
                     if (!auth.currentUser) return;
                     if (!addCharacterId) return;
                     onRequestAddCharacterToCampaign?.({
                       campaignId: selectedCampaign.id,
                       eligibleCharacterIds: eligibleCharacters.map(c => c.id),
                       selectedCharacterId: addCharacterId
                     });
                     setShowAddCharacterPrompt(false);
                   }}
                   disabled={!auth.currentUser || eligibleCharacters.length === 0 || !addCharacterId}
                   className={`px-4 py-2 rounded-lg font-bold ${
                     (!auth.currentUser || eligibleCharacters.length === 0 || !addCharacterId)
                       ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                       : 'bg-curse-600 hover:bg-curse-500 text-white'
                   }`}
                 >
                   Continuar
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Dice Roll Log */}
         {selectedCampaign && (
           <DiceRollLog 
             campaignId={selectedCampaign.id}
             isOpen={showDiceLog}
             onClose={() => setShowDiceLog(false)}
             gmId={selectedCampaign.gmId}
           />
         )}

         {showCombatSetup && (
           <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
                 <h3 className="text-lg font-bold text-white">Selecionar Participantes</h3>
                 <button
                   onClick={() => setShowCombatSetup(false)}
                   className="text-slate-400 hover:text-white transition-colors duration-100"
                 >
                   <X size={20} />
                 </button>
               </div>

               <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                 {selectedCampaign.participants.length === 0 ? (
                   <div className="text-slate-500 italic text-sm">Nenhum participante na campanha.</div>
                 ) : (
                   selectedCampaign.participants.map((p, idx) => {
                     const key = `${p.userId}_${p.characterId}`;
                     const checked = !!combatSelectedKeys[key];
                     return (
                       <label
                         key={idx}
                         className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                           checked ? 'bg-curse-950/30 border-curse-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                         }`}
                       >
                         <input
                           type="checkbox"
                           checked={checked}
                           onChange={() => toggleCombatPick(p)}
                           className="accent-curse-500"
                         />
                         <div className="w-10 h-10 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shrink-0">
                           {p.imageUrl ? (
                             <img src={p.imageUrl} alt={p.characterName} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">
                               {p.characterName.charAt(0)}
                             </div>
                           )}
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="font-bold text-white truncate">{p.characterName}</div>
                           <div className="text-xs text-slate-500">Lv.{p.level} {p.characterClass}</div>
                         </div>
                       </label>
                     );
                   })
                 )}
               </div>

               <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900 rounded-b-2xl">
                 <button
                   onClick={() => setShowCombatSetup(false)}
                   className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                 >
                   Cancelar
                 </button>
                 <button
                   onClick={handleConfirmCombat}
                   disabled={selectedForCombat.length === 0 || isPreparingCombat}
                   className={`px-4 py-2 rounded-lg font-bold ${
                     (selectedForCombat.length === 0 || isPreparingCombat)
                       ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                       : 'bg-red-600 hover:bg-red-500 text-white'
                   }`}
                 >
                   {isPreparingCombat ? 'Preparando...' : 'Confirmar'}
                 </button>
               </div>
             </div>
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Create Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
         <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={20} className="text-curse-400" /> Criar Nova Campanha
         </h2>
         <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Nome da Campanha"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-curse-500 focus:outline-none"
            />
            <input 
              type="text" 
              placeholder="Descrição curta..."
              value={newCampaignDesc}
              onChange={(e) => setNewCampaignDesc(e.target.value)}
              className="flex-[2] bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-curse-500 focus:outline-none"
            />
            <button 
              onClick={handleCreateCampaign}
              className="bg-curse-600 hover:bg-curse-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
               Criar
            </button>
         </div>
      </div>

      {/* List Section */}
      <div>
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin size={16} /> Campanhas Ativas
         </h3>
         
         {campaigns.length === 0 ? (
            <div className="text-center py-12 text-slate-600 italic">
               Nenhuma campanha encontrada. Crie a primeira!
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {campaigns.map(camp => {
                 const isGM = camp.gmId === auth.currentUser?.uid;
                 return (
                   <div 
                      key={camp.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-curse-500/50 hover:shadow-lg hover:shadow-curse-900/10 transition-all group relative"
                   >
                      <div 
                         onClick={() => { setSelectedCampaign(camp); setView('detail'); }}
                         className="cursor-pointer"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white text-lg group-hover:text-curse-300 transition-colors">{camp.name}</h4>
                            <span className="bg-slate-950 text-slate-500 text-[10px] px-2 py-1 rounded-full border border-slate-800 font-mono">
                               {camp.participants.length} Players
                            </span>
                         </div>
                         <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10">{camp.description}</p>
                         
                         <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Shield size={12} /> Mestre ID: <span className="font-mono">{camp.gmId.slice(0, 6)}...</span>
                         </div>
                      </div>
                      {isGM && (
                         <button
                            onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteCampaign(camp);
                            }}
                            className="absolute top-3 right-3 p-2 hover:bg-red-600/20 hover:text-red-400 text-slate-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Deletar Campanha"
                         >
                            <Trash2 size={16} />
                         </button>
                      )}
                   </div>
                 );
               })}
            </div>
         )}
      </div>
    </div>
  );
};
