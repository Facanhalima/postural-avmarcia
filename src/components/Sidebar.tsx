import React, { useEffect, useState } from 'react';
import { ResultsPanel } from './ResultsPanel';
import { SessionProgress } from './SessionProgress';
import { usePDFGenerator } from '../hooks/usePDFGenerator';
import type { BodyCompositionData, PerimetryData, PostureAnalysis, PatientData, SessionData } from '../types';

const PERIMETRY_FIELDS: Array<{ key: keyof PerimetryData; label: string }> = [
  { key: 'ombro', label: 'Ombro' },
  { key: 'torax', label: 'Torax' },
  { key: 'cintura', label: 'Cintura' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'quadril', label: 'Quadril' },
  { key: 'bracoDireitoRelaxado', label: 'Braco direito (relaxado)' },
  { key: 'bracoEsquerdoRelaxado', label: 'Braco esquerdo (relaxado)' },
  { key: 'bracoDireitoContraido', label: 'Braco direito (contraido)' },
  { key: 'bracoEsquerdoContraido', label: 'Braco esquerdo (contraido)' },
  { key: 'antebracoDireito', label: 'Antebraco direito' },
  { key: 'antebracoEsquerdo', label: 'Antebraco esquerdo' },
  { key: 'coxaDireitaProximal', label: 'Coxa direita (proximal)' },
  { key: 'coxaEsquerdaProximal', label: 'Coxa esquerda (proximal)' },
  { key: 'coxaDireitaMedial', label: 'Coxa direita (medial)' },
  { key: 'coxaEsquerdaMedial', label: 'Coxa esquerda (medial)' },
  { key: 'panturrilhaDireita', label: 'Panturrilha direita' },
  { key: 'panturrilhaEsquerda', label: 'Panturrilha esquerda' }
];

const BODY_COMPOSITION_FIELDS: Array<{
  key: Exclude<keyof BodyCompositionData, 'biotipo'>;
  label: string;
  unit?: string;
  type?: 'number' | 'text';
  step?: string;
  readOnly?: boolean;
}> = [
  { key: 'peso', label: 'Peso', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'imc', label: 'IMC', type: 'text', readOnly: true },
  { key: 'icq', label: 'ICQ (Cintura/Quadril)', type: 'text', readOnly: true },
  { key: 'riscoIcq', label: 'Risco do ICQ', type: 'text', readOnly: true },
  //{ key: 'padraoGorduraCorporal', label: 'Padrão de Gordura Corporal', type: 'text', readOnly: true },
  { key: 'gorduraCorporal', label: 'Gordura Corporal', unit: '%', type: 'number', step: '0.1' },
  { key: 'taxaMuscular', label: 'Taxa Muscular', unit: '%', type: 'number', step: '0.1' },
  { key: 'massaCorporalMagra', label: 'Massa Corporal Magra', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'gorduraSubcutanea', label: 'Gordura Subcutânea', unit: '%', type: 'number', step: '0.1' },
  { key: 'gorduraVisceral', label: 'Gordura Visceral', type: 'number', step: '0.1' },
  { key: 'aguaCorporal', label: 'Água Corporal', unit: '%', type: 'number', step: '0.1' },
  { key: 'musculoEsqueletico', label: 'Músculo Esquelético', unit: '%', type: 'number', step: '0.1' },
  { key: 'massaMuscular', label: 'Massa Muscular', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'massaOssea', label: 'Massa Óssea', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'proteina', label: 'Proteína', unit: '%', type: 'number', step: '0.1' },
  { key: 'tmb', label: 'TMB', unit: 'kcal', type: 'number', step: '1' },
  { key: 'idadeCorporal', label: 'Idade Corporal', type: 'number', step: '1' },
  { key: 'massaGorda', label: 'Massa Gorda', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'pesoDaAgua', label: 'Peso da Água', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'massaDeProteina', label: 'Massa de Proteína', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'pesoCorporalIdeal', label: 'Peso Corporal Ideal', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'nivelObesidade', label: 'Nível de Obesidade', type: 'text', readOnly: true }
];

type IcqRiskBand = {
  minAge: number;
  maxAge: number;
  lowMax: number;
  moderateMax: number;
  highMax: number;
};

type BiotypeKey = 'ectomorfo' | 'mesomorfo' | 'endomorfo';

const BIOTYPE_CHARACTERISTICS: Record<BiotypeKey, { title: string; traits: string[]; metabolismo: string; foco: string }> = {
  ectomorfo: {
    title: 'Ectomorfo',
    traits: ['Esguio', 'Ombros estreitos', 'Quadris estreitos', 'Braços longos', 'Pernas longas'],
    metabolismo: 'Rápido, com dificuldade de ganhar peso e massa muscular.',
    foco: 'Treino de força intenso, alta ingestão calórica e de carboidratos.'
  },
  mesomorfo: {
    title: 'Mesomorfo',
    traits: ['Estrutura óssea grande', 'Ombros largos', 'Cintura fina'],
    metabolismo: 'Equilibrado, com facilidade de ganhar massa muscular e perder gordura.',
    foco: 'Manutenção com treinos moderados a intensos e dieta equilibrada.'
  },
  endomorfo: {
    title: 'Endomorfo',
    traits: ['Corpo arredondado', 'Cintura larga', 'Ossos grandes'],
    metabolismo: 'Lento, com facilidade para ganhar gordura e dificuldade para perdê-la.',
    foco: 'Treino de força combinado com cardio, controle calórico e foco em proteínas.'
  }
};

const extractDetectedBiotype = (biotypeText: string): BiotypeKey | null => {
  const normalized = biotypeText.toLowerCase();
  if (normalized.includes('predominância de ectomorfo')) return 'ectomorfo';
  if (normalized.includes('predominância de mesomorfo')) return 'mesomorfo';
  if (normalized.includes('predominância de endomorfo')) return 'endomorfo';
  if (normalized.includes('ectomorfo')) return 'ectomorfo';
  if (normalized.includes('mesomorfo')) return 'mesomorfo';
  if (normalized.includes('endomorfo')) return 'endomorfo';
  return null;
};

const ICQ_RISK_TABLE: Record<'homem' | 'mulher', IcqRiskBand[]> = {
  mulher: [
    { minAge: 20, maxAge: 29, lowMax: 0.71, moderateMax: 0.77, highMax: 0.82 },
    { minAge: 30, maxAge: 39, lowMax: 0.72, moderateMax: 0.78, highMax: 0.84 },
    { minAge: 40, maxAge: 49, lowMax: 0.73, moderateMax: 0.79, highMax: 0.87 },
    { minAge: 50, maxAge: 59, lowMax: 0.74, moderateMax: 0.81, highMax: 0.88 },
    { minAge: 60, maxAge: 69, lowMax: 0.76, moderateMax: 0.83, highMax: 0.9 }
  ],
  homem: [
    { minAge: 20, maxAge: 29, lowMax: 0.83, moderateMax: 0.88, highMax: 0.94 },
    { minAge: 30, maxAge: 39, lowMax: 0.84, moderateMax: 0.91, highMax: 0.96 },
    { minAge: 40, maxAge: 49, lowMax: 0.88, moderateMax: 0.95, highMax: 1.0 },
    { minAge: 50, maxAge: 59, lowMax: 0.9, moderateMax: 0.96, highMax: 1.02 },
    { minAge: 60, maxAge: 69, lowMax: 0.91, moderateMax: 0.98, highMax: 1.03 }
  ]
};

const classifyIcqRisk = (sexo: '' | 'homem' | 'mulher', idade: string, icq: string): string => {
  if (!sexo) return '';

  const ageValue = Number.parseInt(idade, 10);
  const icqValue = Number.parseFloat(icq.replace(',', '.'));
  if (!Number.isFinite(ageValue) || !Number.isFinite(icqValue)) return '';

  const band = ICQ_RISK_TABLE[sexo].find((item) => ageValue >= item.minAge && ageValue <= item.maxAge);
  if (!band) return 'Sem referência para esta idade (20-69 anos)';

  if (icqValue < band.lowMax) return 'Baixo';
  if (icqValue <= band.moderateMax) return 'Moderado';
  if (icqValue <= band.highMax) return 'Alto';
  return 'Muito Alto';
};

const classifyImcObesityLevel = (imc: number): string => {
  if (imc < 18.5) return 'Magreza (Grau 0)';
  if (imc <= 24.9) return 'Normal (Grau 0)';
  if (imc <= 29.9) return 'Sobrepeso (Grau 1)';
  if (imc <= 39.9) return 'Obesidade (Grau 2)';
  return 'Obesidade Grave (Grau 3)';
};

const calculateMaxHeartRate = (idade: string): number | null => {
  const ageValue = Number.parseInt(idade, 10);
  if (!Number.isFinite(ageValue) || ageValue <= 0) return null;
  return 208 - (0.7 * ageValue);
};

interface SidebarProps {
  currentAnalysis: PostureAnalysis;
  estimatedBiotype: string;
  sessionData: SessionData;
  currentPositionLabel: string;
  currentInstruction: string;
  progressPercentage: number;
  totalSteps: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentAnalysis,
  estimatedBiotype,
  sessionData,
  currentPositionLabel,
  currentInstruction,
  progressPercentage,
  totalSteps
}) => {
  const [biotypeEventInfo, setBiotypeEventInfo] = useState({
    sampleCount: 0,
    lastUpdated: '--'
  });

  const detectedBiotype = extractDetectedBiotype(estimatedBiotype);
  const detectedBiotypeProfile = detectedBiotype ? BIOTYPE_CHARACTERISTICS[detectedBiotype] : null;

  const [patientData, setPatientData] = useState<PatientData>({
    nome: '',
    sexo: '',
    altura: '',
    idade: '',
    queixa: '',
    composicaoCorporal: {
      biotipo: '',
      peso: '',
      imc: '',
      icq: '',
      riscoIcq: '',
      padraoGorduraCorporal: '',
      gorduraCorporal: '',
      taxaMuscular: '',
      massaCorporalMagra: '',
      gorduraSubcutanea: '',
      gorduraVisceral: '',
      aguaCorporal: '',
      musculoEsqueletico: '',
      massaMuscular: '',
      massaOssea: '',
      proteina: '',
      tmb: '',
      idadeCorporal: '',
      massaGorda: '',
      pesoDaAgua: '',
      massaDeProteina: '',
      pesoCorporalIdeal: '',
      nivelObesidade: ''
    },
    perimetria: {
      ombro: '',
      torax: '',
      cintura: '',
      abdomen: '',
      quadril: '',
      bracoDireitoRelaxado: '',
      bracoEsquerdoRelaxado: '',
      bracoDireitoContraido: '',
      bracoEsquerdoContraido: '',
      antebracoDireito: '',
      antebracoEsquerdo: '',
      coxaDireitaProximal: '',
      coxaEsquerdaProximal: '',
      coxaDireitaMedial: '',
      coxaEsquerdaMedial: '',
      panturrilhaDireita: '',
      panturrilhaEsquerda: ''
    }
  });

  const maxHeartRate = calculateMaxHeartRate(patientData.idade);
  const heartRateZones = maxHeartRate
    ? [100, 90, 80, 70, 60, 50].map((percentage) => ({
        percentage,
        bpm: Math.round(maxHeartRate * (percentage / 100))
      }))
    : [];

  const { generateConsolidatedReport } = usePDFGenerator();

  useEffect(() => {
    const hasSuggestion =
      estimatedBiotype &&
      !estimatedBiotype.toLowerCase().includes('aguardando') &&
      !estimatedBiotype.toLowerCase().includes('coletando');

    if (!hasSuggestion) return;

    setPatientData(prev => ({
      ...prev,
      composicaoCorporal: {
        ...prev.composicaoCorporal,
        biotipo: estimatedBiotype
      }
    }));
  }, [estimatedBiotype]);

  useEffect(() => {
    const onMonitoringEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ biotype?: string; sampleCount?: number; timestamp?: string }>;
      const detail = customEvent.detail ?? {};
      if (!detail.timestamp) return;

      const formattedTime = new Date(detail.timestamp).toLocaleTimeString('pt-BR');
      setBiotypeEventInfo({
        sampleCount: detail.sampleCount ?? 0,
        lastUpdated: formattedTime
      });
    };

    window.addEventListener('biotype-monitoring', onMonitoringEvent);
    return () => window.removeEventListener('biotype-monitoring', onMonitoringEvent);
  }, []);

  useEffect(() => {
    const parseMeasure = (raw: string): number => {
      const normalized = raw.replace(',', '.').trim();
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : NaN;
    };

    const cintura = parseMeasure(patientData.perimetria.cintura);
    const quadril = parseMeasure(patientData.perimetria.quadril);
    const peso = parseMeasure(patientData.composicaoCorporal.peso);
    const altura = parseMeasure(patientData.altura);

    const nextIcq = Number.isFinite(cintura) && Number.isFinite(quadril) && quadril > 0
      ? (cintura / quadril).toFixed(2).replace('.', ',')
      : '';

    const nextImcNumeric = Number.isFinite(peso) && Number.isFinite(altura) && altura > 0
      ? peso / (altura * altura)
      : NaN;
    const nextImc = Number.isFinite(nextImcNumeric)
      ? nextImcNumeric.toFixed(1).replace('.', ',')
      : '';
    const nextObesityLevel = Number.isFinite(nextImcNumeric)
      ? classifyImcObesityLevel(nextImcNumeric)
      : '';

    const nextPattern = Number.isFinite(cintura) && Number.isFinite(quadril)
      ? (cintura > quadril ? 'Androide' : cintura < quadril ? 'Ginoide' : 'Indeterminado')
      : '';

    const nextRisk = classifyIcqRisk(patientData.sexo, patientData.idade, nextIcq);

    setPatientData(prev => {
      if (
        prev.composicaoCorporal.icq === nextIcq &&
        prev.composicaoCorporal.imc === nextImc &&
        prev.composicaoCorporal.nivelObesidade === nextObesityLevel &&
        prev.composicaoCorporal.padraoGorduraCorporal === nextPattern &&
        prev.composicaoCorporal.riscoIcq === nextRisk
      ) {
        return prev;
      }

      return {
        ...prev,
        composicaoCorporal: {
          ...prev.composicaoCorporal,
          imc: nextImc,
          icq: nextIcq,
          nivelObesidade: nextObesityLevel,
          padraoGorduraCorporal: nextPattern,
          riscoIcq: nextRisk
        }
      };
    });
  }, [
    patientData.perimetria.cintura,
    patientData.perimetria.quadril,
    patientData.composicaoCorporal.peso,
    patientData.altura,
    patientData.sexo,
    patientData.idade
  ]);

  const handleInputChange = (field: 'nome' | 'sexo' | 'altura' | 'idade' | 'queixa', value: string) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBodyCompositionChange = (field: keyof BodyCompositionData, value: string) => {
    setPatientData(prev => ({
      ...prev,
      composicaoCorporal: {
        ...prev.composicaoCorporal,
        [field]: value
      }
    }));
  };

  const handlePerimetryChange = (field: keyof PerimetryData, value: string) => {
    setPatientData(prev => ({
      ...prev,
      perimetria: {
        ...prev.perimetria,
        [field]: value
      }
    }));
  };

  const handleGenerateReport = () => {
    if (sessionData.isComplete && sessionData.consolidatedAnalysis) {
      generateConsolidatedReport(patientData, sessionData);
    }
  };

  return (
    <div className="w-full xl:max-w-[380px] flex flex-col gap-4 border-b xl:border-b-0 xl:border-r border-gray-200 pb-4 xl:pb-0 xl:pr-5 order-2 xl:order-1">
      <h2 className="text-primary text-xl font-semibold mb-0">Avaliação Clínica</h2>
      
      {/* Dados do Paciente */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Nome do Paciente"
          value={patientData.nome}
          onChange={(e) => handleInputChange('nome', e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
        
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="Altura (m)"
          value={patientData.altura}
          onChange={(e) => handleInputChange('altura', e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />

        <input
          type="number"
          placeholder="Idade"
          value={patientData.idade}
          onChange={(e) => handleInputChange('idade', e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />

        <select
          value={patientData.sexo}
          onChange={(e) => handleInputChange('sexo', e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="">Sexo do paciente</option>
          <option value="homem">Homem</option>
          <option value="mulher">Mulher</option>
        </select>
        
        <textarea
          placeholder="Queixa principal e histórico..."
          value={patientData.queixa}
          onChange={(e) => handleInputChange('queixa', e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md resize-none h-20 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />

        <div className="rounded-lg border border-rose-300 bg-gradient-to-r from-rose-50 to-orange-50 p-3 shadow-sm">
          <p className="text-xs text-rose-900 font-semibold tracking-wide">
            FREQUENCIA CARDIACA MAXIMA
          </p>
          <p className="text-[11px] text-rose-800 mt-1">
            Formula: Maxima = 208 - (0,7 x idade)
          </p>
          <p className="text-sm text-rose-900 font-semibold mt-2">
            {maxHeartRate ? `${maxHeartRate.toFixed(1).replace('.', ',')} bpm` : 'Informe a idade para calcular'}
          </p>

          {heartRateZones.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {heartRateZones.map(({ percentage, bpm }) => (
                <div key={percentage} className="rounded-md border border-rose-200 bg-white/70 p-2 text-center">
                  <p className="text-xs font-semibold text-rose-900">{percentage}%</p>
                  <p className="text-sm text-rose-800">{bpm} bpm</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 shadow-sm">
              <p className="text-xs text-amber-900 font-semibold tracking-wide">
                BIOTIPO MONITORADO PELA CAMERA
              </p>
              <p className="text-sm text-amber-800 mt-1">
                {estimatedBiotype}
              </p>
              <p className="text-[11px] text-amber-700 mt-2">
                Importancia: o biotipo orienta a interpretacao de proporcoes corporais, ganho/perda de massa e personalizacao da conduta terapeutica.
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                Monitoramento ativo: {biotypeEventInfo.sampleCount} amostras | ultima atualizacao: {biotypeEventInfo.lastUpdated}
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                Estimativa automatica baseada em landmarks. Confirmar com avaliacao clinica e antropometrica.
              </p>

              {detectedBiotypeProfile && (
                <div className="mt-3 border-t border-amber-200 pt-2">
                  <p className="text-xs font-semibold text-amber-900">
                    Características do biotipo detectado ({detectedBiotypeProfile.title})
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1">
                    {detectedBiotypeProfile.traits.join(' | ')}
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1">
                    <span className="font-semibold">Metabolismo:</span> {detectedBiotypeProfile.metabolismo}
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1">
                    <span className="font-semibold">Foco:</span> {detectedBiotypeProfile.foco}
                  </p>
                </div>
              )}
        </div>

        <div className="rounded-lg border border-sky-300 bg-gradient-to-r from-sky-50 to-cyan-50 p-3 shadow-sm">
          <p className="text-xs text-sky-900 font-semibold tracking-wide">
            PADRÃO DE GORDURA CORPORAL
          </p>
          <p className="text-sm text-sky-800 mt-1">
            {patientData.composicaoCorporal.padraoGorduraCorporal || 'Aguardando medidas de cintura e quadril...'}
          </p>
          <p className="text-[11px] text-sky-700 mt-2">
            Androide: cintura maior que quadril, com maior concentracao de gordura visceral abdominal e maior risco metabolico e cardiovascular.
          </p>
          <p className="text-[11px] text-sky-700 mt-1">
            Ginoide: cintura menor que quadril, com predominio gluteo-femoral, menor impacto metabolico e possiveis implicacoes ortopedicas.
          </p>
          <p className="text-[11px] text-sky-700 mt-1">
            Classificacao calculada automaticamente a partir da perimetria.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Composicao Corporal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BODY_COMPOSITION_FIELDS.map(({ key, label, unit, type = 'number', step = '0.1', readOnly = false }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">{label}{unit ? ` (${unit})` : ''}</label>
                <div className="flex items-center gap-1">
                  <input
                    type={type}
                    step={type === 'number' ? step : undefined}
                    inputMode={type === 'number' ? 'decimal' : undefined}
                    placeholder={readOnly ? 'Calculado automaticamente' : type === 'number' ? '0,0' : 'Preencher'}
                    value={patientData.composicaoCorporal[key]}
                    readOnly={readOnly}
                    onChange={(e) => handleBodyCompositionChange(key, e.target.value)}
                    className={`w-full p-2 border rounded-md text-sm outline-none ${
                      readOnly
                        ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'
                        : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
                    }`}
                  />
                  {unit && (
                    <span className="text-xs text-gray-500 min-w-10 text-center">{unit}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Perimetria (cm)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PERIMETRY_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="0,0"
                  value={patientData.perimetria[key]}
                  onChange={(e) => handlePerimetryChange(key, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progresso da Sessão */}
      <SessionProgress
        sessionData={sessionData}
        currentPositionLabel={currentPositionLabel}
        currentInstruction={currentInstruction}
        progressPercentage={progressPercentage}
        totalSteps={totalSteps}
      />
      
      {/* Análise da Posição Atual */}
      {!sessionData.isComplete && (
        <ResultsPanel 
          analysis={currentAnalysis} 
          currentPosition={sessionData.currentPosition}
        />
      )}

      {/* Análise Consolidada Final */}
      {sessionData.isComplete && sessionData.consolidatedAnalysis && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">Análise Consolidada</h3>
          
          <div className="mb-3">
            <p className="text-sm text-blue-700 mb-2">
              <strong>Avaliação Geral:</strong> {sessionData.consolidatedAnalysis.geral}
            </p>
            <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              sessionData.consolidatedAnalysis.severidade === 'severa' 
                ? 'bg-red-100 text-red-800'
                : sessionData.consolidatedAnalysis.severidade === 'moderada'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
            }`}>
              Severidade: {sessionData.consolidatedAnalysis.severidade.toUpperCase()}
            </div>
          </div>

          {sessionData.consolidatedAnalysis.pontosCriticos.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-blue-800 mb-1">Pontos Críticos:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {sessionData.consolidatedAnalysis.pontosCriticos.map((ponto, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">•</span>
                    {ponto}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Recomendações:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              {sessionData.consolidatedAnalysis.recomendacoes.map((rec, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {sessionData.consolidatedAnalysis.condutasEspecificas.length > 0 && (
            <div className="mt-3 border-t border-blue-200 pt-3">
              <p className="text-sm font-medium text-blue-800 mb-2">Exercícios e Alongamentos por Problema:</p>
              <div className="space-y-2">
                {sessionData.consolidatedAnalysis.condutasEspecificas.map((conduta, index) => (
                  <div key={`${conduta.problema}-${index}`} className="bg-white/70 rounded-md p-2 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-800">{conduta.problema}</p>
                    <p className="text-xs text-blue-700 mt-1">
                      <strong>Exercícios:</strong> {conduta.exercicios.join(' | ')}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      <strong>Alongamentos:</strong> {conduta.alongamentos.join(' | ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Botão de Gerar Relatório */}
      <button
        onClick={handleGenerateReport}
        disabled={!sessionData.isComplete}
        className={`p-4 rounded-lg cursor-pointer font-bold text-base transition-all duration-300 ${
          sessionData.isComplete
            ? 'bg-secondary text-white border-none hover:bg-green-600 hover:-translate-y-0.5 shadow-md hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {sessionData.isComplete 
          ? 'GERAR LAUDO FINAL PDF' 
          : `AGUARDANDO CAPTURAS (${sessionData.currentStep}/${totalSteps})`
        }
      </button>
    </div>
  );
};
