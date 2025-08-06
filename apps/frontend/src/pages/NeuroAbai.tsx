import React, { useState, useRef, useCallback } from 'react';
import { neuroAbaiService } from '../services/neuroAbaiService';
import { Paperclip, Send, X, FileText, Bot, User, ChevronDown } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FileUploadAreaProps {
  files: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  disabled: boolean;
}

// Message loading animation component
function MessageLoading() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
      <circle cx="4" cy="12" r="2" fill="currentColor">
        <animate id="spinner_qFRN" begin="0;spinner_OcgL.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" />
      </circle>
      <circle cx="12" cy="12" r="2" fill="currentColor">
        <animate begin="spinner_qFRN.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" />
      </circle>
      <circle cx="20" cy="12" r="2" fill="currentColor">
        <animate id="spinner_OcgL" begin="spinner_qFRN.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" />
      </circle>
    </svg>
  );
}

function ChatBubble({ variant = "received", children }: { variant?: 'sent' | 'received'; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-3 mb-4 ${variant === "sent" ? "flex-row-reverse" : ""}`}>
      {children}
    </div>
  );
}

function ChatBubbleAvatar({ variant = "received" }: { variant?: 'sent' | 'received' }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
      variant === "sent" ? "bg-blue-500 text-white" : "bg-gray-200 text-blue-500"
    }`}>
      {variant === "sent" ? <User size={16} /> : <Bot size={16} />}
    </div>
  );
}

function ChatBubbleMessage({ 
  variant = "received", 
  isLoading, 
  children 
}: { 
  variant?: 'sent' | 'received'; 
  isLoading?: boolean; 
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-[80%] text-sm sm:text-base ${
      variant === "sent" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
    }`}>
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words">{children}</div>
      )}
    </div>
  );
}

function FileUploadArea({ files, onFileChange, onRemoveFile, disabled }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileChange(fakeEvent);
    }
  }, [onFileChange, disabled]);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="mt-2 sm:mt-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileChange}
        disabled={disabled}
        className="hidden"
      />
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 sm:gap-2 rounded-lg border-2 border-dashed p-3 sm:p-4 transition-colors ${
          isDragging 
            ? "border-blue-500/50 bg-blue-500/5" 
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="rounded-full bg-white p-1.5 sm:p-2 shadow-sm">
          <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm font-medium">Нажмите для выбора файлов</p>
          <p className="text-xs text-gray-400 hidden sm:block">или перетащите файлы сюда</p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium">Выбранные файлы:</p>
          <div className="space-y-1 sm:space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between rounded-md bg-gray-100 p-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <FileText size={14} className="sm:w-4 sm:h-4 shrink-0 text-gray-400" />
                  <span className="truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="ml-2 rounded-full p-1 hover:bg-white shrink-0"
                  disabled={disabled}
                >
                  <X size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NeuroAbai() {
  const SCENARIOS = [
    { label: 'Анализ КТП', value: 'Проведи анализ КТП по загруженному файлу.' },
    { label: 'Переписать цель урока', value: 'Перепиши цель урока более современно и понятно.' },
    { label: 'Улучшить задания', value: 'Улучшить задания для учеников.' },
    { label: 'Создать СОР/СОЧ', value: 'Создай СОР или СОЧ по теме.' },
    { label: 'Найти ошибки', value: 'Найди ошибки в тексте или файле.' },
  ];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [scenario, setScenario] = useState(SCENARIOS[0].value);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input && files.length === 0) return;

    const userMessage = input || 'Файл отправлен без сообщения';
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setInput('');
    setTimeout(scrollToBottom, 100);

    try {
      const response = await neuroAbaiService.sendMessage({
        message: input,
        scenario,
        files
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response || 'Нет ответа' }]);
      setFiles([]);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка при отправке запроса.' }]);
      setTimeout(scrollToBottom, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Neuro Abai</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Интеллектуальный помощник для учителей
        </p>
      </div>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col mx-auto w-full max-w-4xl p-2 sm:p-4">
        <div className="flex-1 flex flex-col overflow-hidden rounded-lg sm:rounded-xl border bg-white shadow-lg">
          {/* Выбор сценария */}
          <div className="border-b p-3 sm:p-4 flex-shrink-0">
            <h2 className="text-center text-lg sm:text-xl font-bold text-blue-600 mb-3 sm:mb-4">Fizmat AI Ala</h2>
            <div className="relative">
              <select
                value={scenario}
                onChange={e => setScenario(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {SCENARIOS.map(s => (
                  <option key={s.label} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Область чата */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 min-h-0">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-gray-400 px-4">
                <Bot size={36} className="sm:w-12 sm:h-12 mb-4 text-blue-500" />
                <h3 className="text-base sm:text-lg font-medium">Начните диалог с Neuro Abai</h3>
                <p className="mt-2 text-xs sm:text-sm">Задайте вопрос или загрузите файл для анализа</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <ChatBubble key={idx} variant={msg.role === 'user' ? 'sent' : 'received'}>
                  <ChatBubbleAvatar variant={msg.role === 'user' ? 'sent' : 'received'} />
                  <ChatBubbleMessage variant={msg.role === 'user' ? 'sent' : 'received'}>
                    {msg.content}
                  </ChatBubbleMessage>
                </ChatBubble>
              ))
            )}
            {loading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar variant="received" />
                <ChatBubbleMessage variant="received" isLoading />
              </ChatBubble>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Область ввода */}
          <div className="border-t p-3 sm:p-4 flex-shrink-0">
            <div className="relative rounded-lg border bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Введите сообщение..."
                className="min-h-[60px] sm:min-h-[80px] w-full resize-none rounded-lg border-0 bg-transparent p-2 sm:p-3 text-sm shadow-none focus:outline-none focus:ring-0"
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t p-2 gap-2">
                <div className="flex-1 order-2 sm:order-1">
                  <FileUploadArea
                    files={files}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={loading || (!input && files.length === 0)}
                  className="order-1 sm:order-2 sm:ml-auto flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 sm:px-4 text-white transition-colors hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  <span className="hidden sm:inline">Отправить</span>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
