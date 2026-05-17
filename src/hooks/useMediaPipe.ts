import { useRef, useEffect, useState, useCallback } from 'react';
import type { CaptureGuidance, PostureAnalysis, Landmark, AnatomicalPosition } from '../types';

type CameraFacingMode = 'user' | 'environment';

type PoseInstance = {
  close?: () => Promise<void>;
  initialize: () => Promise<void>;
  setOptions: (options: {
    modelComplexity: number;
    smoothLandmarks: boolean;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }) => void;
  onResults: (callback: (results: any) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
};

type PoseConstructor = new (config: { locateFile: (file: string) => string }) => PoseInstance;

type CameraOptions = {
  onFrame: () => Promise<void>;
  width: number;
  height: number;
  facingMode?: CameraFacingMode;
};

type CameraInstance = {
  start: () => Promise<void>;
  stop: () => void;
};

type CameraConstructor = new (video: HTMLVideoElement, options: CameraOptions) => CameraInstance;

type DrawConnectorsFn = (
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: any,
  style: { color: string; lineWidth: number }
) => void;

type DrawLandmarksFn = (
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  style: { color: string; lineWidth: number; radius: number }
) => void;

type PoseApi = {
  PoseCtor: PoseConstructor;
  poseConnections: unknown;
};

declare global {
  interface Window {
    Pose?: PoseConstructor | { Pose?: PoseConstructor; POSE_CONNECTIONS?: unknown };
    POSE_CONNECTIONS?: unknown;
    Camera?: CameraConstructor | { Camera?: CameraConstructor };
    drawConnectors?: DrawConnectorsFn;
    drawLandmarks?: DrawLandmarksFn;
  }
}

const POSE_CDN_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
const CAMERA_CDN_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
const DRAWING_CDN_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
let poseScriptPromise: Promise<PoseApi> | null = null;
let cameraScriptPromise: Promise<CameraConstructor> | null = null;
let drawingScriptPromise: Promise<{ drawConnectors: DrawConnectorsFn; drawLandmarks: DrawLandmarksFn }> | null = null;

const getPoseApiFromWindow = (): PoseApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // UMD do MediaPipe normalmente injeta Pose como construtor global (window.Pose)
  if (typeof window.Pose === 'function') {
    return {
      PoseCtor: window.Pose,
      poseConnections: window.POSE_CONNECTIONS ?? []
    };
  }

  // Em alguns ambientes, o global pode vir como objeto { Pose, POSE_CONNECTIONS }
  if (window.Pose && typeof window.Pose === 'object' && typeof window.Pose.Pose === 'function') {
    return {
      PoseCtor: window.Pose.Pose,
      poseConnections: window.Pose.POSE_CONNECTIONS ?? window.POSE_CONNECTIONS ?? []
    };
  }

  return null;
};

const loadPoseApi = (): Promise<PoseApi> => {
  const loaded = getPoseApiFromWindow();
  if (loaded) {
    return Promise.resolve(loaded);
  }

  if (poseScriptPromise) {
    return poseScriptPromise;
  }

  poseScriptPromise = new Promise<PoseApi>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Ambiente sem document para carregar script do Pose.'));
      return;
    }

    const existingScript = document.querySelector(`script[src="${POSE_CDN_URL}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        const poseApi = getPoseApiFromWindow();
        if (poseApi) {
          resolve(poseApi);
          return;
        }
        reject(new Error('Script do Pose carregou, mas construtor global não foi encontrado.'));
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Falha ao carregar script do Pose.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = POSE_CDN_URL;
    script.async = true;
    script.onload = () => {
      const poseApi = getPoseApiFromWindow();
      if (poseApi) {
        resolve(poseApi);
        return;
      }
      reject(new Error('Script do Pose carregou, mas construtor global não foi encontrado.'));
    };
    script.onerror = () => {
      reject(new Error('Falha ao carregar script do Pose via CDN.'));
    };

    document.head.appendChild(script);
  });

  return poseScriptPromise;
};

const getCameraCtorFromWindow = (): CameraConstructor | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (typeof window.Camera === 'function') {
    return window.Camera;
  }

  if (window.Camera && typeof window.Camera === 'object' && typeof window.Camera.Camera === 'function') {
    return window.Camera.Camera;
  }

  return null;
};

const loadCameraCtor = (): Promise<CameraConstructor> => {
  const loaded = getCameraCtorFromWindow();
  if (loaded) {
    return Promise.resolve(loaded);
  }

  if (cameraScriptPromise) {
    return cameraScriptPromise;
  }

  cameraScriptPromise = new Promise<CameraConstructor>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Ambiente sem document para carregar script da Camera.'));
      return;
    }

    const existingScript = document.querySelector(`script[src="${CAMERA_CDN_URL}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        const cameraCtor = getCameraCtorFromWindow();
        if (cameraCtor) {
          resolve(cameraCtor);
          return;
        }
        reject(new Error('Script da Camera carregou, mas construtor global não foi encontrado.'));
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Falha ao carregar script da Camera.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = CAMERA_CDN_URL;
    script.async = true;
    script.onload = () => {
      const cameraCtor = getCameraCtorFromWindow();
      if (cameraCtor) {
        resolve(cameraCtor);
        return;
      }
      reject(new Error('Script da Camera carregou, mas construtor global não foi encontrado.'));
    };
    script.onerror = () => {
      reject(new Error('Falha ao carregar script da Camera via CDN.'));
    };

    document.head.appendChild(script);
  });

  return cameraScriptPromise;
};

const getDrawingApiFromWindow = (): { drawConnectors: DrawConnectorsFn; drawLandmarks: DrawLandmarksFn } | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (typeof window.drawConnectors === 'function' && typeof window.drawLandmarks === 'function') {
    return {
      drawConnectors: window.drawConnectors,
      drawLandmarks: window.drawLandmarks
    };
  }

  return null;
};

const loadDrawingApi = (): Promise<{ drawConnectors: DrawConnectorsFn; drawLandmarks: DrawLandmarksFn }> => {
  const loaded = getDrawingApiFromWindow();
  if (loaded) {
    return Promise.resolve(loaded);
  }

  if (drawingScriptPromise) {
    return drawingScriptPromise;
  }

  drawingScriptPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Ambiente sem document para carregar script do Drawing Utils.'));
      return;
    }

    const existingScript = document.querySelector(`script[src="${DRAWING_CDN_URL}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        const drawingApi = getDrawingApiFromWindow();
        if (drawingApi) {
          resolve(drawingApi);
          return;
        }
        reject(new Error('Script do Drawing Utils carregou, mas funções globais não foram encontradas.'));
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Falha ao carregar script do Drawing Utils.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = DRAWING_CDN_URL;
    script.async = true;
    script.onload = () => {
      const drawingApi = getDrawingApiFromWindow();
      if (drawingApi) {
        resolve(drawingApi);
        return;
      }
      reject(new Error('Script do Drawing Utils carregou, mas funções globais não foram encontradas.'));
    };
    script.onerror = () => {
      reject(new Error('Falha ao carregar script do Drawing Utils via CDN.'));
    };

    document.head.appendChild(script);
  });

  return drawingScriptPromise;
};

export const useMediaPipe = (currentPosition: AnatomicalPosition, cameraFacingMode: CameraFacingMode) => {
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
    pes: 'Aguardando detecção...',
    relacaoPeTornozeloJoelho: 'Aguardando detecção...'
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionError, setPermissionError] = useState<string>('');
  const [currentImageBase64, setCurrentImageBase64] = useState<string>('');
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  const [estimatedBiotype, setEstimatedBiotype] = useState<string>('Aguardando leitura frontal...');
  const [captureGuidance, setCaptureGuidance] = useState<CaptureGuidance>({
    canCapture: false,
    score: 0,
    status: 'adjust',
    title: 'Aguardando enquadramento',
    details: ['Centralize o paciente e aguarde a leitura dos pontos anatômicos.']
  });
  const poseConnectionsRef = useRef<unknown>([]);
  const drawConnectorsRef = useRef<DrawConnectorsFn | null>(null);
  const drawLandmarksRef = useRef<DrawLandmarksFn | null>(null);
  const poseInstanceRef = useRef<PoseInstance | null>(null);
  const cameraInstanceRef = useRef<CameraInstance | null>(null);
  const videoDimensionsRef = useRef({ width: 640, height: 480 });
  const biotypeVotesRef = useRef<Array<'ectomorfo' | 'mesomorfo' | 'endomorfo'>>([]);

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

  const distance = (p1: Landmark, p2: Landmark): number => {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  };

  const midpoint = (p1: Landmark, p2: Landmark): Landmark => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  };

  const lineAngle = (p1: Landmark, p2: Landmark): number => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  };

  const visibilityScore = (lm: Landmark | undefined): number => lm?.visibility ?? 1;

  const buildCaptureGuidance = useCallback((lm: Landmark[], position: AnatomicalPosition): CaptureGuidance => {
    const details: string[] = [];
    let score = 100;

    const penalize = (amount: number, message: string) => {
      score -= amount;
      if (!details.includes(message)) {
        details.push(message);
      }
    };

    const coreIndices = position === 'take-pe'
      ? [23, 24, 25, 26, 27, 28, 29, 30, 31, 32]
      : [0, 7, 8, 11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

    const visibleCore = coreIndices.filter((index) => lm[index] && visibilityScore(lm[index]) >= 0.55).length;
    if (visibleCore < Math.ceil(coreIndices.length * 0.75)) {
      penalize(35, 'Mantenha os pontos anatômicos principais visíveis na imagem.');
    }

    const shoulderLineAngle = lm[11] && lm[12] ? Math.abs(lineAngle(lm[11], lm[12])) : 0;
    const hipLineAngle = lm[23] && lm[24] ? Math.abs(lineAngle(lm[23], lm[24])) : 0;
    if (shoulderLineAngle > 7 || hipLineAngle > 7) {
      penalize(18, 'Nivele a câmera para evitar inclinação lateral da imagem.');
    }

    const torsoCenterX = lm[11] && lm[12] && lm[23] && lm[24]
      ? (lm[11].x + lm[12].x + lm[23].x + lm[24].x) / 4
      : 0.5;

    const footCenterX = lm[27] && lm[28]
      ? (lm[27].x + lm[28].x) / 2
      : torsoCenterX;

    const referenceCenterX = position === 'take-pe' ? footCenterX : torsoCenterX;
    if (Math.abs(referenceCenterX - 0.5) > 0.12) {
      penalize(12, 'Centralize melhor o corpo no quadro.');
    }

    const relevantPoints = coreIndices
      .map((index) => lm[index])
      .filter((point): point is Landmark => Boolean(point));

    const minY = Math.min(...relevantPoints.map((point) => point.y));
    const maxY = Math.max(...relevantPoints.map((point) => point.y));
    const coverage = maxY - minY;

    if (position === 'take-pe') {
      if (coverage < 0.36) {
        penalize(18, 'Aproxime a câmera para enquadrar joelhos, tornozelos e pés com mais detalhe.');
      }
      if (coverage > 0.9) {
        penalize(15, 'Afaste um pouco a câmera para evitar corte dos pés ou dos joelhos.');
      }

      const ankleSpacing = lm[27] && lm[28] ? Math.abs(lm[27].x - lm[28].x) : 0;
      if (ankleSpacing < 0.1) {
        penalize(10, 'Aumente levemente a base de apoio para evidenciar os dois pés.');
      }

      const rightFootAngle = lm[30] && lm[32] ? Math.abs(lineAngle(lm[30], lm[32])) : 0;
      const leftFootAngle = lm[29] && lm[31] ? Math.abs(lineAngle(lm[29], lm[31])) : 0;
      if (Math.max(rightFootAngle, leftFootAngle) > 20) {
        penalize(10, 'Mantenha os pés mais paralelos para padronizar a leitura da pisada.');
      }
    } else {
      if (coverage < 0.65) {
        penalize(12, 'Inclua mais do corpo no enquadramento, preferencialmente da cabeça aos pés.');
      }
      if (coverage > 0.97) {
        penalize(10, 'Diminua o zoom ou afaste um pouco a câmera para evitar cortes.');
      }
    }

    if (score < 0) score = 0;

    const status: CaptureGuidance['status'] = score >= 78 ? 'ok' : score >= 60 ? 'attention' : 'adjust';
    const title = position === 'take-pe'
      ? status === 'ok'
        ? 'Enquadramento da pisada pronto'
        : 'Ajuste o take dos pés'
      : status === 'ok'
        ? 'Enquadramento pronto'
        : 'Ajuste o enquadramento';

    const defaultDetails = position === 'take-pe'
      ? [
          'Mantenha joelhos, tornozelos e pés visíveis na mesma tomada.',
          'Procure apoiar o peso de forma equilibrada nos dois membros.'
        ]
      : [
          'Mantenha a postura neutra e o paciente centralizado no quadro.',
          'Evite inclinar a câmera para não distorcer os eixos corporais.'
        ];

    return {
      canCapture: score >= 60,
      score,
      status,
      title,
      details: details.length > 0 ? details : defaultDetails
    };
  }, []);

  const estimateSomatotype = useCallback((lm: Landmark[]): 'ectomorfo' | 'mesomorfo' | 'endomorfo' | null => {
    if (!lm[11] || !lm[12] || !lm[23] || !lm[24] || !lm[13] || !lm[14] || !lm[15] || !lm[16] || !lm[25] || !lm[26] || !lm[27] || !lm[28]) {
      return null;
    }

    const shoulderWidth = distance(lm[11], lm[12]);
    const hipWidth = distance(lm[23], lm[24]);
    const trunkCenterShoulder = midpoint(lm[11], lm[12]);
    const trunkCenterHip = midpoint(lm[23], lm[24]);
    const trunkLength = distance(trunkCenterShoulder, trunkCenterHip);

    if (trunkLength <= 0.0001) {
      return null;
    }

    const armLength = (distance(lm[11], lm[13]) + distance(lm[13], lm[15]) + distance(lm[12], lm[14]) + distance(lm[14], lm[16])) / 2;
    const legLength = (distance(lm[23], lm[25]) + distance(lm[25], lm[27]) + distance(lm[24], lm[26]) + distance(lm[26], lm[28])) / 2;

    const shoulderHipRatio = shoulderWidth / Math.max(hipWidth, 0.0001);
    const robustness = ((shoulderWidth + hipWidth) / 2) / trunkLength;
    const limbToTrunkRatio = (armLength + legLength) / (2 * trunkLength);

    let ectoScore = 0;
    let mesoScore = 0;
    let endoScore = 0;

    if (limbToTrunkRatio > 1.48) ectoScore += 2;
    if (limbToTrunkRatio >= 1.34 && limbToTrunkRatio <= 1.48) mesoScore += 2;
    if (limbToTrunkRatio < 1.34) endoScore += 2;

    if (robustness < 0.85) ectoScore += 2;
    if (robustness >= 0.85 && robustness <= 1.0) mesoScore += 2;
    if (robustness > 1.0) endoScore += 2;

    if (shoulderHipRatio > 1.1) mesoScore += 2;
    if (shoulderHipRatio >= 0.98 && shoulderHipRatio <= 1.1) ectoScore += 1;
    if (shoulderHipRatio < 0.98) endoScore += 2;

    if (mesoScore >= ectoScore && mesoScore >= endoScore) return 'mesomorfo';
    if (ectoScore >= mesoScore && ectoScore >= endoScore) return 'ectomorfo';
    return 'endomorfo';
  }, []);

  const emitBiotypeMonitoringEvent = useCallback((biotype: string, sampleCount: number) => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
      new CustomEvent('biotype-monitoring', {
        detail: {
          biotype,
          sampleCount,
          timestamp: new Date().toISOString()
        }
      })
    );
  }, []);

  const updateEstimatedBiotype = useCallback((detectedType: 'ectomorfo' | 'mesomorfo' | 'endomorfo' | null) => {
    if (!detectedType) return;

    const votes = biotypeVotesRef.current;
    votes.push(detectedType);
    if (votes.length > 24) {
      votes.shift();
    }

    const tally = {
      ectomorfo: votes.filter(v => v === 'ectomorfo').length,
      mesomorfo: votes.filter(v => v === 'mesomorfo').length,
      endomorfo: votes.filter(v => v === 'endomorfo').length
    };

    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]) as Array<['ectomorfo' | 'mesomorfo' | 'endomorfo', number]>;
    const [primary, primaryVotes] = sorted[0];
    const [secondary, secondaryVotes] = sorted[1];
    const totalVotes = votes.length;

    if (totalVotes < 6) {
      const message = 'Coletando proporções corporais...';
      setEstimatedBiotype(message);
      emitBiotypeMonitoringEvent(message, totalVotes);
      return;
    }

    if (primaryVotes - secondaryVotes <= 2) {
      const hybrid = `${primary}-${secondary}`;
      const message = `Híbrido (${hybrid}) - predominância de ${primary}`;
      setEstimatedBiotype(message);
      emitBiotypeMonitoringEvent(message, totalVotes);
      return;
    }

    const message = `${primary} (estimativa por câmera)`;
    setEstimatedBiotype(message);
    emitBiotypeMonitoringEvent(message, totalVotes);
  }, [emitBiotypeMonitoringEvent]);

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
      pes: 'Normal',
      relacaoPeTornozeloJoelho: 'Normal'
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
        // Plano sagital: cabeça, ombro, coluna torácica, pelve, joelho e tornozelo.
        const orelhaIndex = position === 'lado-direito' ? 8 : 7;
        const ombroIndex = position === 'lado-direito' ? 12 : 11;
        const quadrilIndex = position === 'lado-direito' ? 24 : 23;
        const joelhoIndex = position === 'lado-direito' ? 26 : 25;
        const tornozeloIndex = position === 'lado-direito' ? 28 : 27;
        const peIndex = position === 'lado-direito' ? 32 : 31;

        const protrusaoCabeca = percentual(lm[orelhaIndex].x - lm[ombroIndex].x);
        analysis.cabeca = protrusaoCabeca > 5.2
          ? `Protrusão de cabeça (${protrusaoCabeca.toFixed(1)}%)`
          : 'Cabeça alinhada';

        const anteriorizacaoOmbro = percentual(lm[ombroIndex].x - lm[quadrilIndex].x);
        analysis.ombro = anteriorizacaoOmbro > 5.2
          ? `Anteriorização de ombro (${anteriorizacaoOmbro.toFixed(1)}%)`
          : 'Ombro alinhado';

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

      case 'take-pe':
        // Take específico para pisada: foco em eixo joelho-tornozelo-pé e retropé.
        const centroJoelhosX = (lm[25].x + lm[26].x) / 2;
        const centroTornozelosX = (lm[27].x + lm[28].x) / 2;
        const centroAntepeX = (lm[31].x + lm[32].x) / 2;

        const desvioJoelhoSobrePe = percentual(centroJoelhosX - centroAntepeX);
        const desvioTornozeloSobrePe = percentual(centroTornozelosX - centroAntepeX);

        const anguloTibiotarsicoDireito = calcAngle(lm[26], lm[28], lm[32]);
        const anguloTibiotarsicoEsquerdo = calcAngle(lm[25], lm[27], lm[31]);
        const mediaAnguloTibiotarsico = (anguloTibiotarsicoDireito + anguloTibiotarsicoEsquerdo) / 2;

        const desvioRetropeDireito = lm[30].x - lm[28].x;
        const desvioRetropeEsquerdo = lm[29].x - lm[27].x;
        const mediaRetrope = (desvioRetropeDireito + desvioRetropeEsquerdo) / 2;

        const assimetriaArcoPlantar = percentual((lm[31].x - lm[29].x) - (lm[32].x - lm[30].x));
        const aberturaDireita = lm[28].x - lm[30].x;
        const aberturaEsquerda = lm[31].x - lm[29].x;
        const aberturaMediaPes = (aberturaDireita + aberturaEsquerda) / 2;
        const tendenciaPronacao = mediaRetrope > 0.015 && aberturaMediaPes > 0.02;
        const tendenciaSupinacao = mediaRetrope < -0.015 && aberturaMediaPes < -0.01;

        analysis.joelho = desvioJoelhoSobrePe > 4.2
          ? `Joelho fora do eixo do pé (${desvioJoelhoSobrePe.toFixed(1)}%)`
          : 'Joelho centrado sobre o pé';

        analysis.tornozelo = mediaRetrope > 0.018
          ? `Retropé em valgo com tendência à pronação (${(mediaRetrope * 100).toFixed(1)}%)`
          : mediaRetrope < -0.018
            ? `Retropé em varo com tendência à supinação (${Math.abs(mediaRetrope * 100).toFixed(1)}%)`
            : 'Retropé alinhado';

        analysis.pes = tendenciaPronacao
          ? `Pisada com tendência pronada e apoio medial aumentado (${Math.abs(aberturaMediaPes * 100).toFixed(1)}%)`
          : tendenciaSupinacao
            ? `Pisada com tendência supinada e apoio lateral aumentado (${Math.abs(aberturaMediaPes * 100).toFixed(1)}%)`
            : assimetriaArcoPlantar > 4.4
              ? `Assimetria de apoio plantar (${assimetriaArcoPlantar.toFixed(1)}%)`
              : 'Pisada mais neutra com apoio plantar simétrico';

        if (mediaAnguloTibiotarsico < 82) {
          analysis.relacaoPeTornozeloJoelho = `Relação pé-tornozelo-joelho com padrão rígido (${mediaAnguloTibiotarsico.toFixed(1)}°)`;
        } else if (mediaAnguloTibiotarsico > 112) {
          analysis.relacaoPeTornozeloJoelho = `Relação pé-tornozelo-joelho com compensação distal (${mediaAnguloTibiotarsico.toFixed(1)}°)`;
        } else if (desvioJoelhoSobrePe > 4.2 || desvioTornozeloSobrePe > 3.8 || Math.abs(mediaRetrope) > 0.018) {
          analysis.relacaoPeTornozeloJoelho = `Desalinhamento funcional da cadeia joelho-tornozelo-pé (K-F ${desvioJoelhoSobrePe.toFixed(1)}% | A-F ${desvioTornozeloSobrePe.toFixed(1)}%)`;
        } else {
          analysis.relacaoPeTornozeloJoelho = 'Relação pé-tornozelo-joelho estável para apoio e propulsão';
        }

        analysis.membrosInferiores = analysis.relacaoPeTornozeloJoelho;
        analysis.quadril = 'Foco da tomada: segmento distal';
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

    const detectedType = estimateSomatotype(lm);
    updateEstimatedBiotype(detectedType);
    setCaptureGuidance(buildCaptureGuidance(lm, currentPosition));

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
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.92);
    setCurrentImageBase64(imageBase64);

    // Desenhar esqueleto
    if (drawConnectorsRef.current && drawLandmarksRef.current) {
      drawConnectorsRef.current(ctx, lm, poseConnectionsRef.current as any, { color: '#00FF00', lineWidth: 2 });
      drawLandmarksRef.current(ctx, lm, { color: '#FF0000', lineWidth: 1, radius: 3 });
    }

    ctx.restore();
  }, [currentPosition, analyzePostureByPosition, buildCaptureGuidance, estimateSomatotype, updateEstimatedBiotype]);

  // Inicializar MediaPipe
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;
    let isCancelled = false;

    setIsInitialized(false);
    setPermissionError('');

    const initializePose = async () => {
      try {
        // Primeiro, pedir permissão explícita para acessar a câmera
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: cameraFacingMode,
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });

          // Fechar o stream inicial para que o MediaPipe possa usá-lo
          stream.getTracks().forEach(track => track.stop());
          console.log('Permissão de câmera concedida');
        } catch (permError: any) {
          console.error('Erro ao solicitar permissão de câmera:', permError);
          if (permError.name === 'NotAllowedError') {
            setPermissionError(
              'Permissão de câmera negada. Por favor, verifique as configurações de privacidade do navegador.'
            );
          } else if (permError.name === 'NotFoundError') {
            setPermissionError('Nenhuma câmera foi encontrada. Verifique se o dispositivo possui câmera.');
          } else {
            setPermissionError(`Erro ao acessar câmera: ${permError.message}`);
          }
          return;
        }

        // Inicializar o MediaPipe Pose
        console.log('Iniciando Pose...');
        let poseInstance: PoseInstance;
        try {
          const [poseApi, drawingApi] = await Promise.all([
            loadPoseApi(),
            loadDrawingApi()
          ]);
          const PoseCtor = poseApi.PoseCtor;
          poseConnectionsRef.current = poseApi.poseConnections;
          drawConnectorsRef.current = drawingApi.drawConnectors;
          drawLandmarksRef.current = drawingApi.drawLandmarks;

          poseInstance = new PoseCtor({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          });
          if (isCancelled) return;

          poseInstanceRef.current = poseInstance;
          console.log('Pose criado');
        } catch (poseConstructorError: any) {
          console.error('Erro ao criar Pose:', poseConstructorError);
          setPermissionError(`Erro ao carregar Pose: ${poseConstructorError.message}`);
          return;
        }

        try {
          await poseInstance.initialize();
          console.log('Pose inicializado');
        } catch (poseInitError: any) {
          console.error('Erro ao inicializar Pose:', poseInitError);
          setPermissionError(`Erro ao inicializar Pose: ${poseInitError.message}`);
          return;
        }

        poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        poseInstance.onResults(onResults);

        // Inicializar câmera
        console.log('Iniciando câmera...');
        const CameraCtor = await loadCameraCtor();
        const camera = new CameraCtor(videoRef.current!, {
          onFrame: async () => {
            if (videoRef.current) {
              const currentWidth = videoRef.current.videoWidth || 640;
              const currentHeight = videoRef.current.videoHeight || 480;
              if (
                currentWidth > 0 &&
                currentHeight > 0 &&
                (currentWidth !== videoDimensionsRef.current.width || currentHeight !== videoDimensionsRef.current.height)
              ) {
                videoDimensionsRef.current = { width: currentWidth, height: currentHeight };
                setVideoDimensions({ width: currentWidth, height: currentHeight });

                if (canvasRef.current) {
                  canvasRef.current.width = currentWidth;
                  canvasRef.current.height = currentHeight;
                }
              }

              await poseInstance.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
          facingMode: cameraFacingMode
        });

        cameraInstanceRef.current = camera;

        try {
          await camera.start();
          if (isCancelled) return;

          console.log('Câmera iniciada com sucesso');
          setIsInitialized(true);
          setPermissionError('');
        } catch (cameraStartError: any) {
          console.error('Erro ao iniciar câmera:', cameraStartError);
          setPermissionError(
            `Erro ao iniciar câmera: ${cameraStartError.message}. Tente recarregar a página.`
          );
        }
      } catch (error: any) {
        console.error('Erro geral na inicialização:', error);
        setPermissionError(`Erro inesperado: ${error?.message || 'Erro desconhecido'}. Tente recarregar a página.`);
      }
    };

    initializePose();

    return () => {
      isCancelled = true;
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop();
        cameraInstanceRef.current = null;
      }
      if (poseInstanceRef.current) {
        poseInstanceRef.current.close?.();
        poseInstanceRef.current = null;
      }
    };
  }, [onResults, cameraFacingMode]);

  return {
    videoRef,
    canvasRef,
    currentAnalysis,
    estimatedBiotype,
    captureGuidance,
    currentImageBase64,
    isInitialized,
    permissionError,
    videoDimensions
  };
};
