import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Math from './extensions/MathExtension';
import 'katex/dist/katex.min.css';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaImage,
  FaLink,
  FaQuoteRight,
  FaCode,
  FaUndo,
  FaRedo,
  FaSquareRootAlt
} from 'react-icons/fa';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
  compact?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Введите текст...',
  onImageUpload,
  className = '',
  compact = false
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Math,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm mx-auto focus:outline-none ${compact ? 'min-h-[80px] p-2' : 'min-h-[150px] p-4'}`,
      },
    },
  });

  const addImage = useCallback(async () => {
    if (!onImageUpload) {
      const url = window.prompt('Введите URL изображения:');
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        try {
          const url = await onImageUpload(file);
          editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Ошибка загрузки изображения:', error);
          alert('Ошибка при загрузке изображения');
        }
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('Введите URL ссылки:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addMath = useCallback(() => {
    const mathExpression = window.prompt('Введите математическую формулу (LaTeX):', 'x^2 + y^2 = z^2');
    
    if (mathExpression && editor) {
      // Используем наше кастомное расширение Math
      editor.chain().focus().setMath({ content: mathExpression }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Панель инструментов */}
      <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded text-sm hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''
            }`}
          title="Жирный"
        >
          <FaBold />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded text-sm hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
          title="Курсив"
        >
          <FaItalic />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded text-sm hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
          title="Зачеркнутый"
        >
          <FaUnderline />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded text-sm hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
          title="Маркированный список"
        >
          <FaListUl />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded text-sm hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
          title="Нумерованный список"
        >
          <FaListOl />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded text-sm hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-300' : ''
            }`}
          title="Цитата"
        >
          <FaQuoteRight />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded text-sm hover:bg-gray-200 ${editor.isActive('codeBlock') ? 'bg-gray-300' : ''
            }`}
          title="Блок кода"
        >
          <FaCode />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded text-sm hover:bg-gray-200"
          title="Добавить изображение"
        >
          <FaImage />
        </button>

        <button
          type="button"
          onClick={addLink}
          className={`p-2 rounded text-sm hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''
            }`}
          title="Добавить ссылку"
        >
          <FaLink />
        </button>

        <button
          type="button"
          onClick={addMath}
          className="p-2 rounded text-sm hover:bg-gray-200"
          title="Добавить математическую формулу"
        >
          <FaSquareRootAlt />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
          title="Отменить"
        >
          <FaUndo />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
          title="Повторить"
        >
          <FaRedo />
        </button>
      </div>

      {/* Область редактирования */}
      <div className={`${compact ? 'min-h-[80px] max-h-[200px]' : 'min-h-[150px] max-h-[400px]'} overflow-y-auto`}>
        <EditorContent
          editor={editor}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
