
import React, { useState, useEffect } from 'react';
import { Campaign, CampaignParticipant, Character, CurrentStats } from '../types';
import { Users, Plus, Play, Eye, ArrowLeft, Crown, Shield, X, MapPin, Trash2, UserMinus, Edit2, Save, Dices } from 'lucide-react';
import { db, auth } from '../firebase'; // Ensure you have this configured
import { collection, addDoc, updateDoc, arrayUnion, arrayRemove, query, onSnapshot, doc, getDoc, deleteDoc, orderBy, setDoc } from 'firebase/firestore';
import { CharacterAttributes } from './CharacterAttributes';
import { StatBar } from './StatBar';
import { SkillList } from './SkillList';
import { AccordionList } from './AccordionList';
import { InventoryList } from './InventoryList';
import { calculateDerivedStats } from '../utils/calculations';
import { DiceRollLog } from './DiceRollLog';

interface CampaignManagerProps {
  currentUserChar: Character;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ currentUserChar }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'sheet'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  
  // Read Only Sheet State
  const [viewingChar, setViewingChar] = useState<Character | null>(null);
  const [viewingStats, setViewingStats] = useState<CurrentStats>({ pv: 0, ce: 0, pe: 0 });
  const [editingAsGM, setEditingAsGM] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<CampaignParticipant | null>(null);
  const [showDiceLog, setShowDiceLog] = useState(false);

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
    const alreadyIn = campaign.participants.some(p => p.userId === auth.currentUser?.uid);
    if (alreadyIn) return alert("Você já está nesta campanha.");

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
        participants: arrayUnion(newParticipant)
      });
      // Local update for immediate feedback (though snapshot handles it)
      setSelectedCampaign({
        ...campaign,
        participants: [...campaign.participants, newParticipant]
      });
    } catch (error) {
      console.error("Error joining", error);
    }
  };

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
            setViewingStats({ pv: stats.MaxPV, ce: stats.MaxCE, pe: stats.MaxPE });
            setEditingAsGM(false);
            setEditingParticipant(null);
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
                setEditingAsGM(true);
                setEditingParticipant(participant);
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

  const handleSaveCharacterAsGM = async () => {
    if (!viewingChar || !editingParticipant) return;
    
    try {
      const userDocRef = doc(db, "users", editingParticipant.userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const characters = (userData.savedCharacters as Character[]) || [];
        
        // Update the character in the array
        const updatedCharacters = characters.map(c => 
          c.id === viewingChar.id ? viewingChar : c
        );
        
        // Save back to Firestore
        await setDoc(userDocRef, {
          ...userData,
          savedCharacters: updatedCharacters
        }, { merge: true });
        
        // Update participant info in campaign if name/level changed
        if (selectedCampaign) {
          const campRef = doc(db, "campaigns", selectedCampaign.id);
          const updatedParticipants = selectedCampaign.participants.map(p => 
            p.userId === editingParticipant.userId && p.characterId === viewingChar.id
              ? { ...p, characterName: viewingChar.name, level: viewingChar.level, characterClass: viewingChar.characterClass }
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
        
        alert("Ficha salva com sucesso!");
      }
    } catch (error) {
      console.error("Error saving character as GM", error);
      alert("Erro ao salvar ficha: " + (error instanceof Error ? error.message : String(error)));
    }
  };

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
        participants: arrayRemove(participant)
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

  // Handlers for GM editing
  const handleCharUpdateAsGM = (field: keyof Character, value: any) => {
    if (!viewingChar) return;
    setViewingChar({ ...viewingChar, [field]: value });
  };

  const handleAttributeUpdateAsGM = (attr: keyof import('../types').Attributes, val: number) => {
    if (!viewingChar) return;
    setViewingChar({
      ...viewingChar,
      attributes: { ...viewingChar.attributes, [attr]: val }
    });
  };

  const handleSkillUpdateAsGM = (id: string, field: keyof import('../types').Skill, value: any) => {
    if (!viewingChar) return;
    setViewingChar({
      ...viewingChar,
      skills: viewingChar.skills.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const handleAddSkillAsGM = () => {
    if (!viewingChar) return;
    const newSkill: import('../types').Skill = { 
      id: Math.random().toString(36).substring(2, 9), 
      name: "Nova Perícia", 
      value: 0 
    };
    setViewingChar({ ...viewingChar, skills: [...viewingChar.skills, newSkill] });
  };

  const handleRemoveSkillAsGM = (id: string) => {
    if (!viewingChar) return;
    setViewingChar({
      ...viewingChar,
      skills: viewingChar.skills.filter(s => s.id !== id)
    });
  };

  const handleArrayUpdateAsGM = (field: 'abilities' | 'inventory', id: string, itemField: string, value: any) => {
    if (!viewingChar) return;
    setViewingChar({
      ...viewingChar,
      [field]: viewingChar[field].map((item: any) => item.id === id ? { ...item, [itemField]: value } : item)
    });
  };

  const handleArrayAddAsGM = (field: 'abilities' | 'inventory', category?: string, template?: Partial<import('../types').Item>) => {
    if (!viewingChar) return;
    const id = Math.random().toString(36).substring(2, 9);
    let newItem;
    if (field === 'inventory') {
      newItem = { id, name: template?.name || "", quantity: 1, description: template?.description || "" } as import('../types').Item;
    } else {
      newItem = { id, name: "", cost: "", description: "", category: category || "Combatente" } as import('../types').Ability;
    }
    setViewingChar({ ...viewingChar, [field]: [...viewingChar[field], newItem] });
  };

  const handleArrayRemoveAsGM = (field: 'abilities' | 'inventory', id: string) => {
    if (!viewingChar) return;
    setViewingChar({
      ...viewingChar,
      [field]: viewingChar[field].filter((item: any) => item.id !== id)
    });
  };

  // --- RENDERERS ---

  if (view === 'sheet' && viewingChar) {
     const stats = calculateDerivedStats(viewingChar);
     const isReadOnly = !editingAsGM;
     
     return (
        <div className="animate-in slide-in-from-bottom-5 duration-300 pb-20">
           {/* Header */}
           <div className={`sticky top-0 z-20 ${editingAsGM ? 'bg-curse-900/80 border-curse-500' : 'bg-slate-900 border-curse-500'} border-b p-4 flex items-center justify-between shadow-lg`}>
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setView('detail');
                      setEditingAsGM(false);
                      setEditingParticipant(null);
                    }} 
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                  >
                     <ArrowLeft />
                  </button>
                  <div>
                     <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {editingAsGM ? (
                          <>
                            <Edit2 size={20} className="text-curse-400" /> Editando: {viewingChar.name}
                          </>
                        ) : (
                          <>
                            <Eye size={20} className="text-emerald-400" /> Visualizando: {viewingChar.name}
                          </>
                        )}
                     </h2>
                     <p className="text-xs text-slate-400">
                        {editingAsGM ? "Modo Edição (Mestre)" : "Modo Somente Leitura"}
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  {editingAsGM && (
                     <button 
                        onClick={handleSaveCharacterAsGM}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
                        title="Salvar Alterações"
                     >
                        <Save size={18} /> Salvar
                     </button>
                  )}
                  <button 
                    onClick={() => {
                      setView('detail');
                      setEditingAsGM(false);
                      setEditingParticipant(null);
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
                     onUpdate={editingAsGM ? handleCharUpdateAsGM : () => {}} 
                     onUpdateAttribute={editingAsGM ? handleAttributeUpdateAsGM : () => {}} 
                     readOnly={isReadOnly}
                  />
                  <div className="space-y-1 opacity-90">
                     <StatBar 
                       label="Vida (PV)" 
                       current={viewingStats.pv} 
                       max={stats.MaxPV} 
                       colorClass="bg-blood-500" 
                       onChange={editingAsGM ? (v) => setViewingStats({ ...viewingStats, pv: v }) : () => {}} 
                       readOnly={isReadOnly} 
                     />
                     <StatBar 
                       label="Energia (CE)" 
                       current={viewingStats.ce} 
                       max={stats.MaxCE} 
                       colorClass="bg-curse-500" 
                       onChange={editingAsGM ? (v) => setViewingStats({ ...viewingStats, ce: v }) : () => {}} 
                       readOnly={isReadOnly} 
                     />
                     <StatBar 
                       label="Esforço (PE)" 
                       current={viewingStats.pe} 
                       max={stats.MaxPE} 
                       colorClass="bg-orange-500" 
                       onChange={editingAsGM ? (v) => setViewingStats({ ...viewingStats, pe: v }) : () => {}} 
                       readOnly={isReadOnly} 
                     />
                  </div>
               </section>

               {/* Skills */}
               <section className="md:col-span-1 xl:col-span-5">
                  <SkillList 
                    char={viewingChar} 
                    onUpdateSkill={editingAsGM ? handleSkillUpdateAsGM : () => {}} 
                    onAddSkill={editingAsGM ? handleAddSkillAsGM : () => {}} 
                    onRemoveSkill={editingAsGM ? handleRemoveSkillAsGM : () => {}} 
                    readOnly={isReadOnly}
                  />
               </section>

               {/* Inventory / Abilities */}
               <section className="md:col-span-2 xl:col-span-4 space-y-4">
                  <AccordionList 
                     title="Habilidades"
                     items={viewingChar.abilities}
                     onAdd={editingAsGM ? (cat) => handleArrayAddAsGM('abilities', cat) : () => {}} 
                     onUpdate={editingAsGM ? (id, field, val) => handleArrayUpdateAsGM('abilities', id, field, val) : () => {}} 
                     onRemove={editingAsGM ? (id) => handleArrayRemoveAsGM('abilities', id) : () => {}}
                     enableTabs={false}
                  />
                  <InventoryList 
                     items={viewingChar.inventory} 
                     onAdd={editingAsGM ? (template) => handleArrayAddAsGM('inventory', undefined, template) : () => {}} 
                     onUpdate={editingAsGM ? (id, field, val) => handleArrayUpdateAsGM('inventory', id, field, val) : () => {}} 
                     onRemove={editingAsGM ? (id) => handleArrayRemoveAsGM('inventory', id) : () => {}} 
                     readOnly={isReadOnly}
                  />
               </section>
           </div>
        </div>
     );
  }

  if (view === 'detail' && selectedCampaign) {
    const isParticipant = selectedCampaign.participants.some(p => p.userId === auth.currentUser?.uid);
    const isGM = selectedCampaign.gmId === auth.currentUser?.uid;

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
               </div>
            </div>
            <MapPin className="absolute right-[-20px] top-[-20px] text-slate-800 w-48 h-48 opacity-20 pointer-events-none" />
         </div>

         <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Users size={16} /> Participantes ({selectedCampaign.participants.length})
            </h3>
            
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

         {/* Dice Roll Log */}
         {selectedCampaign && (
           <DiceRollLog 
             campaignId={selectedCampaign.id}
             isOpen={showDiceLog}
             onClose={() => setShowDiceLog(false)}
           />
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
