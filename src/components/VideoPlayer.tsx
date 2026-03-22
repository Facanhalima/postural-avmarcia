import React from 'react';
import type { AnatomicalPosition } from '../types';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isInitialized: boolean;
  currentPosition: AnatomicalPosition;
  onCapture: () => void;
  canCapture: boolean;
  permissionError?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  canvasRef,
  isInitialized,
  currentPosition,
  onCapture,
  canCapture,
  permissionError
}) => {
  const positionInstructions = {
    'frente': 'Posicione o paciente de frente para a câmera',
    'lado-direito': 'Posicione o paciente de perfil direito',
    'lado-esquerdo': 'Posicione o paciente de perfil esquerdo',
    'costas': 'Posicione o paciente de costas para a câmera'
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-[820px] aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          className="hidden"
          width={640}
          height={480}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute top-0 left-0 w-full h-full"
        />
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center px-4">
              {permissionError ? (
                <>
                  <div className="text-red-400 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9 9 0 1021 12a9.005 9.005 0 00-13.92-5.53" />
                    </svg>
                  </div>
                  <p className="font-semibold mb-2">Acesso à Câmera Negado</p>
                  <p className="text-sm opacity-90 max-w-sm">{permissionError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Inicializando câmera...</p>
                  <p className="text-sm opacity-75 mt-2">
                    Permita o acesso à câmera quando solicitado
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Instruções e botão de captura */}
      <div className="mt-4 text-center max-w-2xl px-2 sm:px-0">
        <p className="text-gray-700 mb-3 text-sm sm:text-base">
          <span className="font-medium">Instrução:</span> {positionInstructions[currentPosition]}
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          Use o simetrógrafo (grade azul) para referência de alinhamento postural
        </p>
        
        <button
          onClick={onCapture}
          disabled={!isInitialized || !canCapture}
          className={`px-5 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-300 ${
            isInitialized && canCapture
              ? 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isInitialized ? 'Capturar Posição' : 'Aguarde...'}
        </button>
      </div>
    </div>
  );
};
