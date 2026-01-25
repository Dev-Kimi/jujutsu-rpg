import React, { useMemo, useState } from 'react';
import { Technique } from '../types';
import { ArrowLeft, CheckCircle } from 'lucide-react';

type Props = {
  title: string;
  submitLabel: string;
  onCancel: () => void;
  onCreate: (technique: Technique) => void;
  initialTechnique?: Technique;
};

export const TechniqueCreatePage: React.FC<Props> = ({ title, submitLabel, onCancel, onCreate, initialTechnique }) => {
  const [techName, setTechName] = useState(initialTechnique?.name || '');
  const [techDescription, setTechDescription] = useState(initialTechnique?.description || '');
  const [subForms, setSubForms] = useState<Array<{
    id?: string;
    name: string;
    usage: string;
    tier: number;
    diceFace: string;
    peCost: number;
    rangeType: 'Toque' | 'Distância';
    rangeValue: string;
    areaType: 'Único Alvo' | 'Cone' | 'Linha' | 'Explosão/Esfera';
    areaValue: string;
    resistanceTest: 'Fortitude' | 'Reflexos' | 'Vontade' | 'Nenhum';
    successEffect: string;
    conditionApplied: 'Nenhuma' | 'Atordoado' | 'Paralisado' | 'Eletrizado' | 'Vulnerável';
    guaranteedHit: boolean;
    consumesCharges: boolean;
    causesExhaustion: boolean;
    description: string;
  }>>(initialTechnique
    ? (initialTechnique.subTechniques || []).map(st => ({
        id: st.id,
        name: st.name || '',
        usage: st.usage || 'Ação Padrão',
        tier: st.tier || 1,
        diceFace: st.diceFace || 'd6',
        peCost: typeof st.peCost === 'number' ? st.peCost : 0,
        rangeType: st.rangeType === 'Distância' ? 'Distância' : 'Toque',
        rangeValue: st.rangeValue || '',
        areaType: st.areaType || 'Único Alvo',
        areaValue: st.areaValue || '',
        resistanceTest: st.resistanceTest || 'Nenhum',
        successEffect: st.successEffect || '',
        conditionApplied: st.conditionApplied || 'Nenhuma',
        guaranteedHit: !!st.guaranteedHit,
        consumesCharges: !!st.consumesCharges,
        causesExhaustion: !!st.causesExhaustion,
        description: st.description || ''
      }))
    : [{
        name: '',
        usage: 'Ação Padrão',
        tier: 1,
        diceFace: 'd6',
        peCost: 0,
        rangeType: 'Toque',
        rangeValue: '',
        areaType: 'Único Alvo',
        areaValue: '',
        resistanceTest: 'Nenhum',
        successEffect: '',
        conditionApplied: 'Nenhuma',
        guaranteedHit: false,
        consumesCharges: false,
        causesExhaustion: false,
        description: ''
      }]);
  const addSubForm = () => {
    setSubForms(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 9),
      name: '',
      usage: 'Ação Padrão',
      tier: 1,
      diceFace: 'd6',
      peCost: 0,
      rangeType: 'Toque',
      rangeValue: '',
      areaType: 'Único Alvo',
      areaValue: '',
      resistanceTest: 'Nenhum',
      successEffect: '',
      conditionApplied: 'Nenhuma',
      guaranteedHit: false,
      consumesCharges: false,
      causesExhaustion: false,
      description: ''
    }]);
  };
  const updateForm = (index: number, field: string, value: any) => {
    setSubForms(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };
  const removeForm = (index: number) => {
    setSubForms(prev => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = () => {
    const techniqueId = initialTechnique?.id || Math.random().toString(36).substring(2, 9);
    const subTechniques = subForms.map(f => {
      const subId = f.id || Math.random().toString(36).substring(2, 9);
      const rangeText = f.rangeType === 'Toque' ? 'Toque' : `Distância ${f.rangeValue || '0m'}`;
      return {
        id: subId,
        name: f.name.trim() || 'Nova Habilidade',
        description: f.description || '',
        usage: f.usage,
        diceFace: f.diceFace,
        range: rangeText,
        tierLabel: `TIER ${f.tier}`,
        peCost: f.peCost,
        tier: f.tier,
        rangeType: f.rangeType,
        rangeValue: f.rangeValue,
        areaType: f.areaType,
        areaValue: f.areaValue,
        resistanceTest: f.resistanceTest,
        successEffect: f.successEffect,
        conditionApplied: f.conditionApplied,
        guaranteedHit: f.guaranteedHit,
        consumesCharges: f.consumesCharges,
        causesExhaustion: f.causesExhaustion
      };
    });
    const technique: Technique = {
      id: techniqueId,
      name: techName.trim() || 'Nova Técnica',
      category: 'Inata',
      description: techDescription.trim() || 'Descrição narrativa não informada.',
      subTechniques
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
            <p className="text-xs text-slate-400 mt-1">Preencha nome e descrição da técnica e configure suas extensões</p>
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Técnica Principal</h3>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Técnica</label>
            <input
              type="text"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              placeholder="Ex: Descarga Atmosférica"
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição da Técnica</label>
            <textarea
              value={techDescription}
              onChange={(e) => setTechDescription(e.target.value)}
              placeholder="Descreva o efeito visual e o flavor da técnica..."
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-curse-500 focus:outline-none min-h-[90px]"
            />
          </div>
        </section>

        <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Extensões</h3>
          <div className="flex justify-end">
            <button
              onClick={addSubForm}
              className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors duration-100 font-bold"
            >
              Adicionar Extensão
            </button>
          </div>
          <div className="space-y-4">
            {subForms.map((f, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Habilidade</label>
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) => updateForm(idx, 'name', e.target.value)}
                      placeholder="Ex: Lâmina de Sangue"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Ação</label>
                    <select
                      value={f.usage}
                      onChange={(e) => updateForm(idx, 'usage', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    >
                      {['Ação Padrão', 'Movimento', 'Livre', 'Reação', 'Completa'].map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tier</label>
                    <select
                      value={f.tier}
                      onChange={(e) => updateForm(idx, 'tier', parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dado</label>
                    <select
                      value={f.diceFace}
                      onChange={(e) => updateForm(idx, 'diceFace', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    >
                      {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map(v => (<option key={v} value={v}>{v}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custo de PE</label>
                    <input
                      type="number"
                      min={0}
                      value={f.peCost}
                      onChange={(e) => updateForm(idx, 'peCost', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Alcance</label>
                    <select
                      value={f.rangeType}
                      onChange={(e) => updateForm(idx, 'rangeType', e.target.value)}
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
                      value={f.rangeType === 'Distância' ? f.rangeValue : ''}
                      onChange={(e) => updateForm(idx, 'rangeValue', e.target.value)}
                      disabled={f.rangeType !== 'Distância'}
                      placeholder="Ex: 9m, 12m, 30m"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none disabled:text-slate-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Formato da Área</label>
                    <select
                      value={f.areaType}
                      onChange={(e) => updateForm(idx, 'areaType', e.target.value)}
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
                      value={f.areaType === 'Único Alvo' ? '' : f.areaValue}
                      onChange={(e) => updateForm(idx, 'areaValue', e.target.value)}
                      disabled={f.areaType === 'Único Alvo'}
                      placeholder="Ex: 3m, 6m"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none disabled:text-slate-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teste de Resistência do Alvo</label>
                    <select
                      value={f.resistanceTest}
                      onChange={(e) => updateForm(idx, 'resistanceTest', e.target.value)}
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
                      value={f.successEffect}
                      onChange={(e) => updateForm(idx, 'successEffect', e.target.value)}
                      placeholder="Ex: Metade do dano"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Condição Aplicada</label>
                  <select
                    value={f.conditionApplied}
                    onChange={(e) => updateForm(idx, 'conditionApplied', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-curse-500 focus:outline-none"
                  >
                    <option value="Nenhuma">Nenhuma</option>
                    <option value="Atordoado">Atordoado</option>
                    <option value="Paralisado">Paralisado</option>
                    <option value="Eletrizado">Eletrizado</option>
                    <option value="Vulnerável">Vulnerável</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-200">
                  <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-2">
                    <input
                      type="checkbox"
                      checked={f.guaranteedHit}
                      onChange={(e) => updateForm(idx, 'guaranteedHit', e.target.checked)}
                      className="accent-curse-500"
                    />
                    Acerto Garantido
                  </label>
                  <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-2">
                    <input
                      type="checkbox"
                      checked={f.consumesCharges}
                      onChange={(e) => updateForm(idx, 'consumesCharges', e.target.checked)}
                      className="accent-curse-500"
                    />
                    Consome Cargas
                  </label>
                  <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-2">
                    <input
                      type="checkbox"
                      checked={f.causesExhaustion}
                      onChange={(e) => updateForm(idx, 'causesExhaustion', e.target.checked)}
                      className="accent-curse-500"
                    />
                    Causa Exaustão
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição da Habilidade</label>
                  <textarea
                    value={f.description}
                    onChange={(e) => updateForm(idx, 'description', e.target.value)}
                    placeholder="Descreva os efeitos, alcance, custo, cooldown etc..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-curse-500 focus:outline-none min-h-[60px]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => removeForm(idx)}
                    className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-950/30 transition-colors duration-100"
                  >
                    Remover Extensão
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
