import React, { useMemo, useState } from 'react';
import { Technique } from '../types';
import { ArrowLeft, CheckCircle } from 'lucide-react';

type Props = {
  title: string;
  submitLabel: string;
  onCancel: () => void;
  onCreate: (technique: Technique) => void;
};

export const TechniqueCreatePage: React.FC<Props> = ({ title, submitLabel, onCancel, onCreate }) => {
  const [name, setName] = useState('');
  const [tier, setTier] = useState(1);
  const [actionType, setActionType] = useState('Ação Padrão');
  const [narrative, setNarrative] = useState('');
  const [powerCategory, setPowerCategory] = useState<'Pouco Dano' | 'Dano Médio' | 'Alto Dano'>('Pouco Dano');
  const [peCost, setPeCost] = useState(0);
  const [rangeType, setRangeType] = useState<'Toque' | 'Distância'>('Toque');
  const [rangeValue, setRangeValue] = useState('');
  const [areaType, setAreaType] = useState<'Único Alvo' | 'Cone' | 'Linha' | 'Explosão/Esfera'>('Único Alvo');
  const [areaValue, setAreaValue] = useState('');
  const [resistanceTest, setResistanceTest] = useState<'Fortitude' | 'Reflexos' | 'Vontade' | 'Nenhum'>('Nenhum');
  const [successEffect, setSuccessEffect] = useState('');
  const [conditionApplied, setConditionApplied] = useState<'Nenhuma' | 'Atordoado' | 'Paralisado' | 'Eletrizado' | 'Vulnerável'>('Nenhuma');
  const [guaranteedHit, setGuaranteedHit] = useState(false);
  const [consumesCharges, setConsumesCharges] = useState(false);
  const [causesExhaustion, setCausesExhaustion] = useState(false);

  const baseDie = useMemo(() => {
    if (powerCategory === 'Alto Dano') return 'd8';
    if (powerCategory === 'Dano Médio') return 'd6';
    return 'd4';
  }, [powerCategory]);

  const buildSummary = () => {
    const rangeText =
      rangeType === 'Toque'
        ? 'Toque (Adjacente)'
        : rangeValue
        ? `Distância (${rangeValue})`
        : '';
    const areaText =
      areaType === 'Único Alvo'
        ? 'Único Alvo'
        : areaValue
        ? `${areaType} (${areaValue})`
        : '';
    const modifiers = [
      guaranteedHit ? 'Acerto Garantido' : null,
      consumesCharges ? 'Consome Cargas' : null,
      causesExhaustion ? 'Causa Exaustão' : null
    ].filter(Boolean) as string[];
    const lines = [
      `Potência: ${powerCategory} (${baseDie})`,
      `Eficiência: 1 dado a cada 3 CE`,
      peCost > 0 ? `Custo PE: ${peCost}` : null,
      rangeText ? `Alcance: ${rangeText}` : null,
      areaText ? `Área: ${areaText}` : null,
      resistanceTest !== 'Nenhum' ? `Resistência: ${resistanceTest}` : null,
      successEffect.trim() ? `Sucesso: ${successEffect}` : null,
      conditionApplied !== 'Nenhuma' ? `Condição: ${conditionApplied}` : null,
      modifiers.length ? `Modificadores: ${modifiers.join(', ')}` : null
    ].filter(Boolean) as string[];
    return lines.join('\n');
  };

  const handleSubmit = () => {
    const techniqueId = Math.random().toString(36).substring(2, 9);
    const subId = Math.random().toString(36).substring(2, 9);
    const summary = buildSummary();
    const subName = name.trim() || 'Nova Técnica';
    const rangeText = rangeType === 'Toque' ? 'Toque' : `Distância ${rangeValue || '0m'}`;

    const technique: Technique = {
      id: techniqueId,
      name: subName,
      category: 'Inata',
      description: narrative.trim() || 'Descrição narrativa não informada.',
      subTechniques: [
        {
          id: subId,
          name: subName,
          description: summary,
          usage: actionType,
          diceFace: baseDie,
          range: rangeText,
          tierLabel: `TIER ${tier}`,
          powerCategory,
          efficiency: '1:3',
          peCost,
          tier,
          rangeType,
          rangeValue,
          areaType,
          areaValue,
          resistanceTest,
          successEffect,
          conditionApplied,
          guaranteedHit,
          consumesCharges,
          causesExhaustion
        }
      ]
    };

    onCreate(technique);
  };

  return (
    <div className="bg-slate-900 w-full h-full flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors duration-100 p-2 hover:bg-slate-800 rounded-lg"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-400 mt-1">Preencha os campos para gerar a técnica completa</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors duration-100 font-bold text-sm"
        >
          <CheckCircle size={16} /> {submitLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informações Básicas</h3>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Habilidade</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Descarga Atmosférica"
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tier (Grau de Refinamento)</label>
              <select
                value={tier}
                onChange={(e) => setTier(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Ação</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
              >
                {['Ação Padrão', 'Movimento', 'Livre', 'Reação', 'Completa'].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição Narrativa</label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Descreva o efeito visual e o flavor da técnica..."
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-curse-500 focus:outline-none min-h-[90px]"
            />
          </div>
        </section>

        <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuração de Dano e Energia</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria de Potência</label>
              <select
                value={powerCategory}
                onChange={(e) => setPowerCategory(e.target.value as 'Pouco Dano' | 'Dano Médio' | 'Alto Dano')}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
              >
                <option value="Pouco Dano">Pouco Dano (1d4)</option>
                <option value="Dano Médio">Dano Médio (1d6)</option>
                <option value="Alto Dano">Alto Dano (1d8)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dado Inicial</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-sm text-slate-300 font-mono">
                {baseDie}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Eficiência de Conversão</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-sm text-slate-300 font-mono">
                1:3 (1 dado a cada 3 CE)
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custo de PE</label>
              <input
                type="number"
                min={0}
                value={peCost}
                onChange={(e) => setPeCost(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alcance, Área e Alvos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Alcance</label>
              <select
                value={rangeType}
                onChange={(e) => setRangeType(e.target.value as 'Toque' | 'Distância')}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
              >
                <option value="Toque">Toque (Adjacente)</option>
                <option value="Distância">Distância</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor (metros)</label>
              <input
                type="text"
                value={rangeType === 'Distância' ? rangeValue : ''}
                onChange={(e) => setRangeValue(e.target.value)}
                disabled={rangeType !== 'Distância'}
                placeholder="Ex: 9m, 12m, 30m"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none disabled:text-slate-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Formato da Área</label>
              <select
                value={areaType}
                onChange={(e) => setAreaType(e.target.value as 'Único Alvo' | 'Cone' | 'Linha' | 'Explosão/Esfera')}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
              >
                <option value="Único Alvo">Único Alvo</option>
                <option value="Cone">Cone</option>
                <option value="Linha">Linha</option>
                <option value="Explosão/Esfera">Explosão/Esfera</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor (metros)</label>
              <input
                type="text"
                value={areaType === 'Único Alvo' ? '' : areaValue}
                onChange={(e) => setAreaValue(e.target.value)}
                disabled={areaType === 'Único Alvo'}
                placeholder="Ex: 3m, 6m"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none disabled:text-slate-600"
              />
            </div>
          </div>
        </section>

        <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Defesa e Condições</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teste de Resistência do Alvo</label>
              <select
                value={resistanceTest}
                onChange={(e) => setResistanceTest(e.target.value as 'Fortitude' | 'Reflexos' | 'Vontade' | 'Nenhum')}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
              >
                <option value="Nenhum">Nenhum</option>
                <option value="Fortitude">Fortitude</option>
                <option value="Reflexos">Reflexos</option>
                <option value="Vontade">Vontade</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Efeito em Sucesso</label>
              <input
                type="text"
                value={successEffect}
                onChange={(e) => setSuccessEffect(e.target.value)}
                placeholder="Ex: Metade do dano"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Condição Aplicada</label>
            <select
              value={conditionApplied}
              onChange={(e) => setConditionApplied(e.target.value as 'Nenhuma' | 'Atordoado' | 'Paralisado' | 'Eletrizado' | 'Vulnerável')}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
            >
              <option value="Nenhuma">Nenhuma</option>
              <option value="Atordoado">Atordoado</option>
              <option value="Paralisado">Paralisado</option>
              <option value="Eletrizado">Eletrizado</option>
              <option value="Vulnerável">Vulnerável</option>
            </select>
          </div>
        </section>

        <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modificadores Especiais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-200">
            <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-2">
              <input
                type="checkbox"
                checked={guaranteedHit}
                onChange={(e) => setGuaranteedHit(e.target.checked)}
                className="accent-curse-500"
              />
              Acerto Garantido
            </label>
            <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-2">
              <input
                type="checkbox"
                checked={consumesCharges}
                onChange={(e) => setConsumesCharges(e.target.checked)}
                className="accent-curse-500"
              />
              Consome Cargas
            </label>
            <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-2">
              <input
                type="checkbox"
                checked={causesExhaustion}
                onChange={(e) => setCausesExhaustion(e.target.checked)}
                className="accent-curse-500"
              />
              Causa Exaustão
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};
