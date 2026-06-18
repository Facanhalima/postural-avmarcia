import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useSessionManager } from './hooks/useSessionManager';
import { useState } from 'react';

function App() {
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');

  const {
    sessionData,
    getCurrentPositionLabel,
    getCurrentInstruction,
    captureCurrentPosition,
    selectPosition,
    addFootNotes,
    completeSession,
    resetSession,
    getProgressPercentage,
    isMainPositionsComplete,
    mainPositions,
    totalSteps
  } = useSessionManager();

  const { 
    videoRef, 
    canvasRef, 
    currentAnalysis, 
    estimatedBiotype,
    captureGuidance,
    currentImageBase64, 
    isInitialized,
    permissionError,
    videoDimensions
  } = useMediaPipe(sessionData.currentPosition, cameraFacingMode);

  const captureDisabledReason = !isInitialized
    ? permissionError || 'Aguardando inicialização da câmera.'
    : sessionData.isComplete
      ? 'A avaliação já foi concluída.'
      : !sessionData.currentPosition
        ? 'Selecione uma posição na barra lateral para liberar a captura.'
        : undefined;

  const handleCapture = () => {
    if (currentImageBase64 && currentAnalysis && sessionData.currentPosition) {
      captureCurrentPosition(currentAnalysis, currentImageBase64);
    }
  };

  const handleReset = () => {
    resetSession();
  };

  const handleToggleCamera = () => {
    setCameraFacingMode((previous) => (previous === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="min-h-screen bg-bg flex justify-center p-2 sm:p-4 lg:p-5 font-sans">
      <div className="flex flex-col xl:flex-row gap-3 sm:gap-5 max-w-7xl w-full bg-white p-3 sm:p-5 lg:p-6 rounded-xl shadow-lg">
        <div className="flex flex-col flex-1 order-1 xl:order-2">
          <VideoPlayer 
            videoRef={videoRef} 
            canvasRef={canvasRef} 
            isInitialized={isInitialized}
            currentPosition={sessionData.currentPosition}
            currentInstruction={getCurrentInstruction()}
            captureGuidance={captureGuidance}
            onCapture={handleCapture}
            canCapture={isInitialized && !sessionData.isComplete && sessionData.currentPosition !== null}
            captureDisabledReason={captureDisabledReason}
            permissionError={permissionError}
            cameraFacingMode={cameraFacingMode}
            onToggleCamera={handleToggleCamera}
            videoDimensions={videoDimensions}
          />
          
          {/* Botão de Reset */}
          {sessionData.completedPositions.size > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Reiniciar Avaliação
              </button>
            </div>
          )}
        </div>
        <Sidebar
          currentAnalysis={currentAnalysis}
          estimatedBiotype={estimatedBiotype}
          sessionData={sessionData}
          currentPositionLabel={getCurrentPositionLabel()}
          currentInstruction={getCurrentInstruction()}
          progressPercentage={getProgressPercentage()}
          totalSteps={totalSteps}
          onSelectPosition={selectPosition}
          onAddFootNotes={addFootNotes}
          onCompleteSession={completeSession}
          isMainPositionsComplete={isMainPositionsComplete()}
          mainPositions={mainPositions}
        />
      </div>
    </div>
  );
}

export default App;
