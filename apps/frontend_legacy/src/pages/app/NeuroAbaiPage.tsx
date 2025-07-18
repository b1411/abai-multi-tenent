/**
 * @page NeuroAbaiPage
 * @description Страница интеллектуального помощника для учителей FIZMAT.AI
 * @author [Ваше имя]
 * @last_updated 2024-03-23
 * 
 * @features
 * 1. Анализ КТП (Календарно-тематическое планирование)
 * 2. Улучшение целей уроков
 * 3. Оптимизация учебных заданий
 * 4. Создание СОР/СОЧ
 * 5. Проверка ошибок в документах
 * 6. Загрузка и обработка файлов
 * 
 * @components
 * - MessageLoading: Анимация загрузки сообщения
 * - ChatBubble: Контейнер для сообщений
 * - ChatBubbleAvatar: Аватар отправителя
 * - ChatBubbleMessage: Содержимое сообщения
 * - FileUploadArea: Область загрузки файлов
 * 
 * @data_models
 * 
 * interface Message {
 *   role: 'user' | 'assistant';
 *   content: string;
 * }
 * 
 * const SCENARIOS = [
 *   { label: string; value: string; }
 * ]
 * 
 * @api_integration
 * - openaiResponsesApi.sendMessage:
 *   - Параметры: { message: string; scenario: string; files: File[]; }
 *   - Возвращает: Promise<string>
 * 
 * @state_management
 * - messages: История сообщений
 * - input: Текущий ввод пользователя
 * - scenario: Выбранный сценарий
 * - files: Загруженные файлы
 * - loading: Состояние загрузки
 * 
 * @events
 * - handleSend: Отправка сообщения и файлов
 * - handleFileChange: Обработка загрузки файлов
 * - handleRemoveFile: Удаление файла
 * - handleKeyDown: Обработка нажатий клавиш
 * 
 * @ui_components
 * - Сценарии выбора действий
 * - Чат с историей сообщений
 * - Область загрузки файлов
 * - Поле ввода сообщения
 * 
 * @performance
 * - Автоматическая прокрутка к последнему сообщению
 * - Оптимизированная загрузка файлов
 * - Предотвращение множественных отправок
 */

import React, { useState, useRef, useCallback, ChangeEvent, KeyboardEvent, RefObject } from 'react';
import { openaiResponsesApi } from '../../api-legacy/openai-responses';
import { Paperclip, Send, X, FileText, Bot, User, ChevronDown } from 'lucide-react';

// Интерфейсы компонентов
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatBubbleProps {
    variant?: 'sent' | 'received';
    children: React.ReactNode;
}

interface ChatBubbleAvatarProps {
    variant?: 'sent' | 'received';
}

interface ChatBubbleMessageProps {
    variant?: 'sent' | 'received';
    isLoading?: boolean;
    children?: React.ReactNode;
}

interface FileUploadAreaProps {
    files: File[];
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    disabled: boolean;
}

// Message loading animation component
function MessageLoading() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
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

function ChatBubble({ variant = "received", children }: ChatBubbleProps) {
  return (
    <div className={`flex items-start gap-3 mb-4 ${variant === "sent" ? "flex-row-reverse" : ""}`}>{children}</div>
  );
}
function ChatBubbleAvatar({ variant = "received" }: ChatBubbleAvatarProps) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${variant === "sent" ? "bg-corporate-primary text-white" : "bg-gray-200 text-corporate-primary"}`}>
      {variant === "sent" ? <User size={16} /> : <Bot size={16} />}
    </div>
  );
}
function ChatBubbleMessage({ variant = "received", isLoading, children }: ChatBubbleMessageProps) {
  return (
    <div className={`rounded-lg p-3 max-w-[80%] ${variant === "sent" ? "bg-corporate-primary text-white" : "bg-gray-100 text-gray-900"}`}>
      {isLoading ? <div className="flex items-center space-x-2"><MessageLoading /></div> : <div className="whitespace-pre-wrap">{children}</div>}
    </div>
  );
}
function FileUploadArea({ files, onFileChange, onRemoveFile, disabled }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as ChangeEvent<HTMLInputElement>;
      onFileChange(fakeEvent);
    }
  }, [onFileChange, disabled]);
  const handleClick = () => { if (!disabled && fileInputRef.current) fileInputRef.current.click(); };
  return (
    <div className="mt-4">
      <input ref={fileInputRef} type="file" multiple onChange={onFileChange} disabled={disabled} className="hidden" />
      <div onClick={handleClick} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors ${isDragging ? "border-corporate-primary/50 bg-corporate-primary/5" : "border-gray-300 bg-gray-50 hover:bg-gray-100"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}> <div className="rounded-full bg-white p-2 shadow-sm"><Paperclip className="h-5 w-5 text-gray-400" /></div><div className="text-center"><p className="text-sm font-medium">Нажмите для выбора файлов</p><p className="text-xs text-gray-400">или перетащите файлы сюда</p></div></div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium">Выбранные файлы:</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between rounded-md bg-gray-100 p-2 text-sm">
                <div className="flex items-center gap-2 truncate"><FileText size={16} className="shrink-0 text-gray-400" /><span className="truncate">{file.name}</span></div>
                <button onClick={() => onRemoveFile(index)} className="ml-2 rounded-full p-1 hover:bg-white" disabled={disabled}><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default function NeuroAbaiPage() {
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
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const handleSend = async () => {
    if (!input && files.length === 0) return;
    const userMessage = input || 'Файл отправлен без сообщения';
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setInput('');
    setTimeout(scrollToBottom, 100);
    try {
      const response = await openaiResponsesApi.sendMessage({ message: input, scenario, files });
      setMessages(prev => [...prev, { role: 'assistant', content: response || 'Нет ответа' }]);
      setFiles([]);
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка при отправке запроса.' }]);
      setTimeout(scrollToBottom, 100);
    } finally {
      setLoading(false);
    }
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) { setFiles(Array.from(e.target.files)); } };
  const handleRemoveFile = (index: number) => { setFiles(files.filter((_, i) => i !== index)); };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="overflow-hidden rounded-xl border bg-white shadow-lg">
        <div className="border-b p-4">
          <h1 className="text-center text-xl font-bold text-corporate-primary">Fizmat AI Ala</h1>
          <div className="mt-4">
            <div className="relative">
              <select value={scenario} onChange={e => setScenario(e.target.value)} className="w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:border-corporate-primary focus:outline-none focus:ring-2 focus:ring-corporate-primary/20">
                {SCENARIOS.map(s => (<option key={s.label} value={s.value}>{s.label}</option>))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="h-[400px] overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <Bot size={48} className="mb-4 text-corporate-primary" />
              <h3 className="text-lg font-medium">Начните диалог с Fizmat AI Ala</h3>
              <p className="mt-2 text-sm">Задайте вопрос или загрузите файл для анализа</p>
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
        <div className="border-t p-4">
          <div className="relative rounded-lg border bg-white focus-within:ring-2 focus-within:ring-corporate-primary/20">
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Введите сообщение..." className="min-h-[80px] w-full resize-none rounded-lg border-0 bg-transparent p-3 text-sm shadow-none focus:outline-none focus:ring-0" onKeyDown={handleKeyDown} disabled={loading} />
            <div className="flex items-center justify-between border-t p-2">
              <div className="flex-1">
                <FileUploadArea files={files} onFileChange={handleFileChange} onRemoveFile={handleRemoveFile} disabled={loading} />
              </div>
              <button onClick={handleSend} disabled={loading || (!input && files.length === 0)} className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-corporate-primary px-4 text-white transition-colors hover:bg-corporate-primary/90 disabled:opacity-50">
                Отправить
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
