import React, { useState, useEffect, useRef } from 'react';
import { DiceRollLog as DiceRollLogType } from '../types';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, where, doc, writeBatch, getDocs } from 'firebase/firestore';
import { Dices, X, Hexagon, Trash2 } from 'lucide-react';

interface DiceRollLogProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
  gmId?: string; // Optional GM ID to enable clear log button
}

export const DiceRollLog: React.FC<DiceRollLogProps> = ({ campaignId, isOpen, onClose, gmId }) => {
  const [rolls, setRolls] = useState<DiceRollLogType[]>([]);
  const [filter, setFilter] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevRollsLengthRef = useRef<number>(0);
  
  // Check if current user is GM
  const isGM = gmId && auth.currentUser && gmId === auth.currentUser.uid;

  useEffect(() => {
    if (!isOpen || !campaignId) {
      prevRollsLengthRef.current = 0;
      return;
    }

    // Initialize prevRollsLengthRef when opening
    prevRollsLengthRef.current = 0;

    const q = query(
      collection(db, 'diceRolls'),
      where('campaignId', '==', campaignId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const campaignRolls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DiceRollLogType));
      
      // Check if a new roll was added (length increased)
      const prevLength = prevRollsLengthRef.current;
      const hasNewRoll = campaignRolls.length > prevLength && prevLength > 0;
      prevRollsLengthRef.current = campaignRolls.length;
      
      setRolls(campaignRolls);
      
      // Scroll to top (newest) when a new roll is added
      if (hasNewRoll && scrollContainerRef.current) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        }, 150);
      }
    }, (error) => {
      console.error('Error fetching dice rolls:', error);
      // If orderBy fails (no index), fallback to client-side filtering
      const fallbackQ = query(
        collection(db, 'diceRolls'),
        where('campaignId', '==', campaignId),
        limit(100)
      );
      const fallbackUnsub = onSnapshot(fallbackQ, (snapshot) => {
        const campaignRolls = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as DiceRollLogType))
          .sort((a, b) => b.timestamp - a.timestamp);
        
        // Check if a new roll was added (length increased)
        const prevLength = prevRollsLengthRef.current;
        const hasNewRoll = campaignRolls.length > prevLength && prevLength > 0;
        prevRollsLengthRef.current = campaignRolls.length;
        
        setRolls(campaignRolls);
        
        // Scroll to top (newest) when a new roll is added
        if (hasNewRoll && scrollContainerRef.current) {
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = 0;
            }
          }, 150);
        }
      });
      return () => fallbackUnsub();
    });

    return () => unsubscribe();
  }, [isOpen, campaignId]);

  const filteredRolls = rolls.filter(roll => {
    if (!filter) return true;
    const searchTerm = filter.toLowerCase();
    return (
      roll.characterName.toLowerCase().includes(searchTerm) ||
      roll.rollName.toLowerCase().includes(searchTerm)
    );
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearLog = async () => {
    if (!isGM) return;
    
    if (!confirm('Tem certeza que deseja limpar todo o log de rolagens desta campanha? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Get all roll documents for this campaign
      const q = query(
        collection(db, 'diceRolls'),
        where('campaignId', '==', campaignId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('Log já está vazio.');
        return;
      }
      
      // Delete in batches (Firestore limit is 500 per batch)
      const batchSize = 500;
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + batchSize);
        
        batchDocs.forEach((docSnapshot) => {
          batch.delete(doc(db, 'diceRolls', docSnapshot.id));
        });
        
        await batch.commit();
      }
      
      alert('Log limpo com sucesso!');
      // Reset ref
      prevRollsLengthRef.current = 0;
    } catch (error) {
      console.error('Error clearing log:', error);
      alert('Erro ao limpar log: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Initialize prevRollsLength when first opening with existing rolls
  useEffect(() => {
    if (isOpen && rolls.length > 0 && prevRollsLengthRef.current === 0) {
      // Set to current length when opening for the first time (but don't scroll on initial load)
      prevRollsLengthRef.current = rolls.length;
    }
  }, [isOpen, rolls.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end">
      <div className="h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <Dices size={20} className="text-curse-400" />
            <h2 className="text-lg font-bold text-white">Log de Rolagens</h2>
          </div>
          <div className="flex items-center gap-2">
            {isGM && rolls.length > 0 && (
              <button
                onClick={handleClearLog}
                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                title="Limpar Log (apenas GM)"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-slate-800">
          <input
            type="text"
            placeholder="Filtrar rolagens..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-curse-500 focus:outline-none"
          />
        </div>

        {/* Roll List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRolls.length === 0 ? (
            <div className="text-center py-12 text-slate-600 italic">
              {filter ? 'Nenhuma rolagem encontrada com esse filtro.' : 'Nenhuma rolagem ainda.'}
            </div>
          ) : (
            filteredRolls.map((roll) => (
              <div
                key={roll.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 hover:border-curse-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-700 shrink-0">
                    <Hexagon size={16} className="text-curse-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {roll.characterName && (
                        <span className="font-bold text-white text-sm">{roll.characterName}</span>
                      )}
                      <span className="text-curse-400 font-semibold text-sm">{roll.rollName}</span>
                    </div>
                    <div className="text-xs text-slate-400 mb-2 font-mono">
                      {roll.breakdown || `[${roll.rolls.join(', ')}] = ${roll.total}`}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      {formatDate(roll.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
