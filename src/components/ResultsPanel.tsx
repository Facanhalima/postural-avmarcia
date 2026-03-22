import React from 'react';
import type { PostureAnalysis, AnatomicalPosition } from '../types';

interface ResultsPanelProps {
  analysis: PostureAnalysis;
  currentPosition: AnatomicalPosition;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ analysis, currentPosition }) => {
  // Definir quais análises mostrar para cada posição
  const getRelevantAnalyses = () => {
    switch (currentPosition) {
      case 'frente':
        return [
          { label: 'Cabeça (Frontal/Transversal)', value: analysis.cabeca },
          { label: 'Ombros', value: analysis.ombro },
          { label: 'Tórax/Costelas', value: analysis.torax },
          { label: 'Coluna Vertebral', value: analysis.coluna },
          { label: 'Pelve', value: analysis.pelve },
          { label: 'Membros Superiores', value: analysis.membrosSuperiores },
          { label: 'Joelhos', value: analysis.joelho },
          { label: 'Tornozelos/Pés', value: analysis.tornozelo },
          { label: 'Apoio/Rotação dos Pés', value: analysis.pes }
        ];
      case 'lado-direito':
      case 'lado-esquerdo':
        return [
          { label: 'Cabeça/Cervical', value: analysis.cervical },
          { label: 'Coluna Torácica', value: analysis.coluna },
          { label: 'Pelve/Quadril', value: analysis.quadril },
          { label: 'Joelhos', value: analysis.joelho },
          { label: 'Tornozelos/Pés', value: analysis.tornozelo }
        ];
      case 'costas':
        return [
          { label: 'Cabeça', value: analysis.cabeca },
          { label: 'Coluna Vertebral', value: analysis.coluna },
          { label: 'Escápulas', value: analysis.ombro },
          { label: 'Tórax', value: analysis.torax },
          { label: 'Pelve', value: analysis.pelve },
          { label: 'Membros Superiores', value: analysis.membrosSuperiores },
          { label: 'Joelhos', value: analysis.joelho },
          { label: 'Tornozelos', value: analysis.tornozelo },
          { label: 'Pés', value: analysis.pes }
        ];
      default:
        return [];
    }
  };

  const relevantAnalyses = getRelevantAnalyses();
  const positionLabels = {
    'frente': 'Vista Frontal',
    'lado-direito': 'Perfil Direito',
    'lado-esquerdo': 'Perfil Esquerdo',
    'costas': 'Vista Posterior'
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-secondary mt-4">
      <strong className="text-green-800">
        Análise Biomecânica - {positionLabels[currentPosition]}:
      </strong>
      <div className="mt-2 space-y-2">
        {relevantAnalyses.map(({ label, value }) => (
          <p key={label} className="text-sm text-green-700">
            <span className="font-medium">{label}:</span> {value || 'Sem dados'}
          </p>
        ))}
      </div>
      
      {relevantAnalyses.length === 0 && (
        <p className="text-sm text-green-700 mt-2">
          Aguardando detecção de pontos corporais...
        </p>
      )}
    </div>
  );
};
