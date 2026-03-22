import { useCallback } from 'react';
import jsPDF from 'jspdf';
import type { PatientData, SessionData } from '../types';

export const usePDFGenerator = () => {
  const generateConsolidatedReport = useCallback((patientData: PatientData, sessionData: SessionData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxContentY = pageHeight - 30;
    const contentWidth = pageWidth - 40;

    const ensureSpace = (requiredHeight: number, resetY: number = 20) => {
      if (currentY + requiredHeight > maxContentY) {
        doc.addPage();
        currentY = resetY;
      }
    };

    const normalizeImageData = (imageData: string): string => {
      if (imageData.startsWith('data:image/')) {
        return imageData;
      }
      return `data:image/jpeg;base64,${imageData}`;
    };

    const resolveImageFormat = (imageData: string): 'PNG' | 'JPEG' => {
      const lower = imageData.toLowerCase();
      return lower.includes('image/png') ? 'PNG' : 'JPEG';
    };

    const renderPhoto = (imageBase64: string, x: number, y: number, frameWidth: number, frameHeight: number): boolean => {
      try {
        const imageData = normalizeImageData(imageBase64);
        const imageFormat = resolveImageFormat(imageData);
        const properties = doc.getImageProperties(imageData);
        const sourceWidth = properties.width || 4;
        const sourceHeight = properties.height || 3;
        const sourceRatio = sourceWidth / sourceHeight;
        const frameRatio = frameWidth / frameHeight;

        let drawWidth = frameWidth;
        let drawHeight = frameHeight;

        if (sourceRatio > frameRatio) {
          drawHeight = frameWidth / sourceRatio;
        } else {
          drawWidth = frameHeight * sourceRatio;
        }

        const drawX = x + (frameWidth - drawWidth) / 2;
        const drawY = y + (frameHeight - drawHeight) / 2;

        doc.setFillColor(248, 248, 248);
        doc.roundedRect(x, y, frameWidth, frameHeight, 2, 2, 'FD');
        doc.addImage(imageData, imageFormat, drawX, drawY, drawWidth, drawHeight, undefined, 'MEDIUM');
        doc.setDrawColor(180, 180, 180);
        doc.roundedRect(x, y, frameWidth, frameHeight, 2, 2, 'S');
        return true;
      } catch (error) {
        console.error('Erro ao adicionar imagem no PDF:', error);
        return false;
      }
    };
    
    // Cabeçalho
    doc.setFillColor(31, 58, 147);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('POSTURAI - LAUDO COMPLETO DE AVALIAÇÃO', 15, 25);
    
    // Dados do paciente
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Nome: ${patientData.nome || 'Paciente Anônimo'}`, 20, 50);
    doc.text(`Idade: ${patientData.idade || '--'}`, 20, 57);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 50);
    
    let currentY = 70;
    
    // Queixa principal
    if (patientData.queixa) {
      doc.setFont('helvetica', 'bold');
      doc.text('Queixa Principal:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      const queixaLines = doc.splitTextToSize(patientData.queixa, 170);
      doc.text(queixaLines, 20, currentY + 7);
      currentY += 7 + (queixaLines.length * 5) + 10;
    }

    // Análise consolidada
    if (sessionData.consolidatedAnalysis) {
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISE CONSOLIDADA:', 20, currentY);
      currentY += 10;

      doc.setFont('helvetica', 'normal');
      const geralLines = doc.splitTextToSize(`Avaliação Geral: ${sessionData.consolidatedAnalysis.geral}`, 170);
      doc.text(geralLines, 20, currentY);
      currentY += geralLines.length * 5;

      doc.text(`Severidade: ${sessionData.consolidatedAnalysis.severidade.toUpperCase()}`, 20, currentY);
      currentY += 10;

      // Pontos críticos
      if (sessionData.consolidatedAnalysis.pontosCriticos.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Pontos Críticos Identificados:', 20, currentY);
        currentY += 7;
        doc.setFont('helvetica', 'normal');
        
        sessionData.consolidatedAnalysis.pontosCriticos.forEach((ponto) => {
          ensureSpace(15);
          const pontoLines = doc.splitTextToSize(`• ${ponto}`, 170);
          doc.text(pontoLines, 25, currentY);
          currentY += pontoLines.length * 5;
        });
        currentY += 5;
      }

      // Recomendações
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendações:', 20, currentY);
      currentY += 7;
      doc.setFont('helvetica', 'normal');
      
      sessionData.consolidatedAnalysis.recomendacoes.forEach((rec) => {
        ensureSpace(15);
        const recLines = doc.splitTextToSize(`• ${rec}`, 170);
        doc.text(recLines, 25, currentY);
        currentY += recLines.length * 5;
      });
      currentY += 10;

      if (sessionData.consolidatedAnalysis.condutasEspecificas.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('PROTOCOLOS ESPECÍFICOS (EXERCÍCIOS E ALONGAMENTOS):', 20, currentY);
        currentY += 7;

        sessionData.consolidatedAnalysis.condutasEspecificas.forEach((conduta) => {
          ensureSpace(35);

          doc.setFont('helvetica', 'bold');
          const tituloLines = doc.splitTextToSize(`• ${conduta.problema}`, 165);
          doc.text(tituloLines, 22, currentY);
          currentY += tituloLines.length * 5;

          doc.setFont('helvetica', 'normal');
          const exercicios = doc.splitTextToSize(`Exercícios: ${conduta.exercicios.join(' | ')}`, 160);
          doc.text(exercicios, 27, currentY);
          currentY += exercicios.length * 5;

          const alongamentos = doc.splitTextToSize(`Alongamentos: ${conduta.alongamentos.join(' | ')}`, 160);
          doc.text(alongamentos, 27, currentY);
          currentY += alongamentos.length * 5 + 3;
        });

        currentY += 5;
      }
    }

    // Detalhes por posição com imagem correspondente
    doc.setFont('helvetica', 'bold');
    doc.text('ANÁLISE DETALHADA POR POSIÇÃO (COM IMAGENS):', 20, currentY);
    currentY += 10;

    const positionLabels = {
      'frente': 'Vista Frontal',
      'lado-direito': 'Perfil Direito',
      'lado-esquerdo': 'Perfil Esquerdo',
      'costas': 'Vista Posterior'
    };

    sessionData.captures.forEach((capture) => {
      const hasImage = Boolean(capture.imagemBase64);
      const photoWidth = Math.min(contentWidth - 20, 120);
      const photoHeight = 80;
      const imageBlockHeight = hasImage ? photoHeight + 10 : 0;
      ensureSpace(38 + imageBlockHeight);

      doc.setFont('helvetica', 'bold');
      doc.text(`${positionLabels[capture.position]}:`, 20, currentY);
      currentY += 7;

      doc.setFont('helvetica', 'normal');
      // Listar apenas análises relevantes por posição
      Object.entries(capture.analysis).forEach(([key, value]) => {
        if (value && value !== 'Normal' && value !== 'Aguardando detecção...') {
          ensureSpace(8);
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          doc.text(`  ${label}: ${value}`, 25, currentY);
          currentY += 5;
        }
      });

      if (hasImage) {
        ensureSpace(photoHeight + 12);
        const photoX = 25;
        const rendered = renderPhoto(capture.imagemBase64, photoX, currentY + 2, photoWidth, photoHeight);
        if (rendered) {
          currentY += photoHeight + 10;
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.text('Não foi possível renderizar a imagem desta posição.', photoX + 2, currentY + 10);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          currentY += 16;
        }
      }
      
      currentY += 5;
    });

    // Seção de imagens capturadas
    if (sessionData.captures.length > 0) {
      doc.addPage();
      currentY = 20;
      doc.setFont('helvetica', 'bold');
      doc.text('REGISTRO FOTOGRÁFICO DA AVALIAÇÃO:', 20, currentY);
      currentY += 10;

      sessionData.captures.forEach((capture, index) => {
        const label = `${index + 1}. ${positionLabels[capture.position]}`;
        const hasImage = Boolean(capture.imagemBase64);
        const photoWidth = Math.min(contentWidth - 20, 130);
        const photoHeight = 90;
        const photoX = 20 + (contentWidth - photoWidth) / 2;
        const captionYGap = 8;

        ensureSpace(hasImage ? photoHeight + 22 : 15, 20);
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, currentY);
        currentY += 5;

        if (hasImage) {
          const rendered = renderPhoto(capture.imagemBase64, photoX, currentY + 2, photoWidth, photoHeight);
          if (rendered) {
            const timestamp = new Date(capture.timestamp).toLocaleString('pt-BR');
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text(`Registro: ${timestamp}`, photoX, currentY + photoHeight + captionYGap);
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            currentY += photoHeight + 14;
          } else {
            doc.setFont('helvetica', 'normal');
            doc.text('Imagem não disponível para esta captura.', 25, currentY + 4);
            currentY += 12;
          }
        } else {
          doc.setFont('helvetica', 'normal');
          doc.text('Imagem não disponível para esta captura.', 25, currentY + 4);
          currentY += 12;
        }
      });
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text('Documento gerado para fins de suporte à decisão clínica.', 20, 280);
      doc.text(`Página ${i} de ${pageCount}`, 180, 280);
    }
    
    // Salvar arquivo
    const fileName = `Laudo_Completo_${patientData.nome || 'Paciente'}.pdf`;
    doc.save(fileName);
  }, []);

  return { generateConsolidatedReport };
};
