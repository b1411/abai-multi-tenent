import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      
      // Сначала устанавливаем HTML контент
      container.innerHTML = content;
      
      // Находим и рендерим span[data-math] элементы
      const mathElements = container.querySelectorAll('span[data-math]');
      mathElements.forEach((element) => {
        const mathContent = element.getAttribute('data-math');
        if (mathContent) {
          try {
            katex.render(mathContent, element as HTMLElement, {
              throwOnError: false,
              displayMode: false,
            });
          } catch (error) {
            console.error('KaTeX render error:', error);
            element.textContent = `$${mathContent}$`;
          }
        }
      });
      
      // Обрабатываем inline LaTeX формулы $formula$
      const processedContent = container.innerHTML.replace(/\$([^$]+)\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (error) {
          console.error('KaTeX render error:', error);
          return match;
        }
      });

      // Обрабатываем блочные формулы $$formula$$
      const finalContent = processedContent.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: true,
          });
        } catch (error) {
          console.error('KaTeX render error:', error);
          return match;
        }
      });

      container.innerHTML = finalContent;
    }
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className={`prose prose-sm max-w-none ${className}`}
    />
  );
};

export default MathRenderer;
