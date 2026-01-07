
import React, { useState, useEffect } from 'react';
import { Campaign, CampaignParticipant, Character, CurrentStats } from '../types';
import { Users, Plus, Play, Eye, ArrowLeft, Crown, Shield, X, MapPin, Trash2, UserMinus } from 'lucide-react';
import { db, auth } from '../firebase'; // Ensure you have this configured
import { collection, addDoc, updateDoc, arrayUnion, arrayRemove, query, onSnapshot, doc, getDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { CharacterAttributes } from './CharacterAttributes';
import { StatBar } from './StatBar';
import { SkillList } from './SkillList';
import { AccordionList } from './AccordionList';
import { InventoryList } from './InventoryList';
import { calculateDerivedStats } from '../utils/calculations';

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
    // If it's me, use the currentUserChar directly
    if (participant.userId === auth.currentUser?.uid) {
        // Check if the character ID matches
        if (currentUserChar.id === participant.characterId) {
            setViewingChar(currentUserChar);
            const stats = calculateDerivedStats(currentUserChar);
            setViewingStats({ pv: stats.MaxPV, ce: stats.MaxCE, pe: stats.MaxPE });
            setView('sheet');
            return;
        } else {
            alert("O personagem selecionado na campanha não corresponde ao personagem atual.");
            return;
        }
    }

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

  // --- RENDERERS ---

  if (view === 'sheet' && viewingChar) {
     const stats = calculateDerivedStats(viewingChar);
     return (
        <div className="animate-in slide-in-from-bottom-5 duration-300 pb-20">
           {/* Read Only Header */}
           <div className="sticky top-0 z-20 bg-slate-900 border-b border-curse-500 p-4 flex items-center justify-between shadow-lg">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('detail')} 
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                  >
                     <ArrowLeft />
                  </button>
                  <div>
                     <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Eye size={20} className="text-emerald-400" /> Visualizando: {viewingChar.name}
                     </h2>
                     <p className="text-xs text-slate-400">Modo Somente Leitura</p>
                  </div>
               </div>
               <button onClick={() => setView('detail')} className="text-slate-400 hover:text-white">
                  <X />
               </button>
           </div>
           
           <div className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-start">
               {/* Identity & Stats */}
               <section className="md:col-span-1 xl:col-span-3 space-y-6">
                  <CharacterAttributes 
                     char={viewingChar} 
                     onUpdate={() => {}} 
                     onUpdateAttribute={() => {}} 
                     readOnly // New Prop
                  />
                  <div className="space-y-1 opacity-90">
                     <StatBar label="Vida (PV)" current={viewingStats.pv} max={stats.MaxPV} colorClass="bg-blood-500" onChange={()=>{}} readOnly />
                     <StatBar label="Energia (CE)" current={viewingStats.ce} max={stats.MaxCE} colorClass="bg-curse-500" onChange={()=>{}} readOnly />
                     <StatBar label="Esforço (PE)" current={viewingStats.pe} max={stats.MaxPE} colorClass="bg-orange-500" onChange={()=>{}} readOnly />
                  </div>
               </section>

               {/* Skills */}
               <section className="md:col-span-1 xl:col-span-5">
                  <SkillList 
                    char={viewingChar} 
                    onUpdateSkill={()=>{}} 
                    onAddSkill={()=>{}} 
                    onRemoveSkill={()=>{}} 
                    readOnly // New Prop
                  />
               </section>

               {/* Inventory / Abilities (Simplified for Read Only) */}
               <section className="md:col-span-2 xl:col-span-4 space-y-4">
                  <AccordionList 
                     title="Habilidades"
                     items={viewingChar.abilities}
                     onAdd={()=>{}} onUpdate={()=>{}} onRemove={()=>{}}
                     enableTabs={false}
                  />
                  <InventoryList 
                     items={viewingChar.inventory} 
                     onAdd={()=>{}} onUpdate={()=>{}} onRemove={()=>{}} 
                     readOnly // New Prop
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
               
               <div className="mt-6 flex gap-4">
                  {!isParticipant && (
                    <button 
                      onClick={() => handleJoinCampaign(selectedCampaign)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
                    >
                       <Play size={18} /> Entrar com {currentUserChar.name}
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
                 return (
                   <div 
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-curse-500/50 hover:bg-slate-900 transition-all group relative"
                   >
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
