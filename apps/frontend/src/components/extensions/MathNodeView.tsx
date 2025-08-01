import React, { useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const mathRef = useRef<HTMLSpanElement>(null);
  const { content } = node.attrs;

  useEffect(() => {
    if (mathRef.current && content) {
      try {
        katex.render(content, mathRef.current, {
          throwOnError: false,
          displayMode: false,
        });
      } catch (error) {
        console.error('KaTeX render error:', error);
        if (mathRef.current) {
          mathRef.current.textContent = `$${content}$`;
        }
      }
    }
  }, [content]);

  const handleDoubleClick = () => {
    const newContent = window.prompt('Редактировать формулу (LaTeX):', content);
    if (newContent !== null) {
      updateAttributes({ content: newContent });
    }
  };

  return (
    <NodeViewWrapper className="math-node-wrapper">
      <span
        ref={mathRef}
        className={`math-node inline-block cursor-pointer ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        onDoubleClick={handleDoubleClick}
        title="Дважды кликните для редактирования"
        style={{
          padding: '2px 4px',
          margin: '0 2px',
          borderRadius: '3px',
          backgroundColor: selected ? '#eff6ff' : 'transparent',
        }}
      />
    </NodeViewWrapper>
  );
};

export default MathNodeView;
