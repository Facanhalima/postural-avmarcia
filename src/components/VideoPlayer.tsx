import React from 'react';
import type { AnatomicalPosition, CaptureGuidance } from '../types';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isInitialized: boolean;
  currentPosition: AnatomicalPosition;
  currentInstruction: string;
  captureGuidance: CaptureGuidance;
  onCapture: () => void;
  canCapture: boolean;
  permissionError?: string;
  cameraFacingMode: 'user' | 'environment';
  onToggleCamera: () => void;
  videoDimensions: { width: number; height: number };
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  canvasRef,
  isInitialized,
  currentPosition,
  currentInstruction,
  captureGuidance,
  onCapture,
  canCapture,
  permissionError,
  cameraFacingMode,
  onToggleCamera,
  videoDimensions
}) => {
  const guidanceTone = {
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    attention: 'bg-amber-50 border-amber-200 text-amber-900',
    adjust: 'bg-rose-50 border-rose-200 text-rose-900'
  }[captureGuidance.status];

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative w-full max-w-[820px] bg-black rounded-xl overflow-hidden shadow-lg"
        style={{ aspectRatio: `${videoDimensions.width} / ${videoDimensions.height}` }}
      >
        <video
          ref={videoRef}
          className="hidden"
          width={videoDimensions.width}
          height={videoDimensions.height}
        />
        <canvas
          ref={canvasRef}
          width={videoDimensions.width}
          height={videoDimensions.height}
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
      <div className="mt-4 text-center max-w-2xl px-2 sm:px-0 w-full">
        <p className="text-gray-700 mb-3 text-sm sm:text-base">
          <span className="font-medium">Instrução:</span> {currentInstruction}
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          Use o simetrógrafo (grade azul) para referência de alinhamento postural
        </p>

        <div className={`rounded-xl border p-3 text-left mb-4 ${guidanceTone}`}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="font-semibold text-sm">{captureGuidance.title}</p>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/70">
              Qualidade {captureGuidance.score}/100
            </span>
          </div>
          <ul className="space-y-1 text-xs sm:text-sm">
            {captureGuidance.details.map((detail) => (
              <li key={detail} className="flex items-start gap-2">
                <span className="mt-1 text-current">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={onCapture}
            disabled={!isInitialized || !canCapture}
            className={`px-5 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-300 ${
              isInitialized && canCapture
                ? 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 shadow-lg hover:shadow-xl'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isInitialized ? (currentPosition === 'take-pe' ? 'Capturar Take do Pé' : 'Capturar Posição') : 'Aguarde...'}
          </button>

          <button
            onClick={onToggleCamera}
            className="px-5 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Usar câmera {cameraFacingMode === 'user' ? 'traseira' : 'frontal'}
          </button>
        </div>
      </div>
    </div>
  );
};
