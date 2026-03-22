import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useSessionManager } from './hooks/useSessionManager';

function App() {
  const {
    sessionData,
    getCurrentPositionLabel,
    getCurrentInstruction,
    captureCurrentPosition,
    completeSession,
    resetSession,
    getProgressPercentage,
    totalSteps
  } = useSessionManager();

  const { 
    videoRef, 
    canvasRef, 
    currentAnalysis, 
    currentImageBase64, 
    isInitialized,
    permissionError
  } = useMediaPipe(sessionData.currentPosition);

  const handleCapture = () => {
    if (currentImageBase64 && currentAnalysis) {
      captureCurrentPosition(currentAnalysis, currentImageBase64);
      
      // Se completou todas as capturas, gerar análise consolidada
      if (sessionData.currentStep + 1 >= totalSteps) {
        completeSession();
      }
    }
  };

  const handleReset = () => {
    resetSession();
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
            onCapture={handleCapture}
            canCapture={isInitialized && !sessionData.isComplete}
            permissionError={permissionError}
          />
          
          {/* Botão de Reset */}
          {sessionData.captures.length > 0 && (
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
          sessionData={sessionData}
          currentPositionLabel={getCurrentPositionLabel()}
          currentInstruction={getCurrentInstruction()}
          progressPercentage={getProgressPercentage()}
          totalSteps={totalSteps}
        />
      </div>
    </div>
  );
}

export default App;
