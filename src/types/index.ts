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
  relacaoPeTornozeloJoelho?: string;
}

export interface CaptureData {
  position: AnatomicalPosition;
  analysis: PostureAnalysis;
  imagemBase64: string;
  timestamp: Date;
}

export type AnatomicalPosition = 'frente' | 'lado-direito' | 'lado-esquerdo' | 'costas' | 'take-pe';

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
  peso: string;
  imc: string;
  icq: string;
  riscoIcq: string;
  padraoGorduraCorporal: string;
  gorduraCorporal: string;
  taxaMuscular: string;
  massaCorporalMagra: string;
  gorduraSubcutanea: string;
  gorduraVisceral: string;
  aguaCorporal: string;
  musculoEsqueletico: string;
  massaMuscular: string;
  massaOssea: string;
  proteina: string;
  tmb: string;
  idadeCorporal: string;
  massaGorda: string;
  pesoDaAgua: string;
  massaDeProteina: string;
  pesoCorporalIdeal: string;
  nivelObesidade: string;
}

export interface PerimetryData {
  ombro: string;
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
  sexo: '' | 'homem' | 'mulher';
  altura: string;
  idade: string;
  queixa: string;
  composicaoCorporal: BodyCompositionData;
  perimetria: PerimetryData;
}
