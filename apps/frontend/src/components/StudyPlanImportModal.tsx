import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAvailableData } from '../hooks/useStudyPlans';
import { studyPlanService, ImportJobProgress, subscribeStudyPlanImportProgress } from '../services/studyPlanService';
import { useAuth } from '../hooks/useAuth';

interface StudyPlanImportModalProps {
  onClose: () => void;
  onImported: (data: { studyPlanId: number; curriculumPlanId: number; totalLessons: number }) => void;
}

interface Step {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

const INITIAL_STEPS: Step[] = [
  { key: 'upload', label: 'Загрузка файла', status: 'pending' },
  { key: 'extract', label: 'Извлечение текста', status: 'pending' },
  { key: 'ai', label: 'AI парсинг', status: 'pending' },
  { key: 'plan', label: 'Создание учебного плана', status: 'pending' },
  { key: 'lessons', label: 'Создание уроков', status: 'pending' },
  { key: 'curriculum', label: 'Создание КТП', status: 'pending' },
  { key: 'finish', label: 'Завершение', status: 'pending' }
];

const StudyPlanImportModal: React.FC<StudyPlanImportModalProps> = ({ onClose, onImported }) => {
  const { teachers, groups, loading: loadingMeta } = useAvailableData();
  const { user, hasRole } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [teacherId, setTeacherId] = useState<number | undefined>(hasRole('TEACHER') ? user?.id : undefined);
  const [groupIds, setGroupIds] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'upload' | 'processing' | 'done' | 'error'>('idle');

  const [jobId, setJobId] = useState<string | null>(null);
  const sseUnsubRef = useRef<null | (() => void)>(null);
  const showProgress = jobId !== null || submitting;
  const [resultData, setResultData] = useState<{ studyPlanId: number; curriculumPlanId: number; totalLessons: number } | null>(null);
  const totalSteps = INITIAL_STEPS.length;
  const doneExceptFinish = steps.filter(s => s.key !== 'finish' && s.status === 'done').length;
  const barPercent = phase === 'upload'
    ? uploadPercent
    : phase === 'done'
      ? 100
      : Math.min(99, Math.max(5, Math.round((doneExceptFinish / (totalSteps - 1)) * 100)));

  const toggleGroup = (id: number) => {
    setGroupIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const validate = (): boolean => {
    if (!file) {
      setError('Выберите файл');
      return false;
    }
    if (!teacherId) {
      setError('Выберите преподавателя');
      return false;
    }
    if (groupIds.length === 0) {
      setError('Выберите хотя бы одну группу');
      return false;
    }
    setError(null);
    return true;
  };

  const syncStepsFromServer = (serverSteps: ImportJobProgress['steps']) => {
    setSteps(() => {
      const order = INITIAL_STEPS.map(s => s.key);
      const map = new Map(serverSteps.map(s => [s.key, s]));
      return order.map(k => {
        const server = map.get(k);
        return {
          key: k,
          label: INITIAL_STEPS.find(i => i.key === k)!.label,
          status: (server?.status as Step['status']) || 'pending'
        };
      });
    });
  };

  const stopSse = () => {
    if (sseUnsubRef.current) {
      try {
        sseUnsubRef.current();
      } catch {
        // ignore
      }
      sseUnsubRef.current = null;
    }
  };

  const startSse = (jid: string) => {
    stopSse();
    sseUnsubRef.current = subscribeStudyPlanImportProgress(jid, {
      onProgress: (prog) => {
        syncStepsFromServer(prog.steps);
        if (prog.error) {
          setPhase('error');
          setError(prog.error);
          stopSse();
          return;
        }
        if (prog.finished) {
          setPhase('done');
          stopSse();
          if (prog.result) {
            setResultData(prog.result);
          }
        } else {
          setPhase('processing');
        }
      },
      onError: (err) => {
        if (phase !== 'done' && phase !== 'error') {
          setPhase('error');
          setError(err?.message || 'Ошибка SSE соединения');
        }
        stopSse();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError(null);
    setSteps(INITIAL_STEPS);
    setUploadPercent(0);
    setPhase('upload');
    setJobId(null);
    setResultData(null);
    stopSse();
    try {
      setSubmitting(true);
      setSteps(prev => prev.map(s => s.key === 'upload' ? { ...s, status: 'active' } : s));
      const resp = await studyPlanService.importFromFileAsync({
        file: file!,
        teacherId: teacherId!,
        groupIds,
        name: name || undefined,
        description: description || undefined
      }, {
        onUploadProgress: (p) => setUploadPercent(p)
      });
      setJobId(resp.jobId);
      setSteps(prev => prev.map(s => s.key === 'upload' ? { ...s, status: 'done' } : s));
      setPhase('processing');
      // Стартуем SSE подписку сразу (первое событие уже содержит текущий статус)
      startSse(resp.jobId);
    } catch (err: any) {
      setPhase('error');
      setError(err?.message || 'Ошибка запуска импорта');
      setSteps(prev => prev.map(s => s.key === 'upload' && s.status === 'active'
        ? { ...s, status: 'error' }
        : s));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSse();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Импорт учебного плана и КТП (SSE)</h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingMeta && (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Загрузка данных...</span>
          </div>
        )}

        {!loadingMeta && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Файл КТП (docx / pdf) *
              </label>
              <div
                className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${
                  file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
                onClick={() => document.getElementById('ktpFileInput')?.click()}
              >
                <input
                  id="ktpFileInput"
                  type="file"
                  accept=".docx,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                  disabled={submitting}
                />
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-700">
                    {file ? file.name : 'Нажмите или перетащите файл сюда'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">.docx или .pdf, до 10MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название (опционально)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Если не указано возьмём из файла"
                  disabled={submitting}
                  maxLength={255}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Преподаватель *</label>
                <select
                  value={teacherId || ''}
                  onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                  required
                >
                  <option value="">Выберите</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.surname}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Описание (опционально)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Краткое описание"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Группы *</label>
              <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                {groups.length === 0 ? (
                  <div className="text-sm text-gray-500">Групп нет</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groups.map(g => (
                      <label key={g.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={groupIds.includes(g.id)}
                          onChange={() => toggleGroup(g.id)}
                          disabled={submitting}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{g.name}{g.courseNumber !== undefined && ` (${g.courseNumber} курс)`}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {groupIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">Выбрано: {groupIds.length}</p>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm border border-red-300 bg-red-50 px-3 py-2 rounded">{error}</div>
            )}

            {showProgress && (
              <div className="space-y-4">
                <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                  <div
                    className={`h-3 transition-all duration-300 ${
                      phase === 'error'
                        ? 'bg-red-500'
                        : phase === 'done'
                          ? 'bg-green-500'
                          : 'bg-purple-600'
                    }`}
                    style={{
                      width: `${barPercent}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500">{barPercent}%</div>
                <ul className="space-y-2 text-sm">
                  {steps.map(step => (
                    <li key={step.key} className="flex items-center gap-2">
                      {step.status === 'done' && <Check className="w-4 h-4 text-green-600" />}
                      {step.status === 'active' && <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />}
                      {step.status === 'pending' && <span className="w-4 h-4 border border-gray-300 rounded-full" />}
                      {step.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                      <span
                        className={`truncate ${
                          step.status === 'error'
                            ? 'text-red-600'
                            : step.status === 'active'
                              ? 'text-purple-700 font-medium'
                              : step.status === 'done'
                                ? 'text-green-700'
                                : 'text-gray-500'
                        }`}
                      >
                        {step.label}{step.key === 'upload' && phase === 'upload' ? ` — ${uploadPercent}%` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                {jobId && (
                  <p className="text-xs text-gray-400">Job ID: {jobId}</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Отмена
              </button>
              {!submitting && phase !== 'done' && (
                <button
                  type="submit"
                  disabled={(submitting || (jobId && phase !== 'error')) || !file || !teacherId || groupIds.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Импортировать
                </button>
              )}
              {!submitting && phase === 'done' && resultData && (
                <button
                  type="button"
                  onClick={() => onImported(resultData)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                  Открыть план
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudyPlanImportModal;
