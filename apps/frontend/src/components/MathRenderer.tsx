import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MathRendererProps {
  content: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  const [processedContent, setProcessedContent] = React.useState('');

  React.useEffect(() => {
    const processContent = async () => {
      // Простой рендеринг математики для демонстрации
      // В реальном проекте здесь был бы MathJax или KaTeX
      const renderMath = (text: string) => {
        return text
          .replace(/\$\$([^$]+)\$\$/g, '<div class="math-block">$1</div>')
          .replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>')
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="math-fraction">$1/$2</span>');
      };

      const mathProcessed = renderMath(content);
      
      // Обрабатываем markdown
      const htmlContent = await marked.parse(mathProcessed);
      const sanitizedContent = DOMPurify.sanitize(htmlContent);
      
      setProcessedContent(sanitizedContent);
    };

    processContent();
  }, [content]);

  return (
    <div 
      className="math-content prose max-w-none"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

export default MathRenderer;
