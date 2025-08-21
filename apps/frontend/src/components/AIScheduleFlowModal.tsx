import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Calendar, Settings, Layers, Zap, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Loading, Alert } from './ui';
import scheduleService from '../services/scheduleService';
import {
  GenerationParams,
  DraftItem,
  DraftStats,
  OptimizedScheduleResponse,
  ValidationResult,
  ApplyResult,
  DraftResponse,
  OptimizeRequestBody,
  OptimizedLesson
} from '../types/aiScheduleFlow';
import { GroupOption } from '../types/schedule';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplied: (result: ApplyResult) => void;
}

const AIScheduleFlowModal: React.FC<Props> = ({ isOpen, onClose, onApplied }) => {
  const [step, setStep] = useState(1);
  const [params, setParams] = useState<GenerationParams>({
    startDate: '',
    endDate: '',
    groupIds: [],
    constraints: {
      workingHours: { start: '08:00', end: '18:00' },
      maxConsecutiveHours: 4,
      preferredBreaks: [12,13],
      excludeWeekends: true,
      minBreakDuration: 15
    },
    generationType: 'full'
  });
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [draft, setDraft] = useState<DraftItem[] | null>(null);
  const [draftStats, setDraftStats] = useState<DraftStats | null>(null);
  const [optimized, setOptimized] = useState<OptimizedScheduleResponse | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      const today = new Date();
      const start = new Date(today); start.setDate(start.getDate() + 7);
      const end = new Date(start); end.setDate(start.getDate() + 21);
      setParams(p => ({ ...p, startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }));
    } else {
      resetFlow();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
  const g = await scheduleService.getGroups();
  setGroups(g);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setError(msg || 'Ошибка загрузки групп');
    }
  };

  const resetFlow = () => {
    setStep(1);
    setDraft(null);
    setDraftStats(null);
    setOptimized(null);
    setValidation(null);
    setError(null);
    setApplying(false);
  };

  const runDraft = async () => {
    setLoading(true); setError(null);
    try {
  const res: DraftResponse = await scheduleService.flowDraft(params);
  setDraft(res.draft);
  setDraftStats(res.stats);
      setStep(2);
    } catch (e) { const msg = e instanceof Error ? e.message : 'Не удалось создать черновик'; setError(msg); }
    finally { setLoading(false); }
  };

  const runOptimize = async () => {
    if (!draft) return;
    setLoading(true); setError(null);
    try {
  const body: OptimizeRequestBody = { draft, params };
  const res = await scheduleService.flowOptimize(body);
  setOptimized(res as OptimizedScheduleResponse);
      setStep(3);
    } catch (e) { const msg = e instanceof Error ? e.message : 'Ошибка оптимизации'; setError(msg); }
    finally { setLoading(false); }
  };

  const runValidate = async () => {
    if (!optimized) return;
    setLoading(true); setError(null);
    try {
  const res = await scheduleService.flowValidate(optimized);
  setValidation(res as ValidationResult);
      setStep(4);
    } catch (e) { const msg = e instanceof Error ? e.message : 'Ошибка валидации'; setError(msg); }
    finally { setLoading(false); }
  };

  const runApply = async () => {
    if (!optimized) return;
    setApplying(true); setError(null);
    try {
  const raw = await scheduleService.flowApply(optimized);
      const mapped: ApplyResult = {
        success: true,
        count: raw.createdCount ?? (raw.created ? raw.created.length : 0)
      };
      onApplied(mapped);
      onClose();
    } catch (e) { const msg = e instanceof Error ? e.message : 'Ошибка применения'; setError(msg); }
    finally { setApplying(false); }
  };

  if (!isOpen) return null;

  const steps = [
    { num:1, label:'Черновик', icon:Layers },
    { num:2, label:'Оптимизация', icon:Zap },
    { num:3, label:'Валидация', icon:ShieldCheck },
    { num:4, label:'Применение', icon:CheckCircle }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} className="bg-white rounded-lg shadow-xl w-full max-w-[900px] max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="p-5 border-b flex justify-between items-start bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded"><Brain className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-semibold">AI Поток генерации расписания</h2>
              <p className="text-sm text-indigo-100">Эвристика → Оптимизация → Проверка → Сохранение</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10"><X /></button>
        </div>

        <div className="px-6 py-3 flex space-x-3 overflow-x-auto">
          {steps.map(s => {
            const Icon = s.icon;
            const active = step === s.num;
            const done = step > s.num;
            return (
              <div key={s.num} className="flex items-center space-x-2">
                <div className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition ${done? 'bg-green-500 text-white' : active? 'bg-indigo-600 text-white':'bg-gray-200 text-gray-600'}`}>
                  {done? <CheckCircle className="h-5 w-5" />: <Icon className="h-5 w-5" />}
                </div>
                <div className="hidden md:block text-xs font-medium text-gray-700">{s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          {error && (
            <Alert variant="error" className="mb-4"><AlertCircle className="h-4 w-4" />{error}</Alert>
          )}
          <AnimatePresence mode="wait">
            {step===1 && (
              <motion.div key="step1" initial={{x:20,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-20,opacity:0}} className="space-y-5">
                <h3 className="font-semibold flex items-center"><Calendar className="h-5 w-5 mr-2"/>Параметры</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Дата начала</label>
                    <input type="date" value={params.startDate} onChange={e=>setParams({...params,startDate:e.target.value})} className="w-full border px-2 py-1 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Дата окончания</label>
                    <input type="date" value={params.endDate} onChange={e=>setParams({...params,endDate:e.target.value})} className="w-full border px-2 py-1 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Начало рабочего дня</label>
                    <input type="time" value={params.constraints.workingHours.start} onChange={e=>setParams({...params,constraints:{...params.constraints,workingHours:{...params.constraints.workingHours,start:e.target.value}}})} className="w-full border px-2 py-1 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Конец рабочего дня</label>
                    <input type="time" value={params.constraints.workingHours.end} onChange={e=>setParams({...params,constraints:{...params.constraints,workingHours:{...params.constraints.workingHours,end:e.target.value}}})} className="w-full border px-2 py-1 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Макс. подряд</label>
                    <input type="number" min={1} max={8} value={params.constraints.maxConsecutiveHours} onChange={e=>setParams({...params,constraints:{...params.constraints,maxConsecutiveHours:parseInt(e.target.value)}})} className="w-full border px-2 py-1 rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Группы</label>
                    <div className="border rounded p-2 h-32 overflow-y-auto text-sm space-y-1">
                      {groups.map(g => (
                        <label key={g.id} className="flex items-center space-x-2">
                          <input type="checkbox" checked={params.groupIds.includes(g.id)} onChange={e=>{
                            setParams(p=> ({...p, groupIds: e.target.checked? [...p.groupIds, g.id]: p.groupIds.filter(id=>id!==g.id)}));
                          }} />
                          <span>{g.name}</span>
                          <span className="text-gray-400 text-xs">{g.courseNumber && `курс ${g.courseNumber}`}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button disabled={!params.startDate || !params.endDate || params.groupIds.length===0 || loading} onClick={runDraft}>Создать черновик</Button>
                </div>
                {loading && <Loading text="Формируем черновик..." />}
              </motion.div>
            )}
            {step===2 && (
              <motion.div key="step2" initial={{x:20,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-20,opacity:0}} className="space-y-4">
                <h3 className="font-semibold flex items-center"><Layers className="h-5 w-5 mr-2"/>Черновик</h3>
                <div className="text-sm bg-gray-50 border rounded p-3">
                  <div>Элементов: {draft?.length}</div>
                  <div>Аудиторий назначено: {draftStats?.classroomsAssigned}</div>
                  <div>Период: {params.startDate} — {params.endDate}</div>
                </div>
                <div className="h-40 overflow-y-auto text-xs border rounded p-2 bg-white">
                  {draft?.slice(0,200).map(d => (
                    <div key={d.tempId} className="flex space-x-2 border-b last:border-none py-1">
                      <span className="w-20 text-gray-500">{d.date}</span>
                      <span className="w-16">{d.startTime}</span>
                      <span className="flex-1 truncate">{d.subject}</span>
                      <span className="w-20 text-gray-500">{d.roomType||'-'}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={()=>setStep(1)}>Назад</Button>
                  <Button disabled={!draft || loading} onClick={runOptimize}>Оптимизировать AI</Button>
                </div>
                {loading && <Loading text="Оптимизация..." />}
              </motion.div>
            )}
            {step===3 && (
              <motion.div key="step3" initial={{x:20,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-20,opacity:0}} className="space-y-4">
                <h3 className="font-semibold flex items-center"><Zap className="h-5 w-5 mr-2"/>Оптимизированное расписание</h3>
                {optimized && (
                  <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 border p-3 rounded">
                    <div>Сгенерировано: {optimized.generatedSchedule?.length}</div>
                    <div>Конфликты (AI): {optimized.conflicts?.length}</div>
                    <div>Confidence: {Math.round((optimized.confidence||0)*100)}%</div>
                    <div>Avg lessons/day: {optimized.statistics?.averageDailyLessons}</div>
                  </div>
                )}
                <div className="h-40 overflow-y-auto text-xs border rounded p-2 bg-white">
                  {optimized?.generatedSchedule?.slice(0,200).map((d:OptimizedLesson,i:number)=>(
                    <div key={i} className="flex space-x-2 border-b last:border-none py-1">
                      <span className="w-20 text-gray-500">{d.date}</span>
                      <span className="w-16">{d.startTime}</span>
                      <span className="flex-1 truncate">{d.subject}</span>
                      <span className="w-20 text-gray-500">{d.roomType||'-'}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={()=>setStep(2)}>Назад</Button>
                  <Button disabled={!optimized || loading} onClick={runValidate}>Проверить конфликты</Button>
                </div>
                {loading && <Loading text="Локальная проверка..." />}
              </motion.div>
            )}
            {step===4 && (
              <motion.div key="step4" initial={{x:20,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-20,opacity:0}} className="space-y-4">
                <h3 className="font-semibold flex items-center"><ShieldCheck className="h-5 w-5 mr-2"/>Валидация</h3>
                {validation && (
                  <div className={`p-3 rounded border text-sm ${validation.isOk? 'bg-green-50 border-green-300':'bg-amber-50 border-amber-300'}`}>
                    <div>Конфликтов обнаружено: {validation.conflicts.length}</div>
                    {!validation.isOk && <div className="text-amber-700 mt-1">Есть пересечения. Можно вернуться и изменить параметры.</div>}
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={()=>setStep(3)}>Назад</Button>
                  <Button disabled={!validation || (validation && !validation.isOk) || applying} onClick={runApply} className="bg-green-600 hover:bg-green-700">Сохранить в БД</Button>
                </div>
                {applying && <Loading text="Сохраняем..." />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t flex justify-end space-x-2 bg-gray-50">
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AIScheduleFlowModal;
