import React from 'react';
import type { AnatomicalPosition, CaptureGuidance, SessionData } from '../types';

const POSITION_LABELS: Record<AnatomicalPosition, string> = {
  frente: 'Frontal',
  'lado-direito': 'Direita',
  'lado-esquerdo': 'Esquerda',
  costas: 'Costas',
  'take-pe': 'Pés'
};

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isInitialized: boolean;
  sessionData: SessionData;
  mainPositions: AnatomicalPosition[];
  currentInstruction: string;
  captureGuidance: CaptureGuidance;
  onCapture: () => void;
  canCapture: boolean;
  captureDisabledReason?: string;
  permissionError?: string;
  cameraFacingMode: 'user' | 'environment';
  onToggleCamera: () => void;
  videoDimensions: { width: number; height: number };
  onSelectPosition: (position: AnatomicalPosition) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  canvasRef,
  isInitialized,
  sessionData,
  mainPositions,
  currentInstruction,
  captureGuidance,
  onCapture,
  canCapture,
  captureDisabledReason,
  permissionError,
  cameraFacingMode,
  onToggleCamera,
  videoDimensions,
  onSelectPosition
}) => {
  const currentPosition = sessionData.currentPosition;
  const guidanceTone = {
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    attention: 'bg-amber-50 border-amber-200 text-amber-900',
    adjust: 'bg-rose-50 border-rose-200 text-rose-900'
  }[captureGuidance.status];

  const currentPositionLabel = currentPosition ? POSITION_LABELS[currentPosition] : 'Posição não definida';

  const renderPositionButton = (position: AnatomicalPosition) => {
    const isActive = currentPosition === position;
    const isCompleted = sessionData.completedPositions.has(position);

    return (
      <button
        key={position}
        onClick={() => onSelectPosition(position)}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
          isActive
            ? 'border-white bg-white text-slate-900 shadow-sm'
            : isCompleted
              ? 'border-emerald-300 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
              : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {isCompleted ? '✓ ' : ''}{POSITION_LABELS[position]}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative w-full max-w-[820px] bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/10"
        style={{ aspectRatio: `${videoDimensions.width} / ${videoDimensions.height}` }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
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

        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap gap-2 rounded-2xl bg-slate-950/60 px-3 py-2 backdrop-blur-md border border-white/10">
            {mainPositions.map((position) => renderPositionButton(position))}
          </div>

          <div className="pointer-events-auto rounded-2xl bg-slate-950/60 px-3 py-2 backdrop-blur-md border border-white/10 text-right text-white max-w-[240px]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Captura atual</p>
            <p className="text-sm font-semibold leading-tight">{currentPositionLabel}</p>
            {currentPosition === 'take-pe' && (
              <p className="text-[11px] text-white/70 mt-1">Use este take apenas quando precisar refazer a leitura dos pés.</p>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="max-w-[320px] rounded-2xl bg-slate-950/65 px-4 py-3 text-white backdrop-blur-md border border-white/10 shadow-lg">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Instrução</p>
            <p className="mt-1 text-sm leading-snug">{currentInstruction}</p>
            <p className="mt-2 text-[11px] text-white/70">{captureGuidance.title}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={onToggleCamera}
                className="rounded-full bg-emerald-600/95 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-500"
              >
                Usar câmera {cameraFacingMode === 'user' ? 'traseira' : 'frontal'}
              </button>
              <button
                onClick={onCapture}
                disabled={!isInitialized || !canCapture}
                title={captureDisabledReason ?? 'Capturar posição'}
                className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 ${
                  isInitialized && canCapture
                    ? 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 shadow-blue-900/25'
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
              >
                {isInitialized ? (currentPosition === 'take-pe' ? 'Capturar Take dos Pés' : 'Capturar foto') : 'Aguarde...'}
              </button>
            </div>
            <p className="text-[11px] text-white/70 text-right max-w-[320px]">
              A próxima posição será selecionada automaticamente após cada captura. Se precisar refazer, toque no take desejado acima.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center max-w-2xl px-2 sm:px-0 w-full">
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

        {!isInitialized || captureDisabledReason ? (
          <p className="mt-3 text-xs sm:text-sm text-gray-600">
            {captureDisabledReason ?? 'Aguardando liberação da câmera para capturar.'}
          </p>
        ) : (
          !canCapture && (
            <p className="mt-3 text-xs sm:text-sm text-amber-700">
              O enquadramento ainda pode ser melhorado, mas a captura já está liberada.
            </p>
          )
        )}
      </div>
    </div>
  );
};
