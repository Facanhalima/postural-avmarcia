import { useState, useCallback } from 'react';
import type { 
  SessionData, 
  CaptureData, 
  AnatomicalPosition, 
  PostureAnalysis,
  ConsolidatedAnalysis,
  TherapeuticPlan
} from '../types';

const ANATOMICAL_POSITIONS: AnatomicalPosition[] = [
  'frente', 
  'lado-direito', 
  'lado-esquerdo', 
  'costas'
];

const POSITION_LABELS = {
  'frente': 'Vista Frontal',
  'lado-direito': 'Perfil Direito', 
  'lado-esquerdo': 'Perfil Esquerdo',
  'costas': 'Vista Posterior'
};

const POSITION_INSTRUCTIONS = {
  'frente': 'Posicione o paciente de frente para a câmera, braços ao lado do corpo',
  'lado-direito': 'Posicione o paciente de perfil direito, mostrando o lado direito do corpo',
  'lado-esquerdo': 'Posicione o paciente de perfil esquerdo, mostrando o lado esquerdo do corpo', 
  'costas': 'Posicione o paciente de costas para a câmera, braços ao lado do corpo'
};

type IssueKey =
  | 'cabeca-cervical'
  | 'ombros-torax'
  | 'coluna'
  | 'pelve-quadril'
  | 'joelhos'
  | 'tornozelos-pes';

const THERAPEUTIC_LIBRARY: Record<IssueKey, TherapeuticPlan> = {
  'cabeca-cervical': {
    problema: 'Alteração de cabeça/cervical (inclinação, rotação ou protrusão)',
    exercicios: [
      'Chin tuck na parede - 3x12 repetições',
      'Fortalecimento isométrico cervical em 4 direções - 3x20 segundos',
      'Remada baixa com foco em retração escapular - 3x12 repetições'
    ],
    alongamentos: [
      'Trapézio superior e levantador da escápula - 3x30 segundos por lado',
      'Escalenos e esternocleidomastoideo - 3x30 segundos por lado'
    ]
  },
  'ombros-torax': {
    problema: 'Assimetria, anteriorização de ombros/escápulas ou rotação torácica',
    exercicios: [
      'Y-T-W em decúbito ventral ou faixa elástica - 3x10 repetições',
      'Serratus punch com faixa elástica - 3x12 repetições',
      'Mobilidade torácica em rotação (open book) - 2x10 por lado'
    ],
    alongamentos: [
      'Peitoral maior e menor na porta - 3x30 segundos por lado',
      'Latíssimo do dorso e cadeia anterolateral do tronco - 3x30 segundos'
    ]
  },
  'coluna': {
    problema: 'Desvio da coluna (escoliose funcional, hipercifose ou retificação)',
    exercicios: [
      'Bird-dog com controle lombo-pélvico - 3x10 por lado',
      'Prancha lateral progressiva - 3x20 a 40 segundos por lado',
      'Extensão torácica em rolo - 2x12 repetições'
    ],
    alongamentos: [
      'Cadeia posterior global - 3x40 segundos',
      'Mobilização toracolombar em posição de criança com inclinação lateral - 3x30 segundos por lado'
    ]
  },
  'pelve-quadril': {
    problema: 'Assimetria/rotação pélvica ou alteração de quadril',
    exercicios: [
      'Ponte unilateral com controle de pelve - 3x10 por lado',
      'Clam shell com mini-band - 3x15 por lado',
      'Dead bug com ativação de core profundo - 3x10 repetições'
    ],
    alongamentos: [
      'Iliopsoas em meio-ajoelhado - 3x30 segundos por lado',
      'Piriforme e glúteo posterior - 3x30 segundos por lado',
      'Quadrado lombar em inclinação lateral - 3x30 segundos por lado'
    ]
  },
  'joelhos': {
    problema: 'Desalinhamento femorotibial (valgo, varo, flexo ou recurvato)',
    exercicios: [
      'Agachamento com mini-band e controle de joelho - 3x12 repetições',
      'Step-down em apoio unilateral - 3x10 por lado',
      'Fortalecimento de glúteo médio e VMO - 3x12 repetições'
    ],
    alongamentos: [
      'Trato iliotibial e tensor da fáscia lata - 3x30 segundos por lado',
      'Isquiotibiais e gastrocnêmio - 3x30 segundos por lado'
    ]
  },
  'tornozelos-pes': {
    problema: 'Alteração de tornozelos/pés (valgismo, varismo ou apoio plantar)',
    exercicios: [
      'Elevação de panturrilha unilateral com alinhamento do calcâneo - 3x15 por lado',
      'Short foot (ativação do arco plantar) - 3x12 repetições',
      'Equilíbrio unipodal com progressão de instabilidade - 3x30 segundos por lado'
    ],
    alongamentos: [
      'Gastrocnêmio e sóleo na parede - 3x30 segundos por lado',
      'Fáscia plantar com apoio em bola - 2x60 segundos por lado'
    ]
  }
};

export const useSessionManager = () => {
  const [sessionData, setSessionData] = useState<SessionData>({
    captures: [],
    currentPosition: 'frente',
    currentStep: 0,
    isComplete: false
  });

  const getCurrentPositionLabel = useCallback(() => {
    return POSITION_LABELS[sessionData.currentPosition];
  }, [sessionData.currentPosition]);

  const getCurrentInstruction = useCallback(() => {
    return POSITION_INSTRUCTIONS[sessionData.currentPosition];
  }, [sessionData.currentPosition]);

  const captureCurrentPosition = useCallback((analysis: PostureAnalysis, imageBase64: string) => {
    const newCapture: CaptureData = {
      position: sessionData.currentPosition,
      analysis,
      imagemBase64: imageBase64,
      timestamp: new Date()
    };

    setSessionData(prev => {
      const newCaptures = [...prev.captures, newCapture];
      const nextStep = prev.currentStep + 1;
      const isComplete = nextStep >= ANATOMICAL_POSITIONS.length;
      
      return {
        ...prev,
        captures: newCaptures,
        currentStep: nextStep,
        currentPosition: isComplete ? prev.currentPosition : ANATOMICAL_POSITIONS[nextStep],
        isComplete
      };
    });
  }, [sessionData.currentPosition, sessionData.currentStep]);

  const generateConsolidatedAnalysis = useCallback((): ConsolidatedAnalysis => {
    const { captures } = sessionData;
    
    const issues: string[] = [];
    const issueKeys = new Set<IssueKey>();
    let severityScore = 0;

    const hasAnyTerm = (text: string | undefined, terms: string[]): boolean => {
      if (!text) return false;
      const normalized = text.toLowerCase();
      return terms.some(term => normalized.includes(term));
    };

    const registerIssue = (message: string, score: number, key: IssueKey) => {
      if (!issues.includes(message)) {
        issues.push(message);
        severityScore += score;
      }
      issueKeys.add(key);
    };

    const describePosition = (position: AnatomicalPosition): string =>
      position === 'frente'
        ? 'vista frontal'
        : position === 'costas'
          ? 'vista posterior'
          : `perfil ${position === 'lado-direito' ? 'direito' : 'esquerdo'}`;

    captures.forEach(capture => {
      const { position, analysis } = capture;

      if (hasAnyTerm(analysis.cabeca, ['inclinação', 'rotação', 'protrusão']) || hasAnyTerm(analysis.cervical, ['protrusão'])) {
        registerIssue(`Alteração de cabeça/cervical identificada na ${describePosition(position)}`, 2, 'cabeca-cervical');
      }

      if (hasAnyTerm(analysis.ombro, ['desnível', 'assimetria', 'anteriorização', 'protração']) || hasAnyTerm(analysis.torax, ['rotação', 'assimetria', 'convexidade'])) {
        registerIssue(`Alteração de ombros/escápulas ou tórax observada na ${describePosition(position)}`, 2, 'ombros-torax');
      }

      if (hasAnyTerm(analysis.coluna, ['escoliose', 'desvio lateral', 'hipercifose', 'retificação'])) {
        registerIssue(`Alteração de coluna encontrada na ${describePosition(position)}`, 3, 'coluna');
      }

      if (hasAnyTerm(analysis.pelve, ['assimetria', 'rotação', 'anteversão', 'retroversão', 'diferença de altura']) ||
          hasAnyTerm(analysis.quadril, ['inclinação', 'rotação', 'anteversão', 'retroversão'])) {
        registerIssue(`Desalinhamento pélvico/quadril detectado na ${describePosition(position)}`, 2, 'pelve-quadril');
      }

      if (hasAnyTerm(analysis.joelho, ['valgos', 'varos', 'assimetria', 'flexo', 'recurvato'])) {
        registerIssue(`Alteração de joelhos identificada na ${describePosition(position)}`, 2, 'joelhos');
      }

      if (hasAnyTerm(analysis.tornozelo, ['desalinhamento', 'restrição', 'valgismo', 'varismo']) ||
          hasAnyTerm(analysis.pes, ['assimetria', 'rotação', 'apoio plantar'])) {
        registerIssue(`Alteração de tornozelos/pés observada na ${describePosition(position)}`, 2, 'tornozelos-pes');
      }
    });

    let severidade: 'leve' | 'moderada' | 'severa' = 'leve';
    if (severityScore >= 9) severidade = 'severa';
    else if (severityScore >= 5) severidade = 'moderada';

    const condutasEspecificas = Array.from(issueKeys).map(issueKey => THERAPEUTIC_LIBRARY[issueKey]);

    const recomendacoes = condutasEspecificas.length
      ? condutasEspecificas.map((conduta) =>
          `${conduta.problema}: priorizar ${conduta.exercicios[0]} e alongar ${conduta.alongamentos[0]}.`
        )
      : ['Manter atividade física regular, higiene postural e reavaliação periódica.'];

    const geral = issues.length === 0 
      ? 'Análise postural dentro dos parâmetros de normalidade'
      : `Identificados ${issues.length} ponto(s) de atenção postural com plano terapêutico direcionado.`;

    return {
      geral,
      pontosCriticos: issues,
      recomendacoes,
      condutasEspecificas,
      severidade
    };
  }, [sessionData.captures]);

  const completeSession = useCallback(() => {
    const consolidatedAnalysis = generateConsolidatedAnalysis();
    
    setSessionData(prev => ({
      ...prev,
      consolidatedAnalysis,
      isComplete: true
    }));

    return consolidatedAnalysis;
  }, [generateConsolidatedAnalysis]);

  const resetSession = useCallback(() => {
    setSessionData({
      captures: [],
      currentPosition: 'frente',
      currentStep: 0,
      isComplete: false
    });
  }, []);

  const getProgressPercentage = useCallback(() => {
    return Math.round((sessionData.currentStep / ANATOMICAL_POSITIONS.length) * 100);
  }, [sessionData.currentStep]);

  return {
    sessionData,
    getCurrentPositionLabel,
    getCurrentInstruction,
    captureCurrentPosition,
    completeSession,
    resetSession,
    getProgressPercentage,
    totalSteps: ANATOMICAL_POSITIONS.length
  };
};
