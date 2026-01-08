import React, { useMemo } from 'react';
import { Character, Origin } from '../types';
import { calculateTotalResources, getNextLevelRewards, SORCERER_TABLE, HEAVENLY_TABLE } from '../utils/progressionLogic';
import { TrendingUp, Award, Book, Dna, Star, Crown, ChevronRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface LevelUpSummaryProps {
  char: Character;
}

export const LevelUpSummary: React.FC<LevelUpSummaryProps> = ({ char }) => {
  
  const resources = useMemo(() => calculateTotalResources(char.level, char.origin), [char.level, char.origin]);
  const nextRewards = useMemo(() => getNextLevelRewards(char.level, char.origin), [char.level, char.origin]);
  
  const isHR = char.origin === Origin.RestricaoCelestial;

  // Calculate used resources
  // "Pontos de Habilidade" são usados para adicionar habilidades de classe (abilities)
  // Count all abilities, but exclude the "Habilidade Base de Classe" if it exists
  const actualUsedSkills = char.abilities.length;
  
  const totalAttrPointsUsed = (Object.values(char.attributes) as number[]).reduce((a, b) => a + b, 0) - 5; // Subtract base 5
  
  // Calculate actual used resources from character
  const actualUsedAttr = Math.max(0, totalAttrPointsUsed);
  const actualUsedTechniques = char.techniques.length;
  // "Pontos de Aptidão" são usados para habilidades que não são passivas (custo != "Passivo")
  const actualUsedAptitude = char.abilities.filter(ability => 
    ability.cost && ability.cost.toLowerCase() !== "passivo"
  ).length;

  // Calculate resources gained and used per level
  const levelProgress = useMemo(() => {
    const progress: Array<{
      level: number;
      gains: string[];
      gained: {
        attribute: number;
        skill: number;
        aptitude: number;
        technique: number;
        training: number;
      };
      cumulative: {
        attribute: number;
        skill: number;
        aptitude: number;
        technique: number;
        training: number;
      };
    }> = [];
    
    const isInato = char.origin === Origin.Inato;
    const isHR = char.origin === Origin.RestricaoCelestial;
    
    let cumulativeAttr = 0;
    let cumulativeSkill = 0;
    let cumulativeAptitude = 0;
    let cumulativeTechnique = 0;
    let cumulativeTraining = 0;
    
    const table = isHR ? HEAVENLY_TABLE : SORCERER_TABLE;
    
    for (let level = 1; level <= char.level; level++) {
      const entry = table.find(e => e.level === level);
      if (!entry && !isHR) continue;
      
      const gains = entry ? entry.gains : [];
      
      let gainedAttr = 0;
      let gainedSkill = 0;
      let gainedAptitude = 0;
      let gainedTechnique = 0;
      let gainedTraining = 0;
      
      if (level === 1) {
        gainedAttr = 5; // Start: +5 Pontos de Atributo
        gainedSkill = 1; // +1 Ponto de Habilidade
        gainedTechnique = 1; // Variação de Técnica Inata
        if (isInato) {
          gainedSkill += 1; // Inato bonus level 1
        }
        if (isHR) {
          gainedAttr = 3; // HR: +3 Atributos Iniciais
        }
      }
      
      if (!isHR) {
        gains.forEach(gain => {
          if (gain.includes("Ponto de Habilidade")) gainedSkill += 1;
          if (gain.includes("Ponto de Aptidão")) gainedAptitude += 1;
          if (gain.includes("Aumento de Atributo") || gain.includes("Atributo (+1)")) gainedAttr += 1;
          if (gain.includes("Variação da Técnica Inata")) gainedTechnique += 1;
          if (gain.includes("Grau de Treinamento")) {
            if (gain.includes("+3")) gainedTraining += 3;
          }
        });
        
        if (level === 5 && isInato && gains.some(g => g.includes("Bônus de Origem Inato"))) {
          gainedSkill += 1;
        }
      } else {
        if ([4, 8, 12, 16, 20].includes(level)) {
          gainedAttr += 1;
        }
      }
      
      cumulativeAttr += gainedAttr;
      cumulativeSkill += gainedSkill;
      cumulativeAptitude += gainedAptitude;
      cumulativeTechnique += gainedTechnique;
      cumulativeTraining += gainedTraining;
      
      progress.push({
        level,
        gains,
        gained: {
          attribute: gainedAttr,
          skill: gainedSkill,
          aptitude: gainedAptitude,
          technique: gainedTechnique,
          training: gainedTraining
        },
        cumulative: {
          attribute: cumulativeAttr,
          skill: cumulativeSkill,
          aptitude: cumulativeAptitude,
          technique: cumulativeTechnique,
          training: cumulativeTraining
        }
      });
    }
    
    return progress;
  }, [char.level, char.origin]);

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
      
      {/* Detailed Progress Table */}
      <div className="mt-8">
         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
             Progressão por Nível
         </h4>
         <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs max-h-[600px] overflow-y-auto custom-scrollbar">
            {levelProgress.map((entry, index) => {
              // Recalculate used resources to ensure we have current values from character
              // "Pontos de Habilidade" = todas as habilidades (abilities) do personagem
              const currentUsedSkills = char.abilities.length;
              const currentUsedAttr = Math.max(0, (Object.values(char.attributes) as number[]).reduce((a, b) => a + b, 0) - 5);
              const currentUsedTechniques = char.techniques.length;
              // "Pontos de Aptidão" = habilidades que não são passivas
              const currentUsedAptitude = char.abilities.filter(ability => 
                ability.cost && ability.cost.toLowerCase() !== "passivo"
              ).length;
              
              // Calculate used resources up to this level
              // Can't use more than we've gained at that level, but can use up to the total available
              const levelUsedAttr = Math.min(entry.cumulative.attribute, currentUsedAttr);
              const levelUsedSkill = Math.min(entry.cumulative.skill, currentUsedSkills);
              const levelUsedAptitude = Math.min(entry.cumulative.aptitude, currentUsedAptitude);
              const levelUsedTechnique = Math.min(entry.cumulative.technique, currentUsedTechniques);
              
              // Calculate available (gained - used)
              const availableAttr = entry.cumulative.attribute - levelUsedAttr;
              const availableSkill = entry.cumulative.skill - levelUsedSkill;
              const availableAptitude = entry.cumulative.aptitude - levelUsedAptitude;
              const availableTechnique = entry.cumulative.technique - levelUsedTechnique;
              
              return (
                <div key={entry.level} className={`border-b border-slate-900 p-4 ${entry.level === char.level ? 'bg-curse-900/20 border-l-2 border-l-curse-500' : ''}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-12 font-bold font-mono text-lg ${entry.level <= char.level ? 'text-curse-400' : 'text-slate-600'}`}>
                       Lv.{entry.level}
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-300 mb-2 font-medium">
                        {entry.gains.length > 0 ? entry.gains.join(" • ") : "Apenas aumento de status base"}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                        {entry.cumulative.attribute > 0 && (
                          <div className="bg-slate-900/50 rounded p-2 border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase mb-1">Atributo</div>
                            <div className="text-white font-mono text-sm">
                              <span className="text-emerald-400">{levelUsedAttr}</span>/
                              <span className="text-slate-400">{entry.cumulative.attribute}</span>
                            </div>
                            {availableAttr > 0 && (
                              <div className="text-[9px] text-yellow-400 mt-1">
                                Disponível: {availableAttr}
                              </div>
                            )}
                            {availableAttr === 0 && levelUsedAttr >= entry.cumulative.attribute && (
                              <div className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Usado
                              </div>
                            )}
                          </div>
                        )}
                        {entry.cumulative.skill > 0 && (
                          <div className="bg-slate-900/50 rounded p-2 border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase mb-1">Habilidade</div>
                            <div className="text-white font-mono text-sm">
                              <span className="text-emerald-400">{levelUsedSkill}</span>/
                              <span className="text-slate-400">{entry.cumulative.skill}</span>
                            </div>
                            {availableSkill > 0 && (
                              <div className="text-[9px] text-yellow-400 mt-1">
                                Disponível: {availableSkill}
                              </div>
                            )}
                            {availableSkill === 0 && levelUsedSkill >= entry.cumulative.skill && (
                              <div className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Usado
                              </div>
                            )}
                          </div>
                        )}
                        {entry.cumulative.aptitude > 0 && (
                          <div className="bg-slate-900/50 rounded p-2 border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase mb-1">Aptidão</div>
                            <div className="text-white font-mono text-sm">
                              <span className="text-emerald-400">{levelUsedAptitude}</span>/
                              <span className="text-slate-400">{entry.cumulative.aptitude}</span>
                            </div>
                            {availableAptitude > 0 && (
                              <div className="text-[9px] text-yellow-400 mt-1">
                                Disponível: {availableAptitude}
                              </div>
                            )}
                            {availableAptitude === 0 && levelUsedAptitude >= entry.cumulative.aptitude && (
                              <div className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Usado
                              </div>
                            )}
                          </div>
                        )}
                        {entry.cumulative.technique > 0 && (
                          <div className="bg-slate-900/50 rounded p-2 border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase mb-1">Técnica</div>
                            <div className="text-white font-mono text-sm">
                              <span className="text-emerald-400">{levelUsedTechnique}</span>/
                              <span className="text-slate-400">{entry.cumulative.technique}</span>
                            </div>
                            {availableTechnique > 0 && (
                              <div className="text-[9px] text-yellow-400 mt-1">
                                Disponível: {availableTechnique}
                              </div>
                            )}
                            {availableTechnique === 0 && levelUsedTechnique >= entry.cumulative.technique && (
                              <div className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Usado
                              </div>
                            )}
                          </div>
                        )}
                        {entry.gained.training > 0 && (
                          <div className="bg-slate-900/50 rounded p-2 border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase mb-1">Treinamento</div>
                            <div className="text-white font-mono text-sm">
                              <span className="text-slate-400">+{entry.gained.training}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 mt-1">
                              Grau de Treinamento
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
         </div>
      </div>

    </div>
  );
};
