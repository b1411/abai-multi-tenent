import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import DOMPurify from 'isomorphic-dompurify';

interface MathRendererProps {
  content: string;
}

/**
 * Компонент для рендеринга контента с LaTeX формулами
 * Ищет все LaTeX формулы в тексте и заменяет их на отрендеренные математические выражения
 */
const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  if (!content) return null;

  // Очищаем HTML от потенциально вредоносного кода
  const sanitizedContent = DOMPurify.sanitize(content);
  
  // Регулярные выражения для поиска LaTeX формул
  const inlineRegex = /\$((?!\$)[\s\S]*?)\$/g;
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  
  // Разбиваем контент на части: обычный текст и LaTeX формулы
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Находим все блочные LaTeX формулы
  while ((match = blockRegex.exec(sanitizedContent)) !== null) {
    // Добавляем текст до формулы (включая разметку HTML)
    if (match.index > lastIndex) {
      parts.push(
        <span 
          key={`text-${lastIndex}`} 
          dangerouslySetInnerHTML={{ __html: sanitizedContent.substring(lastIndex, match.index) }} 
        />
      );
    }
    
    // Добавляем блочную LaTeX формулу
    try {
      parts.push(
        <BlockMath key={`block-${match.index}`} math={match[1]} />
      );
    } catch (error) {
      console.error('Error rendering block formula:', error);
      parts.push(<span key={`block-error-${match.index}`}>{match[0]}</span>);
    }
    
    lastIndex = match.index + match[0].length;
  }

  // Добавляем оставшийся текст
  if (lastIndex < sanitizedContent.length) {
    const remainingContent = sanitizedContent.substring(lastIndex);
    
    // Теперь обрабатываем инлайновые формулы в оставшемся тексте
    const inlineParts: React.ReactNode[] = [];
    let inlineLastIndex = 0;
    let inlineMatch;
    
    while ((inlineMatch = inlineRegex.exec(remainingContent)) !== null) {
      // Добавляем текст до формулы
      if (inlineMatch.index > inlineLastIndex) {
        inlineParts.push(
          <span 
            key={`text-inline-${inlineLastIndex}`} 
            dangerouslySetInnerHTML={{ __html: remainingContent.substring(inlineLastIndex, inlineMatch.index) }} 
          />
        );
      }
      
      // Добавляем инлайновую LaTeX формулу
      try {
        inlineParts.push(
          <InlineMath key={`inline-${inlineMatch.index}`} math={inlineMatch[1]} />
        );
      } catch (error) {
        console.error('Error rendering inline formula:', error);
        inlineParts.push(<span key={`inline-error-${inlineMatch.index}`}>{inlineMatch[0]}</span>);
      }
      
      inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
    }
    
    // Добавляем оставшийся текст
    if (inlineLastIndex < remainingContent.length) {
      inlineParts.push(
        <span 
          key={`text-inline-end`} 
          dangerouslySetInnerHTML={{ __html: remainingContent.substring(inlineLastIndex) }} 
        />
      );
    }
    
    // Добавляем обработанные инлайновые части в общий массив
    if (inlineParts.length > 0) {
      parts.push(...inlineParts);
    } else {
      parts.push(
        <span 
          key="remaining" 
          dangerouslySetInnerHTML={{ __html: remainingContent }} 
        />
      );
    }
  }

  return <div className="math-renderer">{parts}</div>;
};

// Удаляем неиспользуемую функцию processContentWithLatex

export default MathRenderer;
