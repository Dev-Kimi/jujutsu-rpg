import React, { useState, useEffect } from 'react';
import { DiceRollLog as DiceRollLogType } from '../types';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { Dices, X, Hexagon } from 'lucide-react';

interface DiceRollLogProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DiceRollLog: React.FC<DiceRollLogProps> = ({ campaignId, isOpen, onClose }) => {
  const [rolls, setRolls] = useState<DiceRollLogType[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isOpen || !campaignId) return;

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
      setRolls(campaignRolls);
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
        setRolls(campaignRolls);
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
