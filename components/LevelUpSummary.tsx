import React, { useMemo } from 'react';
import { Character, Origin } from '../types';
import { calculateTotalResources, getNextLevelRewards, SORCERER_TABLE, HEAVENLY_TABLE } from '../utils/progressionLogic';
import { TrendingUp, Award, Book, Dna, Star, Crown, ChevronRight } from 'lucide-react';

interface LevelUpSummaryProps {
  char: Character;
}

export const LevelUpSummary: React.FC<LevelUpSummaryProps> = ({ char }) => {
  
  const resources = useMemo(() => calculateTotalResources(char.level, char.origin), [char.level, char.origin]);
  const nextRewards = useMemo(() => getNextLevelRewards(char.level, char.origin), [char.level, char.origin]);
  
  const isHR = char.origin === Origin.RestricaoCelestial;

  // Calculate used resources (mocked or derived from actual arrays if we implemented tracking used points)
  // For now, we display Total Available based on Math.
  const usedSkills = char.skills.reduce((acc, skill) => acc + (skill.value === 5 ? 1 : skill.value === 10 ? 2 : skill.value === 15 ? 3 : 0), 0);
  const totalAttrPointsUsed = Object.values(char.attributes).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Level Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-curse-950 to-slate-900 border border-curse-500/30 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
           <Crown size={120} className="text-curse-400" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-950 border-2 border-curse-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)]">
               <span className="text-4xl font-black text-white">{char.level}</span>
            </div>
            <div>
              <h2 className="text-sm uppercase font-bold text-curse-300 tracking-widest">Nível Atual</h2>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                 {char.origin} <span className="text-slate-600">|</span> {char.characterClass}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                {isHR 
                  ? "Seu corpo evolui para superar a maldição. Você ganha características físicas sobre-humanas." 
                  : "Sua compreensão da energia amaldiçoada se aprofunda, permitindo técnicas mais complexas."}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm text-center min-w-[140px]">
             <div className="text-xs text-slate-500 uppercase font-bold mb-1">Proficiência</div>
             <div className="text-3xl font-black text-emerald-400">+{resources.proficiencyBonus}</div>
             <div className="text-[10px] text-slate-600">Bônus em Testes</div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Attributes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-curse-500/50 transition-colors">
           <div className="flex justify-between items-start mb-2">
              <div className="bg-blue-950/30 p-2 rounded-lg text-blue-400">
                <Dna size={20} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
           </div>
           <div>
             <div className="text-2xl font-bold text-white">{resources.totalAttributes}</div>
             <div className="text-xs text-slate-400">Pontos de Atributo</div>
           </div>
           <div className="mt-3 pt-3 border-t border-slate-800/50 text-[10px] text-slate-500 flex justify-between">
              <span>Gastos: {totalAttrPointsUsed}</span>
              <span className={resources.totalAttributes - totalAttrPointsUsed < 0 ? "text-red-400" : "text-emerald-400"}>
                 Restante: {resources.totalAttributes - totalAttrPointsUsed}
              </span>
           </div>
        </div>

        {/* Skills */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-curse-500/50 transition-colors">
           <div className="flex justify-between items-start mb-2">
              <div className="bg-purple-950/30 p-2 rounded-lg text-purple-400">
                <Book size={20} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
           </div>
           <div>
             <div className="text-2xl font-bold text-white">{resources.totalSkills}</div>
             <div className="text-xs text-slate-400">Pontos de Perícia</div>
           </div>
           <div className="mt-3 pt-3 border-t border-slate-800/50 text-[10px] text-slate-500">
              *Habilidade "Inato" concede bônus no nv 1 e 5.
           </div>
        </div>

        {/* Aptitude/Feats */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-curse-500/50 transition-colors">
           <div className="flex justify-between items-start mb-2">
              <div className="bg-yellow-950/30 p-2 rounded-lg text-yellow-400">
                <Star size={20} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
           </div>
           <div>
             <div className="text-2xl font-bold text-white">{resources.totalAptitude}</div>
             <div className="text-xs text-slate-400">Pontos de Aptidão</div>
           </div>
           <div className="mt-3 pt-3 border-t border-slate-800/50 text-[10px] text-slate-500">
              Usados para comprar Talentos ou Habilidades de Classe.
           </div>
        </div>
      </div>

      {/* Next Level Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
         <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-curse-400" /> Próximo Nível ({char.level + 1})
         </h3>
         
         <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 relative overflow-hidden">
            {/* Decoration Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-curse-500 to-transparent"></div>
            
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
               <ChevronRight className="text-curse-500" />
            </div>

            <div className="flex-1">
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {nextRewards.map((reward, idx) => (
                   <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <Award size={14} className="text-emerald-400 shrink-0" />
                      {reward}
                   </li>
                 ))}
               </ul>
            </div>
         </div>
      </div>
      
      {/* Full Table Reference (Collapsed or Mini) */}
      <div className="mt-8">
         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
             Referência de Progressão ({isHR ? 'Restrição Celestial' : 'Padrão'})
         </h4>
         <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs max-h-[300px] overflow-y-auto custom-scrollbar">
            {(isHR ? HEAVENLY_TABLE : SORCERER_TABLE).map((row) => (
               <div key={row.level} className={`flex border-b border-slate-900 p-3 ${row.level === char.level ? 'bg-curse-900/20' : ''}`}>
                  <div className={`w-12 font-bold font-mono ${row.level <= char.level ? 'text-curse-400' : 'text-slate-600'}`}>
                     Lv.{row.level}
                  </div>
                  <div className="flex-1 text-slate-400">
                     {row.gains.join(" • ")}
                  </div>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
};
