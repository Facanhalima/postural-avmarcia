import React, { useState } from 'react';
import { ResultsPanel } from './ResultsPanel';
import { SessionProgress } from './SessionProgress';
import { usePDFGenerator } from '../hooks/usePDFGenerator';
import type { BodyCompositionData, PerimetryData, PostureAnalysis, PatientData, SessionData } from '../types';

const PERIMETRY_FIELDS: Array<{ key: keyof PerimetryData; label: string }> = [
  { key: 'pescoco', label: 'Pescoco' },
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

interface SidebarProps {
  currentAnalysis: PostureAnalysis;
  sessionData: SessionData;
  currentPositionLabel: string;
  currentInstruction: string;
  progressPercentage: number;
  totalSteps: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentAnalysis,
  sessionData,
  currentPositionLabel,
  currentInstruction,
  progressPercentage,
  totalSteps
}) => {
  const [patientData, setPatientData] = useState<PatientData>({
    nome: '',
    idade: '',
    queixa: '',
    composicaoCorporal: {
      biotipo: '',
      biotipoObesidade: ''
    },
    perimetria: {
      pescoco: '',
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

  const { generateConsolidatedReport } = usePDFGenerator();

  const handleInputChange = (field: 'nome' | 'idade' | 'queixa', value: string) => {
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
          placeholder="Idade"
          value={patientData.idade}
          onChange={(e) => handleInputChange('idade', e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
        
        <textarea
          placeholder="Queixa principal e histórico..."
          value={patientData.queixa}
          onChange={(e) => handleInputChange('queixa', e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md resize-none h-20 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />

        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Composicao Corporal</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Biotipo"
              value={patientData.composicaoCorporal.biotipo}
              onChange={(e) => handleBodyCompositionChange('biotipo', e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />

            <input
              type="text"
              placeholder="Biotipo de obesidade"
              value={patientData.composicaoCorporal.biotipoObesidade}
              onChange={(e) => handleBodyCompositionChange('biotipoObesidade', e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
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
