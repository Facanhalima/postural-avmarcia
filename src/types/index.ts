// Types for MediaPipe Pose
export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseResults {
  poseLandmarks?: Landmark[];
  image: HTMLCanvasElement | HTMLImageElement;
}

export interface PostureAnalysis {
  ombro: string;
  pelve: string;
  joelho: string;
  cervical: string;
  coluna?: string;
  quadril?: string;
  tornozelo?: string;
  cabeca?: string;
  torax?: string;
  membrosSuperiores?: string;
  membrosInferiores?: string;
  pes?: string;
}

export interface CaptureData {
  position: AnatomicalPosition;
  analysis: PostureAnalysis;
  imagemBase64: string;
  timestamp: Date;
}

export type AnatomicalPosition = 'frente' | 'lado-direito' | 'lado-esquerdo' | 'costas';

export interface SessionData {
  captures: CaptureData[];
  currentPosition: AnatomicalPosition;
  currentStep: number;
  isComplete: boolean;
  consolidatedAnalysis?: ConsolidatedAnalysis;
}

export interface ConsolidatedAnalysis {
  geral: string;
  pontosCriticos: string[];
  recomendacoes: string[];
  condutasEspecificas: TherapeuticPlan[];
  severidade: 'leve' | 'moderada' | 'severa';
}

export interface TherapeuticPlan {
  problema: string;
  exercicios: string[];
  alongamentos: string[];
}

export interface BodyCompositionData {
  biotipo: string;
  biotipoObesidade: string;
}

export interface PerimetryData {
  pescoco: string;
  torax: string;
  cintura: string;
  abdomen: string;
  quadril: string;
  bracoDireitoRelaxado: string;
  bracoEsquerdoRelaxado: string;
  bracoDireitoContraido: string;
  bracoEsquerdoContraido: string;
  antebracoDireito: string;
  antebracoEsquerdo: string;
  coxaDireitaProximal: string;
  coxaEsquerdaProximal: string;
  coxaDireitaMedial: string;
  coxaEsquerdaMedial: string;
  panturrilhaDireita: string;
  panturrilhaEsquerda: string;
}

export interface PatientData {
  nome: string;
  idade: string;
  queixa: string;
  composicaoCorporal: BodyCompositionData;
  perimetria: PerimetryData;
}
