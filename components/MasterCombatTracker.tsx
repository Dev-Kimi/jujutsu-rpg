import React, { useEffect, useMemo, useState } from 'react';
import { CampaignParticipant, CurrentStats } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type CombatantState = {
  userId: string;
  characterId: string;
  characterName: string;
  level: number;
  imageUrl?: string;
  currentStats?: CurrentStats;
  maxStats?: CurrentStats;
  updatedAt?: number;
};

interface MasterCombatTrackerProps {
  campaignId: string;
  participants: CampaignParticipant[];
}

const MiniBar: React.FC<{
  label: string;
  current: number;
  max: number;
  colorClass: string;
}> = ({ label, current, max, colorClass }) => {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-300">
          {current} <span className="text-slate-600">/ {max}</span>
        </span>
      </div>
      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
        <div className={`h-full ${colorClass} transition-all duration-150`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const MasterCombatTracker: React.FC<MasterCombatTrackerProps> = ({ campaignId, participants }) => {
  const [statesByKey, setStatesByKey] = useState<Record<string, CombatantState>>({});

  const keys = useMemo(
    () => participants.map((p) => `${p.userId}_${p.characterId}`),
    [participants]
  );

  useEffect(() => {
    if (!campaignId) return;
    if (participants.length === 0) return;

    const unsubscribes = participants.map((p) => {
      const key = `${p.userId}_${p.characterId}`;
      const ref = doc(db, 'campaigns', campaignId, 'characterStates', key);

      return onSnapshot(ref, (snap) => {
        const data = snap.exists() ? (snap.data() as CombatantState) : undefined;
        setStatesByKey((prev) => ({
          ...prev,
          [key]: {
            userId: p.userId,
            characterId: p.characterId,
            characterName: p.characterName,
            level: p.level,
            imageUrl: p.imageUrl,
            ...(data || {})
          }
        }));
      });
    });

    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [campaignId, keys.join('|')]);

  const ordered = participants.map((p) => {
    const key = `${p.userId}_${p.characterId}`;
    return {
      key,
      participant: p,
      state: statesByKey[key]
    };
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {ordered.map(({ key, participant, state }) => {
        const displayName = state?.characterName || participant.characterName;
        const displayLevel = state?.level ?? participant.level;

        const current = state?.currentStats || { pv: 0, ce: 0, pe: 0 };
        const max = state?.maxStats || { pv: 0, ce: 0, pe: 0 };

        return (
          <div key={key} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-slate-800 bg-slate-900/40">
              <div className="w-12 h-12 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shrink-0">
                {(state?.imageUrl || participant.imageUrl) ? (
                  <img
                    src={(state?.imageUrl || participant.imageUrl) as string}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{displayName}</div>
                <div className="text-xs text-slate-500 font-mono">Lv.{displayLevel}</div>
              </div>
              <div className="ml-auto text-[10px] text-slate-600 font-mono">
                {state?.updatedAt ? new Date(state.updatedAt).toLocaleTimeString() : ''}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <MiniBar label="PV" current={current.pv} max={max.pv} colorClass="bg-blood-500" />
              <MiniBar label="CE" current={current.ce} max={max.ce} colorClass="bg-curse-500" />
              <MiniBar label="PE" current={current.pe} max={max.pe} colorClass="bg-orange-500" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
