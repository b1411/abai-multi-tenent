import React, { useState, useRef, useCallback, useEffect } from 'react';
import { neuroAbaiService } from '../services/neuroAbaiService';
import AISuggestionModal from '../components/AISuggestionModal';
import { Paperclip, Send, X, FileText, Bot, User, ChevronDown } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { toast } from 'react-toastify';
import fileService, { UploadedFile } from '../services/fileService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: UploadedFile[];
}

interface FileUploadAreaProps {
  files: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  disabled: boolean;
}

function MessageLoading() {
  return (
    <svg width="28" height="18" viewBox="0 0 40 12" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
      <circle cx="6" cy="6" r="4" fill="currentColor">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="6" r="4" fill="currentColor" className="opacity-60">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="34" cy="6" r="4" fill="currentColor" className="opacity-40">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ChatBubble({ variant = 'received', children }: { variant?: 'sent' | 'received'; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-3 mb-2 ${variant === 'sent' ? 'flex-row-reverse' : ''}`}>
      {children}
    </div>
  );
}

function ChatAvatar({ variant = 'received' }: { variant?: 'sent' | 'received' }) {
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
      variant === 'sent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-blue-600'
    }`}>
      {variant === 'sent' ? <User size={16} /> : <Bot size={16} />}
    </div>
  );
}

function ChatMessage({ variant = 'received', isLoading, children, html }:
  { variant?: 'sent' | 'received'; isLoading?: boolean; children?: React.ReactNode; html?: string | null }) {
  const bubbleClasses = variant === 'sent' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-900';
  const htmlClasses = variant === 'sent'
    ? 'break-words prose prose-invert prose-sm leading-snug prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1 prose-headings:my-1 prose-blockquote:my-1 prose-hr:my-1 prose-table:my-1 prose-img:my-1 prose-pre:my-1 text-white'
    : 'break-words prose prose-sm leading-snug prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1 prose-headings:my-1 prose-blockquote:my-1 prose-hr:my-1 prose-table:my-1 prose-img:my-1 prose-pre:my-1 text-gray-900';

  return (
    <div className={`rounded-lg p-3 text-sm max-w-[95%] ${bubbleClasses}`}>
      {isLoading ? (
        <MessageLoading />
      ) : html ? (
        // render sanitized HTML inside same bubble wrapper; use prose-invert for dark bubble
        <div className={htmlClasses} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="whitespace-pre-wrap break-words">{children}</div>
      )}
    </div>
  );
}

function FileUploadArea({ files, onFileChange, onRemoveFile, disabled }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileChange(fakeEvent);
    }
  }, [disabled, onFileChange]);

  return (
    <div>
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFileChange} disabled={disabled} />
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDrag} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
        className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-200 bg-white'}`}
      >
        <div className="rounded-md bg-white p-2 shadow-sm"><Paperclip className="text-gray-500" /></div>
        <div className="text-xs">
          <div className="font-medium">Загрузить файл</div>
          <div className="text-gray-400">или перетащите сюда</div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-2 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded px-3 py-2 bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-gray-400" />
                <span className="truncate text-sm">{f.name}</span>
              </div>
              <button onClick={() => onRemoveFile(i)} disabled={disabled} className="p-1 rounded hover:bg-gray-100">
                <X size={14} />
              </button>
            </div>
          ))}
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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [curriculumPlanId, setCurriculumPlanId] = useState<string>('');
  const [suggestionsMap, setSuggestionsMap] = useState<Record<number, any[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ENABLE_ACTIONS = true;

  // ----- Chat history persistence (per scenario + curriculumPlanId) -----
  const storagePrefix = 'neuroAbai:chat';
  const getStorageKey = (scen: string, cpId: string) =>
    `${storagePrefix}:${encodeURIComponent(scen)}:${cpId || 'none'}`;

  // Load history when scenario or curriculumPlanId changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(scenario, curriculumPlanId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } else {
        // No history for this key — start fresh
        setMessages([]);
      }
    } catch {
      // ignore parsing/storage errors
      void 0;
    }
  }, [scenario, curriculumPlanId]);

  // Save history whenever messages change for current key
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(scenario, curriculumPlanId), JSON.stringify(messages));
    } catch {
      // ignore storage errors
      void 0;
    }
  }, [messages, scenario, curriculumPlanId]);

  const openModal = (s: any) => { setSelectedSuggestion(s); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setSelectedSuggestion(null); };

  const handleCreateSuggestion = async () => {
    if (!curriculumPlanId) { alert('Укажите curriculumPlanId'); return; }
    try {
      setLoading(true);
      const created = await neuroAbaiService.createSuggestion({ curriculumPlanId: Number(curriculumPlanId), message: input, files });
      const full = await neuroAbaiService.getSuggestion(created.id);
      openModal(full);
      setFiles([]); setInput('');
    } catch (e) {
      console.error(e); alert('Ошибка создания предложения');
    } finally { setLoading(false); }
  };

  const handleApplySuggestion = async () => {
    if (!selectedSuggestion) return;
    try {
      setApplying(true);
      await neuroAbaiService.applySuggestion(selectedSuggestion.id);
      const refreshed = await neuroAbaiService.getSuggestion(selectedSuggestion.id);
      setSelectedSuggestion(refreshed);
    } catch (e) {
      console.error(e); alert('Ошибка при применении');
    } finally {
      setApplying(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    if (!overrideText && !input && files.length === 0) return;
    const text = (overrideText ?? input) || 'Файл отправлен без сообщения';
    const filesToSend = files;

    // prepare conversation history to send to backend (includes prior messages + this user message)
    const convo: Message[] = [
      ...messages,
      { role: 'user', content: text }
    ];

    // optimistically add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setInput('');

    try {
      // send full conversation + files
      const res = await neuroAbaiService.sendMessage({ messages: convo, scenario, files: filesToSend });

      // append assistant message (with files) and capture its index
      setMessages(prev => {
        const reply = res?.message ?? 'Нет ответа';
        const attached = Array.isArray(res?.files) ? res.files : [];
        const newMessages = [...prev, ({ role: 'assistant', content: reply, attachments: attached } as Message)];
        const idx = newMessages.length - 1;

        // asynchronously request structured message suggestions using the same convo and files
        if (ENABLE_ACTIONS) {
          (async () => {
            try {
              const ga = await neuroAbaiService.generateActions({ messages: convo, context: { scenario }, files: filesToSend });
              if (ga?.suggestions && Array.isArray(ga.suggestions) && ga.suggestions.length > 0) {
                setSuggestionsMap(prevMap => ({ ...prevMap, [idx]: ga.suggestions }));
              } else if (ga?.raw) {
                const parsed = parseSuggestionsFromContent(ga.raw);
                if (parsed.length > 0) setSuggestionsMap(prevMap => ({ ...prevMap, [idx]: parsed }));
              }
            } catch (err) {
              console.warn('generateActions failed', err);
            }
          })();
        }

        return newMessages;
      });

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка при отправке' }]);
    } finally {
      setLoading(false);
    }
  };

  // parse structured action proposals from assistant message content
  const parseSuggestionsFromContent = (content: string) => {
    try {
      const jsonBlock = content.match(/```json([\s\S]*?)```/);
      const payload = jsonBlock ? jsonBlock[1] : null;
      const raw = payload ? payload : (content.match(/(\{[\s\S]*\})/)?.[1] ?? null);
      if (!raw) return [];
      const parsed = JSON.parse(raw.trim());
      // Если модель вернула объект { suggestions: [...] } — вернуть suggestions
      if (parsed?.suggestions && Array.isArray(parsed.suggestions)) return parsed.suggestions;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.warn('parseSuggestionsFromContent error', e);
    }
    return [];
  };

  // Remove inline JSON action payloads from assistant message content to keep actions as separate UI items
  const stripActionJsonFromContent = (content: string) => {
    if (!content) return content;
    let out = content;

    // Remove fenced JSON blocks
    out = out.replace(/```json[\s\S]*?```/gi, '');

    // Try remove a top-level JSON/array that looks like actions
    const jsonMatch = out.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        const obj = JSON.parse(jsonMatch[1]);
        const looksLikeActions =
          (Array.isArray(obj) &&
            obj.every(
              (x: any) =>
                x && typeof x === 'object' && (x.actionId || x.type || x.label || x.name || (x.args || x.argsPreview))
            )) ||
          (obj && typeof obj === 'object' && (obj.actions || obj.actionId || obj.type));
        if (looksLikeActions) {
          out = out.replace(jsonMatch[1], '');
        }
      } catch {
        // not JSON — ignore
        void 0;
      }
    }

    return out.trim();
  };

  const [currentAction, setCurrentAction] = useState<any>(null);
  const [currentActionMessageIndex, setCurrentActionMessageIndex] = useState<number | null>(null);
  const [actionPreviewLoading, setActionPreviewLoading] = useState(false);
  const [actionExecLoading, setActionExecLoading] = useState(false);
  const [actionPreviewResult, setActionPreviewResult] = useState<any>(null);
  const [actionPreviewIsResult, setActionPreviewIsResult] = useState(false);
  const [actionResultsMap, setActionResultsMap] = useState<Record<string, string>>({});

  const handleActionClick = (action: any, idx: number) => {
    setCurrentAction(action);
    setCurrentActionMessageIndex(idx);
    setActionPreviewResult(null);
  };

  const MAX_PREVIEW_LENGTH = 300;

  const extractPlainMessageFromResponse = (res: any) => {
    if (!res) return '';

    // Axios error shape (from apiClient/axios)
    try {
      if (res?.response) {
        const d = res.response.data;
        if (typeof d === 'string' && d.trim()) return d;
        if (d?.message) return Array.isArray(d.message) ? d.message.join('\n') : String(d.message);
        if (d?.error) return String(d.error);
        if (d?.errors && typeof d.errors === 'object') {
          const parts = Object.values(d.errors as Record<string, unknown>).flat().map((v) => String(v));
          const joined = parts.join('\n').trim();
          if (joined) return joined;
        }
        return res.response.statusText || 'Ошибка';
      }
    } catch {
      // ignore parsing
      void 0;
    }

    // string
    if (typeof res === 'string') {
      // keep string as-is
    } else if (res.preview) {
      const p = res.preview;
      if (p.chatReply && typeof p.chatReply === 'object' && p.chatReply.message) return String(p.chatReply.message);
      if (p.chatReply && typeof p.chatReply === 'string') return String(p.chatReply);
      if (p.message) return String(p.message);
      if (p.chatReply) return typeof p.chatReply === 'string' ? p.chatReply : JSON.stringify(p.chatReply);
      if (p.tool && p.tool.description) return `${p.tool.name ?? 'Tool'}: ${p.tool.description}`;
    } else if (res.chatReply && res.chatReply.message) {
      return String(res.chatReply.message);
    } else if (res.message) {
      return String(res.message);
    } else if (typeof res === 'object') {
      try { res = JSON.stringify(res); } catch { res = String(res); }
    } else {
      res = String(res);
    }

    // At this point res might be a stringified object or original string
    let text = String(res);
    // remove fenced code blocks and inline backticks
    text = text.replace(/```[\s\S]*?```/g, '').replace(/`+/g, '');
    // collapse whitespace and newlines into spaces
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length > MAX_PREVIEW_LENGTH) text = text.slice(0, MAX_PREVIEW_LENGTH).trim() + '...';
    return text;
  };

  // Map loosely-typed LLM actions to a concrete tool id from registry
  const resolveActionId = (a: any): string | null => {
    if (a?.actionId) return String(a.actionId);
    if (a?.id) return String(a.id);
    const t = String(a?.type || '').trim();
    if (t === 'createLesson' || t === 'scheduleLesson' || t === 'summarizeKTP') return t;
    if (t === 'suggestLesson' || t === 'suggestLessonCreation') return 'suggestLessonCreation';
    // 'agentTool' without explicit id is unusable
    return null;
  };

  // Coerce common numeric args coming as strings (e.g. "*Id")
  const coerceArgs = (args: any) => {
    if (!args || typeof args !== 'object') return {};
    const out: any = Array.isArray(args) ? [...args] : { ...args };
    Object.keys(out).forEach((k) => {
      const v = out[k];
      if (v == null) return;
      if (typeof v === 'string' && /^[+-]?\d+(\.\d+)?$/.test(v) && (k.toLowerCase().endsWith('id') || k.toLowerCase().includes('minutes'))) {
        const num = Number(v);
        if (!Number.isNaN(num)) out[k] = num;
      }
    });
    return out;
  };

  const actionKey = (a: any, idx: number) => `${idx}:${resolveActionId(a) || a.id || a.label || a.name || 'idx' + idx}`;

  const handleActionPreview = async (action: any) => {
    setActionPreviewIsResult(false);
    // For chatReply show local preview without backend
    const actionId = resolveActionId(action);
    if (action.type === 'chatReply' || (!actionId && action.message)) {
      setActionPreviewResult({ message: extractPlainMessageFromResponse(action.message ?? action.argsPreview?.message ?? '') });
      return;
    }
    if (!actionId) {
      setActionPreviewResult({ message: 'Инструмент не распознан. Невозможно выполнить предпросмотр.' });
      return;
    }
    setActionPreviewLoading(true);
    try {
      const args = coerceArgs(action.argsPreview || action.args || {});
      const res = await neuroAbaiService.agentAction(actionId, args, true);
      setActionPreviewResult({ message: extractPlainMessageFromResponse(res) });
    } catch (e) {
      console.error(e);
      const msg = extractPlainMessageFromResponse(e) || 'Ошибка предпросмотра';
      setActionPreviewResult({ message: msg });
      try { toast.error(msg, { autoClose: 2000 }); } catch (err) { void 0; }
    } finally {
      setActionPreviewLoading(false);
    }
  };

  const handleActionExecute = async (action: any) => {
    setActionExecLoading(true);
    try {
      // chatReply: не отправляем как ответ ассистента — подставляем в ввод
      const actionId = resolveActionId(action);
      if (action.type === 'chatReply' || (!actionId && action.message)) {
        const msg = extractPlainMessageFromResponse(action.message ?? action.argsPreview?.message ?? '');
        setInput(msg);
        setCurrentAction(null);
        setCurrentActionMessageIndex(null);
        setActionPreviewResult(null);
        setActionPreviewIsResult(false);
        try { toast.info('Текст вставлен в поле ввода', { autoClose: 1500 }); } catch (err) { void 0; }
        return;
      }

      if (!actionId) {
        alert('Неизвестный инструмент действия');
        return;
      }

      // tool execution: показываем результат под карточкой, не как сообщение ассистента
      const args = coerceArgs(action.argsPreview || action.args || {});
      const res = await neuroAbaiService.agentAction(actionId, args, false);
      const contentToInsert = extractPlainMessageFromResponse(res) || 'Действие выполнено';
      setActionPreviewResult({ message: contentToInsert });
      setActionPreviewIsResult(true);
      const idxMsg = currentActionMessageIndex ?? -1;
      const k = actionKey(action, idxMsg);
      if (idxMsg >= 0) setActionResultsMap(prev => ({ ...prev, [k]: contentToInsert }));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      try { toast.success(contentToInsert || 'Действие выполнено', { autoClose: 2000 }); } catch (err) { void 0; }
    } catch (e) {
      console.error(e);
      const msg = extractPlainMessageFromResponse(e) || 'Ошибка выполнения';
      setActionPreviewResult({ message: msg });
      setActionPreviewIsResult(true);
      const idxMsg = currentActionMessageIndex ?? -1;
      const k = actionKey(action, idxMsg);
      if (idxMsg >= 0) setActionResultsMap(prev => ({ ...prev, [k]: msg }));
      try { toast.error(msg, { autoClose: 2000 }); } catch (err) { void 0; }
    } finally {
      setActionExecLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };
  const handleRemoveFile = (i: number) => setFiles(fs => fs.filter((_, idx) => idx !== i));

  return (
    <div className="h-screen overflow-hidden flex bg-gradient-to-b from-white to-gray-50 px-4 pb-4 pt-0">
      <div className="mx-auto w-full max-w-none h-full min-h-0 grid grid-cols-12 gap-4">
        {/* Left: chat */}
        <div className="col-span-12 md:col-span-10 lg:col-span-11 h-full flex flex-col min-h-0 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-5 py-3 border-b shrink-0 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold text-gray-800">Neuro Abai — Помощник учителя</h2>
            <p className="text-sm text-gray-500 mt-1">Общайтесь с ИИ или генерируйте предложения для КТП</p>
          </div>

          <div className="flex-1 min-h-0 p-5 overflow-y-auto space-y-2 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center text-gray-400 py-10">
                <div>
                  <Bot size={48} className="mx-auto text-blue-600 mb-3" />
                  <div className="text-sm font-medium">Начните диалог</div>
                  <div className="text-xs text-gray-400 mt-1">Напишите сообщение или загрузите файл</div>
                </div>
              </div>
            )}

            {messages.map((m, idx) => {
              const content = m.content || '';
              const suggestionsFromContent = m.role === 'assistant' ? parseSuggestionsFromContent(content) : [];
              const cleaned = m.role === 'assistant' ? stripActionJsonFromContent(content) : content;
              const rendered = m.role === 'assistant' ? DOMPurify.sanitize((marked.parse(cleaned) as string)) : null;
              const suggestions = suggestionsMap[idx] && Array.isArray(suggestionsMap[idx]) && suggestionsMap[idx].length > 0
                ? suggestionsMap[idx]
                : suggestionsFromContent;

              return (
                <ChatBubble key={idx} variant={m.role === 'user' ? 'sent' : 'received'}>
                  <ChatAvatar variant={m.role === 'user' ? 'sent' : 'received'} />
                  <div className="flex-1">
                    <ChatMessage
                      variant={m.role === 'user' ? 'sent' : 'received'}
                      html={m.role === 'assistant' ? rendered : null}
                    >
                      {m.role === 'assistant' ? null : content}
                    </ChatMessage>

                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Файлы</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {m.attachments.map((f) => (
                            <div key={f.id} className="flex items-center justify-between rounded px-3 py-2 bg-white border">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={14} className="text-gray-400" />
                                <span className="truncate text-sm">{f.originalName || f.name}</span>
                              </div>
                              <button
                                onClick={async () => {
                                  try {
                                    if (f.url && f.url.startsWith('https://')) {
                                      window.open(f.url, '_blank');
                                    } else {
                                      await fileService.downloadFile(f.id, f.originalName || f.name);
                                    }
                                  } catch (_) { /* no-op */ }
                                }}
                                className="text-xs px-2 py-1 rounded border whitespace-nowrap"
                              >
                                Скачать
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ENABLE_ACTIONS && suggestions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Предлагаемые сообщения</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {suggestions.map((s: any, i: number) => {
                          const text = s.text || s;
                          const description = s.description || `Вариант ${i + 1}`;
                          return (
                            <div key={i} className="p-3 bg-white rounded-md border flex flex-col max-w-full overflow-hidden">
                              <div className="text-sm font-medium mb-1">{description}</div>
                              <div className="text-xs text-gray-700 mb-3 break-words">{text}</div>
                              <div className="flex flex-wrap gap-2 w-full items-stretch">
                                <button
                                  onClick={() => handleSend(text)}
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                  Отправить
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </div>
                </ChatBubble>
              );
            })}

            {loading && (
              <ChatBubble variant="received">
                <ChatAvatar variant="received" />
                <ChatMessage variant="received" isLoading />
              </ChatBubble>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-3 bg-white shrink-0 sticky bottom-0 z-10">
            <div className="flex gap-3 items-start">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Введите сообщение..."
                className="flex-1 min-h-[64px] max-h-36 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
              <div className="flex flex-col gap-2 w-44">
                <button
                  onClick={() => { void handleSend(); }}
                  disabled={loading || (!input && files.length === 0)}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} /> <span className="text-sm">Отправить</span>
                </button>
                <button
                  onClick={() => { setInput(''); setFiles([]); }}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm"
                >
                  Очистить
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <FileUploadArea files={files} onFileChange={handleFileChange} onRemoveFile={handleRemoveFile} disabled={loading} />
              <div className="flex flex-col gap-2">
                <div className="text-xs text-gray-500">Сценарий</div>
                <div className="relative">
                  <select value={scenario} onChange={e => setScenario(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                    {SCENARIOS.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <AISuggestionModal open={modalOpen} onClose={closeModal} suggestion={selectedSuggestion} onApply={handleApplySuggestion} applying={applying} />
    </div>
  );
}
