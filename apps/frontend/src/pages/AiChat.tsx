import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { Send, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { aiChatService, AiTutor, AiChatMessage, AiChatThread, CreateTutorInput, UpdateTutorInput } from '../services/aiChatService';
import fileService from '../services/fileService';

const AiChat: React.FC = () => {
  // RBAC
  const { user, hasRole } = useAuth();
  const isTeacherOrAdmin = !!user && (hasRole('ADMIN') || hasRole('TEACHER'));

  // Realtime (audio/text) hook
  const {
    messages: rtMessages,
    connectionState,
    connect,
    disconnect,
    updateSession,
    sendMessageEvent,
    sendEvent,
  } = useRealtimeChat();

  // Persisted text chat state
  const [tutors, setTutors] = useState<AiTutor[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [thread, setThread] = useState<AiChatThread | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [realtimeStartedAt, setRealtimeStartedAt] = useState<number | null>(null);
  const [realtimeSeeded, setRealtimeSeeded] = useState(false);

  // Tutor editor state (ADMIN/TEACHER)
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState<CreateTutorInput>({ subject: '', name: '', avatarUrl: '', extraInstructions: '', isPublic: true });
  const [createFiles, setCreateFiles] = useState<FileList | null>(null);
  const [editingTutorId, setEditingTutorId] = useState<number | null>(null);
  const [editData, setEditData] = useState<UpdateTutorInput>({});
  const [showTutors, setShowTutors] = useState(false);

  // View mode state

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const skipAutoScrollOnceRef = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;
  // Track mirrored realtime assistant messages in main chat
  const processedRtIdsRef = useRef<Set<string>>(new Set());
  const rtIdToLocalRef = useRef<Map<string, number>>(new Map());

  // Load tutors for any authenticated user
  const loadTutors = useCallback(async () => {
    try {
      setLoadingTutors(true);
      const list = await aiChatService.listTutors();
      setTutors(list);
      // Auto-select first if none selected
      if (!selectedTutorId && list.length > 0) {
        selectTutor(list[0].id);
      }
    } finally {
      setLoadingTutors(false);
    }
  }, [selectedTutorId]);

  useEffect(() => {
    loadTutors();
  }, [loadTutors]);

  // Select tutor => upsert per-user thread and fetch messages
  const selectTutor = useCallback(async (tutorId: number) => {
    setSelectedTutorId(tutorId);
    try {
      const th = await aiChatService.upsertThread(tutorId);
      setThread(th);
      await fetchMessages(th.id);
    } catch (_) {
      // handled by apiClient toasts
    }
  }, []);

  const fetchMessages = useCallback(async (threadId: number) => {
    try {
      setLoadingMessages(true);
      setHasMore(true);
      const msgs = await aiChatService.listMessages(threadId, PAGE_SIZE);
      setMessages(msgs);
      setHasMore(msgs.length >= PAGE_SIZE);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Infinite scroll: load older on near top
  const handleScrollLoadMore = useCallback(async () => {
    const el = messagesContainerRef.current;
    if (!el || loadingMore || !hasMore || !thread) return;
    if (el.scrollTop > 80) return;

    const oldestPersistedId = messages.reduce<number | null>((acc, m) => {
      if (m.id > 0) {
        return acc === null ? m.id : Math.min(acc, m.id);
      }
      return acc;
    }, null);
    if (!oldestPersistedId) return;

    setLoadingMore(true);
    const prevHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;
    try {
      const older = await aiChatService.listMessages(thread.id, PAGE_SIZE, oldestPersistedId);
      if (older.length === 0) {
        setHasMore(false);
      } else {
        skipAutoScrollOnceRef.current = true;
        setMessages(prev => {
          const existingIds = new Set(prev.map(p => p.id));
            const onlyNew = older.filter(o => !existingIds.has(o.id));
            return [...onlyNew, ...prev];
        });
        requestAnimationFrame(() => {
          const newHeight = el.scrollHeight;
          const delta = newHeight - prevHeight;
          el.scrollTop = prevScrollTop + delta;
        });
        setHasMore(older.length >= PAGE_SIZE);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [messages, loadingMore, hasMore, thread]);

  // Auto-fill with older messages until container overflows
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || loadingMessages || loadingMore || !hasMore) return;
    if (el.scrollHeight <= el.clientHeight + 8) {
      // Load more to fill viewport; preserves scroll via handleScrollLoadMore
      handleScrollLoadMore();
    }
  }, [messages, loadingMessages, loadingMore, hasMore, handleScrollLoadMore]);

  // Persisted chat: send message
  const handleSendPersisted = useCallback(async () => {
    if (!textInput.trim() || sending) return;
    const content = textInput.trim();
    setTextInput('');

    // If Realtime is active, forward to Realtime and don't hit backend (avoid double replies)
    if (connectionState.status === 'connected') {
      const optimistic: AiChatMessage = {
        id: -Date.now(),
        threadId: thread?.id ?? 0,
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimistic]);
      try {
        sendMessageEvent?.('user', content);
        sendEvent?.({
          type: 'response.create',
          response: { modalities: ['text', 'audio'] }
        });
      } catch {
        // ignore
      }
      return;
    }

    // Otherwise use persisted flow with backend
    if (!thread) return;
    setSending(true);
    try {
      const optimistic: AiChatMessage = {
        id: -Date.now(),
        threadId: thread.id,
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimistic]);

      const assistant = await aiChatService.sendMessage(thread.id, content);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== optimistic.id);
        return [...filtered, { ...optimistic, id: optimistic.id - 1 }, assistant];
      });
    } catch {
      if (thread) await fetchMessages(thread.id);
    } finally {
      setSending(false);
    }
  }, [connectionState.status, thread, textInput, sending, fetchMessages, sendMessageEvent, sendEvent]);

  // Enter to send
  const handleTextKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPersisted();
    }
  };

  // Auto-scroll for persisted chat
  useEffect(() => {
    if (skipAutoScrollOnceRef.current) {
      skipAutoScrollOnceRef.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime: apply tutor prompt to session when connected or tutor changes
  useEffect(() => {
    const applyPrompt = async () => {
      if (connectionState.status !== 'connected' || !selectedTutorId) return;
      try {
        const { prompt } = await aiChatService.getTutorPrompt(selectedTutorId);
        updateSession?.({
          instructions: prompt
        });
      } catch {
        // toast already handled by apiClient
      }
    };
    applyPrompt();
  }, [connectionState.status, selectedTutorId, updateSession]);

  // Seed Realtime with existing persisted messages when connected (to keep context)
  useEffect(() => {
    if (connectionState.status !== 'connected' || realtimeSeeded || messages.length === 0) return;
    const seed = async () => {
      try {
        const sorted = [...messages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const recent = sorted.slice(Math.max(0, sorted.length - 50));
        for (const m of recent) {
          const role = m.role === 'user' || m.role === 'assistant' ? m.role : 'system';
          sendMessageEvent?.(role, m.content);
        }
      } finally {
        setRealtimeSeeded(true);
      }
    };
    seed();
  }, [connectionState.status, messages, realtimeSeeded, sendMessageEvent]);

  // Mirror Realtime assistant messages into main chat list (streaming updates)
  useEffect(() => {
    if (connectionState.status !== 'connected') {
      processedRtIdsRef.current.clear();
      rtIdToLocalRef.current.clear();
      return;
    }
    for (const m of rtMessages) {
      if (m.type !== 'assistant') continue;
      const key = m.id as string;
      const mapped = rtIdToLocalRef.current.get(key);
      if (!mapped) {
        const localId = -Date.now() - Math.floor(Math.random() * 1000);
        const assistantMsg: AiChatMessage = {
          id: localId,
          threadId: thread?.id ?? 0,
          role: 'assistant',
          content: m.content,
          createdAt: new Date().toISOString()
        };
        rtIdToLocalRef.current.set(key, localId);
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => prev.map(msg => msg.id === mapped ? { ...msg, content: m.content } : msg));
      }
    }
  }, [rtMessages, connectionState.status, thread]);

  // Toggle Realtime in-chat and add duration bubble on stop
  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}ч ${m}м ${sec}с` : (m > 0 ? `${m}м ${sec}с` : `${sec}с`);
  };

  const handleToggleRealtime = async () => {
    if (connectionState.status === 'connected') {
      disconnect();
      if (realtimeStartedAt) {
        const durMs = Date.now() - realtimeStartedAt;
        const sys: AiChatMessage = {
          id: -Date.now(),
          threadId: thread?.id ?? 0,
          role: 'system',
          content: `Realtime сессия завершена • ${formatDuration(durMs)}`,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, sys]);
      }
      setRealtimeStartedAt(null);
      setRealtimeSeeded(false);
    } else if (selectedTutorId) {
      setRealtimeStartedAt(Date.now());
      setRealtimeSeeded(false);
      connect();
    }
  };

  // ADMIN/TEACHER: create tutor
  const handleCreateTutor = async () => {
    if (!createData.subject.trim()) return;
    try {
      let fileIds: number[] = [];
      if (createFiles && createFiles.length > 0) {
        const uploaded = await fileService.uploadFiles(Array.from(createFiles), 'ai-tutor-knowledge');
        fileIds = uploaded.map(f => f.id);
      }

      const res = await aiChatService.createTutor({
        subject: createData.subject.trim(),
        name: createData.name || undefined,
        avatarUrl: createData.avatarUrl || undefined,
        extraInstructions: createData.extraInstructions || undefined,
        isPublic: createData.isPublic ?? true,
        fileIds: fileIds.length ? fileIds : undefined,
      });

      setShowCreate(false);
      setCreateData({ subject: '', name: '', avatarUrl: '', extraInstructions: '', isPublic: true });
      setCreateFiles(null);
      await loadTutors();
      await selectTutor(res.tutor.id);
    } catch {
      // handled globally
    }
  };

  // ADMIN/TEACHER: start edit
  const startEdit = (t: AiTutor) => {
    setEditingTutorId(t.id);
    setEditData({
      subject: t.subject,
      name: t.name ?? '',
      avatarUrl: t.avatarUrl ?? '',
      extraInstructions: t.extraInstructions ?? '',
      isPublic: t.isPublic
    });
  };

  const cancelEdit = () => {
    setEditingTutorId(null);
    setEditData({});
  };

  // ADMIN/TEACHER: save edit
  const saveEdit = async () => {
    if (!editingTutorId) return;
    try {
      await aiChatService.updateTutor(editingTutorId, editData);
      setEditingTutorId(null);
      await loadTutors();
    } catch {
      // handled globally
    }
  };

  // ADMIN/TEACHER: delete
  const deleteTutor = async (id: number) => {
    try {
      await aiChatService.deleteTutor(id);
      if (selectedTutorId === id) {
        setSelectedTutorId(null);
        setThread(null);
        setMessages([]);
      }
      await loadTutors();
    } catch {
      // handled
    }
  };

  // ADMIN/TEACHER: ingest files
  const ingestFiles = async (tutorId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const uploaded = await fileService.uploadFiles(Array.from(files), 'ai-tutor-knowledge');
      const tutor = await aiChatService.ingestTutorFiles(tutorId, uploaded.map(f => f.id));
      // refresh tutors list to show file links if needed
      await loadTutors();
      // If current tutor updated, re-apply prompt on realtime
      if (selectedTutorId === tutorId && connectionState.status === 'connected') {
        const { prompt } = await aiChatService.getTutorPrompt(tutorId);
        updateSession?.({ instructions: prompt });
      }
    } catch {
      // handled
    }
  };

  // UI helpers
  const connectionDot = connectionState.status === 'connected' ? 'bg-green-500' :
                        connectionState.status === 'connecting' ? 'bg-yellow-500' :
                        connectionState.status === 'error' ? 'bg-red-500' : 'bg-gray-400';

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Tutors</h1>
          <p className="text-sm text-gray-500">Один чат: текст и Realtime. Переключение — в шапке чата.</p>
        </div>
      </div>

      {/* Content: left tutors, center persisted chat, right realtime feed */}
      <div className="flex-1 min-h-0 relative flex">
        {showTutors && (
          <div className="absolute inset-y-0 left-0 w-72 bg-white border-r shadow-lg z-30 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Тьюторы</h2>
            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowCreate(v => !v)}
                className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {showCreate ? 'Отмена' : 'Новый'}
              </button>
            )}
          </div>

          {isTeacherOrAdmin && showCreate && (
            <div className="p-4 border-b space-y-2">
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="Предмет (обязательно)"
                value={createData.subject}
                onChange={e => setCreateData(d => ({ ...d, subject: e.target.value }))}
              />
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="Имя (необязательно)"
                value={createData.name}
                onChange={e => setCreateData(d => ({ ...d, name: e.target.value }))}
              />
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="Аватар URL (необязательно)"
                value={createData.avatarUrl}
                onChange={e => setCreateData(d => ({ ...d, avatarUrl: e.target.value }))}
              />
              <textarea
                className="w-full border rounded-md px-3 py-2"
                placeholder="Доп. инструкции (необязательно)"
                rows={3}
                value={createData.extraInstructions}
                onChange={e => setCreateData(d => ({ ...d, extraInstructions: e.target.value }))}
              />
              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Документы знаний (pdf, docx, txt и др.)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xml"
                  className="w-full text-sm"
                  onChange={(e) => setCreateFiles(e.target.files)}
                />
                {createFiles && createFiles.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {Array.from(createFiles).slice(0, 3).map(f => f.name).join(', ')}
                    {createFiles.length > 3 ? ` +${createFiles.length - 3}` : ''}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!createData.isPublic}
                  onChange={e => setCreateData(d => ({ ...d, isPublic: e.target.checked }))}
                />
                Видно всем аутентифицированным
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTutor}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Создать
                </button>
                <button
                  onClick={() => { setShowCreate(false); setCreateData({ subject: '', name: '', avatarUrl: '', extraInstructions: '', isPublic: true }); }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {loadingTutors ? (
              <div className="p-4 text-sm text-gray-500">Загрузка...</div>
            ) : tutors.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Нет тьюторов</div>
            ) : (
              <ul className="divide-y">
                {tutors.map((t) => (
                  <li
                    key={t.id}
                    className={`group ${selectedTutorId === t.id ? 'bg-blue-50' : 'bg-white'} p-3 transition-colors`}
                  >
                    {editingTutorId === t.id ? (
                      <div className="space-y-2">
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={editData.subject ?? ''}
                          onChange={e => setEditData(d => ({ ...d, subject: e.target.value }))}
                          placeholder="Предмет"
                        />
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={editData.name ?? ''}
                          onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                          placeholder="Имя"
                        />
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={editData.avatarUrl ?? ''}
                          onChange={e => setEditData(d => ({ ...d, avatarUrl: e.target.value }))}
                          placeholder="Аватар URL"
                        />
                        <textarea
                          className="w-full border rounded-md px-3 py-2"
                          rows={3}
                          value={editData.extraInstructions ?? ''}
                          onChange={e => setEditData(d => ({ ...d, extraInstructions: e.target.value }))}
                          placeholder="Доп. инструкции"
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={!!editData.isPublic}
                            onChange={e => setEditData(d => ({ ...d, isPublic: e.target.checked }))}
                          />
                          Видно всем аутентифицированным
                        </label>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">Сохранить</button>
                          <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        {t.avatarUrl ? (
                          <img
                            src={t.avatarUrl}
                            alt={t.name || t.subject}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                            {t.subject.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start gap-2">
                            <button
                              onClick={() => selectTutor(t.id)}
                              className="text-left flex-1 min-w-[140px]"
                            >
                              <div className="font-medium text-gray-900 truncate">
                                {t.name || t.subject}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t.subject}{t.isPublic ? ' • Публичный' : ''}
                              </div>
                            </button>
                            {isTeacherOrAdmin && (
                              <div className="flex items-center gap-2 shrink-0">
                                <label className="text-xs text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
                                  + Файлы
                                  <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xml"
                                    onChange={(e) => ingestFiles(t.id, e.target.files)}
                                  />
                                </label>
                                <button
                                  onClick={() => startEdit(t)}
                                  className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                  Изм.
                                </button>
                                <button
                                  onClick={() => deleteTutor(t.id)}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Удалить
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>
        )}

        {/* Persisted text chat */}
        <main className="flex-1 min-h-0 flex flex-col">
          <div className="px-4 sm:px-6 lg:px-8 py-3 border-b bg-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {tutors.find(t => t.id === selectedTutorId)?.name || tutors.find(t => t.id === selectedTutorId)?.subject || 'Чат'}
                </h2>
                <p className="text-xs text-gray-500">Переписка сохраняется и используется для контекста</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowTutors(v => !v)} className="px-2 py-1.5 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 hidden sm:inline-block">{showTutors ? 'Скрыть тьюторов' : 'Тьюторы'}</button>
                <span className={`w-2.5 h-2.5 rounded-full ${connectionDot}`} />
                <button
                  onClick={handleToggleRealtime}
                  disabled={!selectedTutorId || connectionState.status === 'connecting'}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-md text-white disabled:opacity-50 transition-colors ${connectionState.status === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {connectionState.status === 'connected' ? 'Выключить Realtime' : 'Включить Realtime'}
                </button>
              </div>
            </div>
          </div>

          <div ref={messagesContainerRef} onScroll={handleScrollLoadMore} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 bg-gray-50">
            {!loadingMessages && messages.length > 0 && (
              <>
                {loadingMore && <div className="text-xs text-gray-400 text-center">Загрузка...</div>}
                {!hasMore && <div className="text-[11px] text-gray-400 text-center">Начало истории</div>}
              </>
            )}
            {loadingMessages ? (
              <div className="text-sm text-gray-500">Загрузка сообщений...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-14">
                <div className="text-6xl mb-4">💬</div>
                <div className="font-medium">Начните диалог с выбранным тьютором</div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-sm lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                    m.role === 'user' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}>
                    <div className="flex items-start gap-3">
                      {m.role !== 'user' && <Volume2 size={16} className="mt-1 text-gray-400" />}
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base break-words leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-[10px] mt-2 ${m.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                          {(() => { const d = new Date(m.createdAt as any); return isNaN(d.getTime()) ? '' : format(d, 'HH:mm', { locale: ru }); })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleTextKey}
                placeholder={thread ? 'Введите сообщение...' : 'Выберите тьютора'}
                disabled={!thread || sending}
                rows={1}
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                style={{ minHeight: '48px' }}
              />
              <button
                onClick={handleSendPersisted}
                disabled={!thread || !textInput.trim() || sending}
                className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[48px]"
                title="Отправить"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">Enter — отправить</div>
          </div>
        </main>

      </div>
    </div>
  );
};

export default AiChat;
