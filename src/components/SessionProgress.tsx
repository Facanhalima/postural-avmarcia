import React from 'react';
import type { SessionData } from '../types';

interface SessionProgressProps {
  sessionData: SessionData;
  currentPositionLabel: string;
  currentInstruction: string;
  progressPercentage: number;
  totalSteps: number;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({
  sessionData,
  currentPositionLabel,
  currentInstruction,
  progressPercentage,
  totalSteps
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < sessionData.currentStep) return 'completed';
    if (stepIndex === sessionData.currentStep && !sessionData.isComplete) return 'active';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'active':
        return '📷';
      default:
        return '○';
    }
  };

  const stepLabels = ['Vista Frontal', 'Perfil Direito', 'Perfil Esquerdo', 'Vista Posterior', 'Take dos Pés'];

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      {/* Barra de Progresso */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-blue-700">
            Progresso da Avaliação
          </span>
          <span className="text-sm text-blue-600">
            {sessionData.currentStep}/{totalSteps}
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Status atual */}
      {!sessionData.isComplete && (
        <div className="mb-4">
          <h3 className="font-semibold text-blue-800 mb-1">
            {currentPositionLabel}
          </h3>
          <p className="text-sm text-blue-700">
            {currentInstruction}
          </p>
        </div>
      )}

      {/* Lista de etapas */}
      <div className="space-y-2">
        {stepLabels.map((label, index) => {
          const status = getStepStatus(index);
          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-2 rounded text-sm ${
                status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : status === 'active'
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="text-lg">
                {getStepIcon(status)}
              </span>
              <span>{label}</span>
              {status === 'completed' && sessionData.captures[index] && (
                <span className="ml-auto text-xs">
                  {sessionData.captures[index].timestamp.toLocaleTimeString()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {sessionData.isComplete && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">✅</span>
            <span className="font-semibold text-green-800">
              Avaliação Completa!
            </span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Todas as 5 posições foram capturadas. Você pode gerar o relatório final.
          </p>
        </div>
      )}
    </div>
  );
};
