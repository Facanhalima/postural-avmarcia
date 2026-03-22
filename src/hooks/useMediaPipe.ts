import { useRef, useEffect, useState, useCallback } from 'react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import type { PostureAnalysis, Landmark, AnatomicalPosition } from '../types';

export const useMediaPipe = (currentPosition: AnatomicalPosition) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<PostureAnalysis>({
    ombro: 'Aguardando detecção...',
    pelve: 'Aguardando detecção...',
    joelho: 'Aguardando detecção...',
    cervical: 'Aguardando detecção...',
    coluna: 'Aguardando detecção...',
    quadril: 'Aguardando detecção...',
    tornozelo: 'Aguardando detecção...',
    cabeca: 'Aguardando detecção...',
    torax: 'Aguardando detecção...',
    membrosSuperiores: 'Aguardando detecção...',
    membrosInferiores: 'Aguardando detecção...',
    pes: 'Aguardando detecção...'
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionError, setPermissionError] = useState<string>('');
  const [currentImageBase64, setCurrentImageBase64] = useState<string>('');

  // Função para calcular ângulos
  const calcAngle = (p1: Landmark, p2: Landmark, p3: Landmark): number => {
    const a = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
    const b = Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2);
    const c = Math.pow(p3.x - p1.x, 2) + Math.pow(p3.y - p1.y, 2);
    const denominator = Math.sqrt(4 * a * b);
    if (!Number.isFinite(denominator) || denominator === 0) {
      return 180;
    }

    const cosine = Math.max(-1, Math.min(1, (a + b - c) / denominator));
    return Math.acos(cosine) * (180 / Math.PI);
  };

  const percentual = (value: number): number => Math.abs(value) * 100;

  // Função para desenhar o simetrógrafo (grade)
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // Linhas verticais
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    // Linhas horizontais
    for (let j = 0; j < height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }
  };

  // Função para análise específica por posição anatômica
  const analyzePostureByPosition = useCallback((lm: Landmark[], position: AnatomicalPosition): PostureAnalysis => {
    const analysis: PostureAnalysis = {
      ombro: 'Normal',
      pelve: 'Normal',
      joelho: 'Normal',
      cervical: 'Normal',
      coluna: 'Normal',
      quadril: 'Normal',
      tornozelo: 'Normal',
      cabeca: 'Normal',
      torax: 'Normal',
      membrosSuperiores: 'Normal',
      membrosInferiores: 'Normal',
      pes: 'Normal'
    };

    switch (position) {
      case 'frente':
        // Plano frontal: cabeça, cintura escapular, coluna, pelve, joelhos e pés.
        // Plano transversal (estimativa): rotações de cabeça, tórax e pelve.
        const inclinacaoCabeca = percentual(lm[7].y - lm[8].y);
        const centroOmbrosX = (lm[11].x + lm[12].x) / 2;
        const rotacaoCabeca = percentual(lm[0].x - centroOmbrosX);
        analysis.cabeca = inclinacaoCabeca > 1.6
          ? `Inclinação lateral (${inclinacaoCabeca.toFixed(1)}%)`
          : rotacaoCabeca > 3.5
            ? `Rotação no plano transversal (${rotacaoCabeca.toFixed(1)}%)`
            : 'Alinhada na linha média';

        const diffOmbro = percentual(lm[11].y - lm[12].y);
        analysis.ombro = diffOmbro > 1.8
          ? `Desnível de acrômios (${diffOmbro.toFixed(1)}%)`
          : 'Alinhado';

        const centroEscapularX = (lm[11].x + lm[12].x) / 2;
        const centroPelvicoX = (lm[23].x + lm[24].x) / 2;
        const rotacaoTorax = percentual(centroEscapularX - centroPelvicoX);
        analysis.torax = rotacaoTorax > 3.2
          ? `Rotação de tórax em relação à pelve (${rotacaoTorax.toFixed(1)}%)`
          : 'Simetria torácica preservada';

        const desvioColunaFrontal = percentual(centroEscapularX - centroPelvicoX);
        analysis.coluna = desvioColunaFrontal > 3.4
          ? `Desvio lateral da linha média (${desvioColunaFrontal.toFixed(1)}%)`
          : 'Processos espinhosos com alinhamento global';

        const diffPelve = percentual(lm[23].y - lm[24].y);
        const rotacaoPelve = percentual((lm[23].z ?? 0) - (lm[24].z ?? 0));
        analysis.pelve = diffPelve > 1.8
          ? `Assimetria de cristas ilíacas (${diffPelve.toFixed(1)}%)`
          : rotacaoPelve > 4
            ? `Rotação pélvica no plano transversal (${rotacaoPelve.toFixed(1)}%)`
            : 'Pelve alinhada';

        const assimetriaMS = (percentual(lm[13].y - lm[14].y) + percentual(lm[15].y - lm[16].y)) / 2;
        analysis.membrosSuperiores = assimetriaMS > 2.4
          ? `Assimetria de cotovelos/punhos (${assimetriaMS.toFixed(1)}%)`
          : 'Membros superiores simétricos';

        // Joelhos: valgo/varo e simetria patelar.
        const angJoelhoDir = calcAngle(lm[24], lm[26], lm[28]);
        const angJoelhoEsq = calcAngle(lm[23], lm[25], lm[27]);
        const mediaJoelhos = (angJoelhoDir + angJoelhoEsq) / 2;
        const diffPatelas = percentual(lm[25].y - lm[26].y);
        
        if (mediaJoelhos < 172) {
          analysis.joelho = `Tendência a joelhos valgos (${mediaJoelhos.toFixed(1)}°)`;
        } else if (mediaJoelhos > 188) {
          analysis.joelho = `Tendência a joelhos varos (${mediaJoelhos.toFixed(1)}°)`;
        } else if (diffPatelas > 1.8) {
          analysis.joelho = `Assimetria de altura patelar (${diffPatelas.toFixed(1)}%)`;
        } else {
          analysis.joelho = 'Alinhamento normal';
        }

        const calcaneo = (percentual(lm[29].x - lm[27].x) + percentual(lm[30].x - lm[28].x)) / 2;
        analysis.tornozelo = calcaneo > 3.4
          ? `Desvio de retropé (valgismo/varismo) (${calcaneo.toFixed(1)}%)`
          : 'Tornozelos alinhados';

        const aberturaPes = percentual((lm[31].x - lm[29].x) - (lm[32].x - lm[30].x));
        analysis.pes = aberturaPes > 4.5
          ? `Rotação dos pés (abertos/fechados) (${aberturaPes.toFixed(1)}%)`
          : 'Apoio plantar e direção dos pés simétricos';

        analysis.membrosInferiores = analysis.joelho;
        break;

      case 'lado-direito':
      case 'lado-esquerdo':
        // Plano sagital: cabeça/cervical, coluna torácica, pelve, joelho e tornozelo.
        const orelhaIndex = position === 'lado-direito' ? 8 : 7;
        const ombroIndex = position === 'lado-direito' ? 12 : 11;
        const quadrilIndex = position === 'lado-direito' ? 24 : 23;
        const joelhoIndex = position === 'lado-direito' ? 26 : 25;
        const tornozeloIndex = position === 'lado-direito' ? 28 : 27;
        const peIndex = position === 'lado-direito' ? 32 : 31;

        const protrusaoCervical = percentual(lm[orelhaIndex].x - lm[ombroIndex].x);
        analysis.cervical = protrusaoCervical > 5.2
          ? `Protrusão de cabeça (${protrusaoCervical.toFixed(1)}%)`
          : 'Alinhamento normal';

        analysis.cabeca = analysis.cervical;

        const anguloToracico = calcAngle(lm[orelhaIndex], lm[ombroIndex], lm[quadrilIndex]);
        if (anguloToracico < 142) {
          analysis.coluna = `Padrão compatível com hipercifose torácica (${anguloToracico.toFixed(1)}°)`;
          analysis.torax = 'Aumento da convexidade torácica';
        } else if (anguloToracico > 168) {
          analysis.coluna = `Retificação torácica (${anguloToracico.toFixed(1)}°)`;
          analysis.torax = 'Redução de mobilidade torácica';
        } else {
          analysis.coluna = 'Curvatura sagital preservada';
          analysis.torax = 'Alinhamento torácico adequado';
        }

        const anguloPelvicoSagital = calcAngle(lm[ombroIndex], lm[quadrilIndex], lm[joelhoIndex]);
        if (anguloPelvicoSagital < 160) {
          analysis.pelve = `Tendência a anteversão pélvica (${anguloPelvicoSagital.toFixed(1)}°)`;
        } else if (anguloPelvicoSagital > 185) {
          analysis.pelve = `Tendência a retroversão pélvica (${anguloPelvicoSagital.toFixed(1)}°)`;
        } else {
          analysis.pelve = 'Pelve neutra no plano sagital';
        }

        const anguloJoelhoSagital = calcAngle(lm[quadrilIndex], lm[joelhoIndex], lm[tornozeloIndex]);
        analysis.joelho = anguloJoelhoSagital < 168
          ? `Flexo de joelho (${anguloJoelhoSagital.toFixed(1)}°)`
          : anguloJoelhoSagital > 187
            ? `Recurvato de joelho (${anguloJoelhoSagital.toFixed(1)}°)`
            : 'Joelho com alinhamento sagital adequado';

        const anguloTornozeloSagital = calcAngle(lm[joelhoIndex], lm[tornozeloIndex], lm[peIndex]);
        analysis.tornozelo = anguloTornozeloSagital < 82
          ? `Restrição de dorsiflexão (${anguloTornozeloSagital.toFixed(1)}°)`
          : anguloTornozeloSagital > 112
            ? `Padrão de flexão plantar aumentada (${anguloTornozeloSagital.toFixed(1)}°)`
            : 'Tornozelo funcional no plano sagital';

        analysis.quadril = analysis.pelve;
        analysis.pes = analysis.tornozelo;
        analysis.membrosInferiores = analysis.joelho;
        break;

      case 'costas':
        // Plano frontal posterior + transversal: escápulas, coluna, pelve e membros inferiores.
        const inclinacaoCabecaPosterior = percentual(lm[7].y - lm[8].y);
        analysis.cabeca = inclinacaoCabecaPosterior > 1.6
          ? `Inclinação lateral posterior (${inclinacaoCabecaPosterior.toFixed(1)}%)`
          : 'Cabeça centrada';

        const desalinhamentoColuna = percentual(
          ((lm[11].x + lm[12].x) / 2) - ((lm[23].x + lm[24].x) / 2)
        );
        
        if (desalinhamentoColuna > 3) {
          analysis.coluna = `Possível escoliose funcional (desvio ${desalinhamentoColuna.toFixed(1)}%)`;
        } else {
          analysis.coluna = 'Alinhamento vertebral normal';
        }

        const diffEscapulas = percentual(lm[11].y - lm[12].y);
        analysis.ombro = diffEscapulas > 2
          ? `Assimetria escapular (${diffEscapulas.toFixed(1)}%)` 
          : 'Escápulas simétricas';

        const rotacaoToraxPosterior = percentual((lm[11].z ?? 0) - (lm[12].z ?? 0));
        analysis.torax = rotacaoToraxPosterior > 3.8
          ? `Rotação da caixa torácica (${rotacaoToraxPosterior.toFixed(1)}%)`
          : 'Sem rotação torácica relevante';

        const diffPelvePosterior = percentual(lm[23].y - lm[24].y);
        const rotacaoPelvePosterior = percentual((lm[23].z ?? 0) - (lm[24].z ?? 0));
        analysis.pelve = diffPelvePosterior > 1.8
          ? `Diferença de altura pélvica (${diffPelvePosterior.toFixed(1)}%)`
          : rotacaoPelvePosterior > 4
            ? `Rotação pélvica transversal (${rotacaoPelvePosterior.toFixed(1)}%)`
            : 'Pelve alinhada posteriormente';

        const assimetriaMSPosterior = (percentual(lm[13].y - lm[14].y) + percentual(lm[15].y - lm[16].y)) / 2;
        analysis.membrosSuperiores = assimetriaMSPosterior > 2.4
          ? `Assimetria de membros superiores (${assimetriaMSPosterior.toFixed(1)}%)`
          : 'Simetria de membros superiores preservada';

        const diffJoelhosPosterior = percentual(lm[25].x - lm[26].x);
        analysis.joelho = diffJoelhosPosterior > 3.8
          ? `Assimetria de eixo femorotibial (${diffJoelhosPosterior.toFixed(1)}%)`
          : 'Eixo dos joelhos simétrico';

        const diffTornozelos = percentual(lm[27].x - lm[28].x);
        analysis.tornozelo = diffTornozelos > 4
          ? `Desalinhamento de tornozelos (${diffTornozelos.toFixed(1)}%)`
          : 'Alinhamento de tornozelos preservado';

        const variacaoPesPosterior = percentual((lm[29].x - lm[31].x) - (lm[30].x - lm[32].x));
        analysis.pes = variacaoPesPosterior > 4.2
          ? `Assimetria de apoio plantar (${variacaoPesPosterior.toFixed(1)}%)`
          : 'Apoio plantar simétrico';

        analysis.membrosInferiores = analysis.joelho;
        analysis.quadril = analysis.pelve;
        break;
    }

    return analysis;
  }, []);

  // Processar resultados do pose
  const onResults = useCallback((results: any) => {
    if (!results.poseLandmarks || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lm = results.poseLandmarks;

    // Limpar e desenhar frame
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Desenhar grade (simetrógrafo)
    drawGrid(ctx, canvas.width, canvas.height);

    // Análise específica por posição
    const newAnalysis = analyzePostureByPosition(lm, currentPosition);
    setCurrentAnalysis(newAnalysis);

    // Salvar imagem atual
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setCurrentImageBase64(imageBase64);

    // Desenhar esqueleto
    drawConnectors(ctx, lm, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
    drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 1, radius: 3 });

    ctx.restore();
  }, [currentPosition, analyzePostureByPosition]);

  // Inicializar MediaPipe
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const initializePose = async () => {
      try {
        // Primeiro, pedir permissão explícita para acessar a câmera
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });

          // Fechar o stream inicial para que o MediaPipe possa usá-lo
          stream.getTracks().forEach(track => track.stop());
        } catch (permError: any) {
          if (permError.name === 'NotAllowedError') {
            setPermissionError(
              'Permissão de câmera negada. Por favor, verifique as configurações de privacidade do navegador.'
            );
          } else if (permError.name === 'NotFoundError') {
            setPermissionError('Nenhuma câmera foi encontrada. Verifique se o dispositivo possui câmera.');
          } else {
            setPermissionError(`Erro ao acessar câmera: ${permError.message}`);
          }
          console.error('Erro ao solicitar permissão de câmera:', permError);
          return;
        }

        // Agora inicializar o MediaPipe
        const pose = new Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        await pose.initialize();

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);

        const camera = new Camera(videoRef.current!, {
          onFrame: async () => {
            if (videoRef.current) {
              await pose.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        try {
          await camera.start();
          setIsInitialized(true);
          setPermissionError('');
        } catch (cameraError: any) {
          console.error('Erro ao inicializar câmera:', cameraError);
          setPermissionError(
            'Erro ao inicializar câmera. Tente recarregar a página.'
          );
        }
      } catch (error) {
        console.error('Erro geral na inicialização:', error);
        setPermissionError('Erro ao inicializar aplicação.');
      }
    };

    initializePose();

    return () => {
      // Cleanup if needed
    };
  }, [onResults]);

  return {
    videoRef,
    canvasRef,
    currentAnalysis,
    currentImageBase64,
    isInitialized,
    permissionError
  };
};
