import React, { useState, useEffect, useMemo } from 'react';
// Простые вкладки и построитель AI расписания
import scheduleService from '../services/scheduleService';
import apiClient from '../services/apiClient';
import { GroupOption, TeacherOption, ClassroomOption, StudyPlanOption } from '../types/schedule';
import { Button, Loading, Alert } from '../components/ui';
import { Calendar, Users, BookOpen, MapPin, SlidersHorizontal, Brain, Trash2, Plus, Loader2, X } from 'lucide-react';

// Minimal placeholder cards styled with tailwind utility classes (project already uses)

const AIScheduleBuilder: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'teachers' | 'groups' | 'subjects' | 'classrooms' | 'constraints'>('teachers');
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [groups, setGroups] = useState<GroupOption[]>([]);
    const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
    const [studyPlans, setStudyPlans] = useState<StudyPlanOption[]>([]);
    const [loading, setLoading] = useState(false);

    // Выборы (id наборы)
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<number>>(new Set());
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());
    const [selectedStudyPlanIds, setSelectedStudyPlanIds] = useState<Set<number>>(new Set());
    const [selectedClassroomIds, setSelectedClassroomIds] = useState<Set<number>>(new Set());

    // Ограничения (свободный текст блоками + общие поля)
    const [customConstraints, setCustomConstraints] = useState<string[]>([]);
    const [constraintDraft, setConstraintDraft] = useState('');
    const [workdayStart, setWorkdayStart] = useState('08:00');
    const [workdayEnd, setWorkdayEnd] = useState('18:00');
    const [maxConsecutive, setMaxConsecutive] = useState(4);
    const [strategy, setStrategy] = useState<'optimize' | 'full' | 'partial'>('optimize');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [aiResponse, setAiResponse] = useState<string | null>(null);

    // missedLessons обработка
    const [missedLessons, setMissedLessons] = useState<{ groupId: number; studyPlanId: number; reason: string }[]>([]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [t, g, c, sp] = await Promise.all([
                    scheduleService.getTeachers(),
                    scheduleService.getGroups(),
                    scheduleService.getClassrooms(),
                    scheduleService.getStudyPlans({ limit: 999 })
                ]);
                setTeachers(t);
                setGroups(g);
                setClassrooms(c);
                setStudyPlans(sp);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) => {
        setter(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const renderTeachers = () => (
        <div className="grid gap-4 md:grid-cols-3">
            {teachers.map(t => {
                const active = selectedTeacherIds.has(t.id);
                return (
                    <button
                        key={t.id}
                        onClick={() => toggleSet(setSelectedTeacherIds, t.id)}
                        className={`text-left border rounded-lg p-4 bg-white shadow-sm hover:border-purple-400 transition relative ${active ? 'ring-2 ring-purple-500 border-purple-500' : ''}`}
                    >
                        <h3 className="font-semibold mb-1 flex justify-between items-center">
                            <span>{t.name} {t.surname}</span>
                            {active && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">выбрано</span>}
                        </h3>
                        <div className="text-xs text-gray-500 mb-1">ID: {t.id}</div>
                        <div className="mt-1 text-xs text-gray-600">Ограничения: —</div>
                    </button>
                );
            })}
        </div>
    );

    const renderGroups = () => (
        <div className="grid gap-4 md:grid-cols-3">
            {groups.map(g => {
                const active = selectedGroupIds.has(g.id);
                return (
                    <button
                        key={g.id}
                        onClick={() => toggleSet(setSelectedGroupIds, g.id)}
                        className={`text-left border rounded-lg p-4 bg-white shadow-sm hover:border-blue-400 transition relative ${active ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                    >
                        <h3 className="font-semibold mb-1 flex justify-between items-center">
                            <span>{g.name}</span>{active && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">выбрано</span>}
                        </h3>
                        <div className="text-xs text-gray-500">Курс: {g.courseNumber}</div>
                        <div className="mt-1 text-xs text-gray-600">Ограничения: —</div>
                    </button>
                );
            })}
        </div>
    );

    const renderSubjects = () => (
        <div className="grid gap-4 md:grid-cols-3">
            {studyPlans.map(sp => {
                const active = selectedStudyPlanIds.has(sp.id);
                return (
                    <button
                        key={sp.id}
                        onClick={() => toggleSet(setSelectedStudyPlanIds, sp.id)}
                        className={`text-left border rounded-lg p-4 bg-white shadow-sm hover:border-green-400 transition relative ${active ? 'ring-2 ring-green-500 border-green-500' : ''}`}
                    >
                        <h3 className="font-semibold mb-1 flex justify-between items-center">
                            <span>{sp.name}</span>{active && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">выбрано</span>}
                        </h3>
                        <div className="text-xs text-gray-500">Группа: {sp.groupName}</div>
                        <div className="text-xs text-gray-500">Учитель: {sp.teacherId}</div>
                    </button>
                );
            })}
        </div>
    );

    const renderClassrooms = () => (
        <div className="grid gap-4 md:grid-cols-3">
            {classrooms.map(c => {
                const active = selectedClassroomIds.has(c.id);
                return (
                    <button
                        key={c.id}
                        onClick={() => toggleSet(setSelectedClassroomIds, c.id)}
                        className={`text-left border rounded-lg p-4 bg-white shadow-sm hover:border-amber-400 transition relative ${active ? 'ring-2 ring-amber-500 border-amber-500' : ''}`}
                    >
                        <h3 className="font-semibold mb-1 flex justify-between items-center">
                            <span>{c.name}</span>{active && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">выбрано</span>}
                        </h3>
                        <div className="text-xs text-gray-500">Тип: {c.type}</div>
                        <div className="text-xs text-gray-500">Вместимость: {c.capacity}</div>
                    </button>
                );
            })}
        </div>
    );

    const renderConstraints = () => (
        <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Общие параметры</h3>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Начало дня</label>
                        <input type="time" value={workdayStart} onChange={e => setWorkdayStart(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Конец дня</label>
                        <input type="time" value={workdayEnd} onChange={e => setWorkdayEnd(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Макс подряд</label>
                        <input type="number" min={1} max={8} value={maxConsecutive} onChange={e => setMaxConsecutive(Number(e.target.value))} className="w-full border rounded px-2 py-1 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Стратегия</label>
                        <select value={strategy} onChange={e => setStrategy(e.target.value as 'optimize' | 'full' | 'partial')} className="w-full border rounded px-2 py-1 text-sm">
                            <option value="optimize">Оптимизация</option>
                            <option value="full">Полная</option>
                            <option value="partial">Частичная</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Brain className="h-4 w-4" /> Свободные текстовые ограничения</h3>
                <div className="flex gap-2 mb-3">
                    <input
                        value={constraintDraft}
                        onChange={e => setConstraintDraft(e.target.value)}
                        placeholder="Например: 'Не ставить математику последним уроком'"
                        className="flex-1 border rounded px-3 py-2 text-sm"
                    />
                    <Button
                        onClick={() => { if (constraintDraft.trim()) { setCustomConstraints(prev => [...prev, constraintDraft.trim()]); setConstraintDraft(''); } }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={!constraintDraft.trim()}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {customConstraints.length === 0 && <div className="text-xs text-gray-500">Пока нет дополнительных ограничений</div>}
                <ul className="space-y-2">
                    {customConstraints.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 bg-gray-50 border rounded px-3 py-2">
                            <span className="flex-1 whitespace-pre-wrap">{c}</span>
                            <button onClick={() => setCustomConstraints(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );

    // ---- Сетка и модалка редактирования ----
    interface CellLesson {
        subject: string;
        group?: string;
        teacher?: string;
        classroom?: string;
        recurrence?: string;
        studyPlanId?: number;
        groupId?: number;
        teacherId?: number;
        classroomId?: number | null;
        startTime?: string;
        endTime?: string;
        duration?: number;
        format?: 'offline' | 'online';
        repeat?: 'weekly' | 'biweekly' | 'once';
        status?: 'upcoming' | 'completed' | 'cancelled';
    }
    const [grid, setGrid] = useState<CellLesson[][]>(() => Array.from({ length: 8 }, () => Array.from({ length: 5 }, () => ({ subject: '' }))));
    const days = ['Пон', 'Втр', 'Ср', 'Чет', 'Пт'];
    const slots = Array.from({ length: 8 }, (_, i) => i + 1);

    const [editingCell, setEditingCell] = useState<{ slotIdx: number; dayIdx: number } | null>(null);
    const [cellForm, setCellForm] = useState<{
        studyPlanId: string;
        teacherId: string;
        groupId: string;
        classroomId: string;
        startTime: string;
        duration: string;
        format: 'offline' | 'online';
        repeat: 'weekly' | 'biweekly' | 'once';
        status: 'upcoming' | 'completed' | 'cancelled';
    }>({ studyPlanId: '', teacherId: '', groupId: '', classroomId: '', startTime: '', duration: '50', format: 'offline', repeat: 'weekly', status: 'upcoming' });

    const addMinutes = (time: string, minutes: number) => {
        if (!time) return '';
        const [h, m] = time.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        d.setMinutes(d.getMinutes() + minutes);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const openCellForm = (slotIdx: number, dayIdx: number) => {
        const lesson = grid[slotIdx][dayIdx];
        setCellForm({
            studyPlanId: lesson.studyPlanId ? String(lesson.studyPlanId) : '',
            teacherId: lesson.teacherId ? String(lesson.teacherId) : '',
            groupId: lesson.groupId ? String(lesson.groupId) : '',
            classroomId: lesson.classroomId ? String(lesson.classroomId) : '',
            startTime: lesson.startTime || '',
            duration: String(lesson.duration || 50),
            format: lesson.format || 'offline',
            repeat: lesson.repeat || 'weekly',
            status: lesson.status || 'upcoming'
        });
        setEditingCell({ slotIdx, dayIdx });
    };
    const closeCellForm = () => setEditingCell(null);

    const saveCellForm = () => {
        if (!editingCell) return;
        const { slotIdx, dayIdx } = editingCell;
        const studyPlan = studyPlans.find(sp => sp.id === Number(cellForm.studyPlanId));
        const teacher = teachers.find(t => t.id === Number(cellForm.teacherId)) || (studyPlan ? teachers.find(t => t.id === studyPlan.teacherId) : undefined);
        const studyPlanGroupId = (studyPlan && (studyPlan as unknown as { groupId?: number }).groupId) || undefined;
        const group = groups.find(g => g.id === Number(cellForm.groupId)) || (studyPlanGroupId ? groups.find(g => g.id === studyPlanGroupId) : undefined);
        const classroom = classrooms.find(c => c.id === Number(cellForm.classroomId));
        const durationNum = parseInt(cellForm.duration, 10) || 50;

        const newStart = cellForm.startTime;
        const newEnd = addMinutes(newStart, durationNum);
        const conflicts: string[] = [];
        if (newStart) {
            for (let s = 0; s < grid.length; s++) {
                const existing = grid[s][dayIdx];
                if (!existing.subject || s === slotIdx) continue;
                if (existing.startTime && existing.endTime) {
                    const overlap = newStart < existing.endTime && newEnd > existing.startTime;
                    if (overlap) {
                        if (existing.teacherId && teacher?.id && existing.teacherId === teacher.id) conflicts.push('Конфликт преподавателя');
                        if (existing.classroomId && classroom?.id && existing.classroomId === classroom.id) conflicts.push('Конфликт аудитории');
                        if (existing.groupId && group?.id && existing.groupId === group.id) conflicts.push('Конфликт группы');
                    }
                }
            }
        }
        if (conflicts.length) {
            alert('Найдены конфликты:\n' + conflicts.join('\n'));
            return;
        }
        setGrid(prev => {
            const copy = prev.map(r => r.slice());
            copy[slotIdx][dayIdx] = {
                subject: studyPlan?.name || '—',
                studyPlanId: studyPlan?.id,
                teacher: teacher ? `${teacher.name} ${teacher.surname}` : undefined,
                teacherId: teacher?.id,
                group: group?.name,
                groupId: group?.id,
                classroom: classroom?.name,
                classroomId: classroom?.id,
                recurrence: 'weekly',
                startTime: newStart,
                endTime: newEnd,
                duration: durationNum,
                format: cellForm.format,
                repeat: cellForm.repeat,
                status: cellForm.status
            };
            return copy;
        });
        closeCellForm();
    };

    const clearCell = () => {
        if (!editingCell) return;
        const { slotIdx, dayIdx } = editingCell;
        setGrid(prev => {
            const copy = prev.map(r => r.slice());
            copy[slotIdx][dayIdx] = { subject: '' };
            return copy;
        });
        closeCellForm();
    };

    // Экспорт / сохранение в backend
    const [isSaving, setIsSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState<{ total: number; done: number }>({ total: 0, done: 0 });
    const dayNumber = (dIdx: number) => dIdx + 1;
    const bulkSave = async () => {
        const lessons: CellLesson[] = [];
        grid.forEach(row => row.forEach(cell => { if (cell.subject && cell.studyPlanId && cell.groupId && cell.teacherId) lessons.push(cell); }));
        if (!lessons.length) { alert('Нет заполненных занятий для сохранения'); return; }
        if (!window.confirm(`Сохранить ${lessons.length} занятий в расписание?`)) return;
        setIsSaving(true);
        setSaveProgress({ total: lessons.length, done: 0 });
        let created = 0; const errors: string[] = [];
        for (let slotIdx = 0; slotIdx < grid.length; slotIdx++) {
            for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
                const cell = grid[slotIdx][dayIdx];
                if (!cell.subject || !cell.studyPlanId || !cell.groupId || !cell.teacherId) continue;
                try {
                    let start = cell.startTime;
                    let end = cell.endTime;
                    if (!start) {
                        const base = workdayStart || '08:00';
                        const [bh, bm] = base.split(':').map(Number);
                        const date = new Date();
                        date.setHours(bh, bm, 0, 0);
                        date.setMinutes(date.getMinutes() + slotIdx * 60);
                        start = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        end = addMinutes(start, cell.duration || 50);
                    }
                    await scheduleService.create({
                        studyPlanId: cell.studyPlanId!,
                        groupId: cell.groupId!,
                        teacherId: cell.teacherId!,
                        classroomId: cell.classroomId ?? undefined,
                        dayOfWeek: dayNumber(dayIdx),
                        startTime: start!,
                        endTime: end || addMinutes(start!, cell.duration || 50)
                    });
                    created++;
                } catch (e) {
                    errors.push(`Ошибка ячейки day=${dayIdx + 1} slot=${slotIdx + 1}: ${(e as Error).message}`);
                } finally {
                    setSaveProgress(prev => ({ ...prev, done: prev.done + 1 }));
                }
            }
        }
        setIsSaving(false);
        if (errors.length) {
            alert(`Создано: ${created}. Ошибки (первые 5):\n` + errors.slice(0, 5).join('\n'));
        } else {
            alert(`Создано занятий: ${created}`);
        }
    };

    const parseAiResponseIntoGrid = (raw: string | { lessons: any[]; missedLessons?: any[] }) => {
        let parsed: any;
        if (typeof raw === 'string') {
            try {
                parsed = JSON.parse(raw);
            } catch {
                return;
            }
        } else {
            parsed = raw;
        }
        const lessons = Array.isArray(parsed) ? parsed : parsed.lessons || [];
        const newGrid: CellLesson[][] = Array.from({ length: 8 }, () => Array.from({ length: 5 }, () => ({ subject: '' })));
        lessons.forEach((l: any) => {
            const dayIdx = (l.day ?? 1) - 1;
            const slotIdx = (l.slot ?? 1) - 1;
            if (dayIdx >= 0 && dayIdx < 5 && slotIdx >= 0 && slotIdx < 8) {
                newGrid[slotIdx][dayIdx] = {
                    subject: l.studyPlanId ? `SP#${l.studyPlanId}` : '—',
                    studyPlanId: l.studyPlanId,
                    groupId: l.groupId,
                    teacherId: l.teacherId,
                    classroomId: l.classroomId,
                    recurrence: l.recurrence,
                };
            }
        });
        setGrid(newGrid);
        // обработка missedLessons
        if (parsed.missedLessons && Array.isArray(parsed.missedLessons)) {
            setMissedLessons(parsed.missedLessons);
        } else {
            setMissedLessons([]);
        }
    };

    const assembledPrompt = useMemo(() => {
        const teacherPart = teachers.filter(t => selectedTeacherIds.has(t.id)).map(t => `${t.id}:${t.name} ${t.surname}`).join('\n');
        const groupPart = groups.filter(g => selectedGroupIds.has(g.id)).map(g => `${g.id}:${g.name} курс ${g.courseNumber}`).join('\n');
        const planPart = studyPlans.filter(p => selectedStudyPlanIds.has(p.id)).map(p => `${p.id}:${p.name} (group ${p.groupName})`).join('\n');
        const roomPart = classrooms.filter(c => selectedClassroomIds.has(c.id)).map(c => `${c.id}:${c.name} (${c.type}) cap:${c.capacity}`).join('\n');
        const constraintsPart = [
            `Рабочее время: ${workdayStart}-${workdayEnd}`,
            `Макс подряд занятий: ${maxConsecutive}`,
            `Стратегия: ${strategy}`,
            ...customConstraints
        ].join('\n');
        const outputFormat = `# OutputFormat\nВерни JSON объект вида {\n  "lessons": [\n    {"day":1-5, "slot":1-8, "studyPlanId":number, "groupId":number, "teacherId":number, "classroomId":number|null, "recurrence":"weekly"}\n  ]\n}\nТолько эти поля (additionalProperties=false). Используй только ID из контекста. Все занятия weekly (recurrence="weekly").`;
        return `# Teachers\n${teacherPart || '—'}\n\n# Groups\n${groupPart || '—'}\n\n# StudyPlans\n${planPart || '—'}\n\n# Classrooms\n${roomPart || '—'}\n\n# Constraints\n${constraintsPart}\n\n${outputFormat}`;
    }, [teachers, groups, studyPlans, classrooms, selectedTeacherIds, selectedGroupIds, selectedStudyPlanIds, selectedClassroomIds, workdayStart, workdayEnd, maxConsecutive, strategy, customConstraints]);

    const canSubmit = useMemo(() => selectedStudyPlanIds.size > 0 && selectedGroupIds.size > 0 && selectedTeacherIds.size > 0, [selectedStudyPlanIds, selectedGroupIds, selectedTeacherIds]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        setAiResponse(null);
        try {
            // backend endpoint /ai-assistant/openai-responses expects { message, scenario }
            const data = await apiClient.post<any>('/ai-assistant/openai-responses', {
                message: assembledPrompt,
                scenario: 'schedule_generation_v1'
            });
            setAiResponse(data);
            if (typeof data === 'string') {
                parseAiResponseIntoGrid(data);
            } else if (typeof data === 'object' && data && data.lessons) {
                parseAiResponseIntoGrid(data);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка запроса к AI';
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Фильтры для сетки ---
    const [gridFilter, setGridFilter] = useState<'all' | 'group' | 'teacher' | 'classroom'>('all');
    const [gridFilterValue, setGridFilterValue] = useState<string>('');
    // Получить варианты для фильтра
    const groupOptions = useMemo(() => groups.map(g => ({ value: String(g.id), label: g.name })), [groups]);
    const teacherOptions = useMemo(() => teachers.map(t => ({ value: String(t.id), label: `${t.name} ${t.surname}` })), [teachers]);
    const classroomOptions = useMemo(() => classrooms.map(c => ({ value: String(c.id), label: c.name })), [classrooms]);
    // Фильтрация ячеек
    const isLessonVisible = (lesson: CellLesson) => {
        if (!lesson.subject) return false;
        if (gridFilter === 'all') return true;
        if (gridFilter === 'group') return gridFilterValue && String(lesson.groupId) === gridFilterValue;
        if (gridFilter === 'teacher') return gridFilterValue && String(lesson.teacherId) === gridFilterValue;
        if (gridFilter === 'classroom') return gridFilterValue && String(lesson.classroomId) === gridFilterValue;
        return true;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold flex items-center gap-2"><Brain className="h-6 w-6 text-purple-600" /> AI Расписание</h1>
                    <p className="text-sm text-gray-600">Отдельный интерфейс подготовки данных перед запуском ИИ генерации</p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    <Button variant="outline" onClick={() => { setSelectedTeacherIds(new Set()); setSelectedGroupIds(new Set()); setSelectedStudyPlanIds(new Set()); setSelectedClassroomIds(new Set()); setCustomConstraints([]); setAiResponse(null); }}>Очистить</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 flex items-center"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Сгенерировать
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('constraints')}>Ограничения</Button>
                    <Button onClick={bulkSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                        {isSaving ? `Сохранение ${saveProgress.done}/${saveProgress.total}` : 'Сохранить в расписание'}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b mb-4 flex gap-6 text-sm overflow-x-auto">
                <button onClick={() => setActiveTab('teachers')} className={activeTab === 'teachers' ? 'pb-2 -mb-px border-b-2 border-purple-600 font-medium' : 'pb-2 text-gray-500'}>Учителя ({selectedTeacherIds.size})</button>
                <button onClick={() => setActiveTab('groups')} className={activeTab === 'groups' ? 'pb-2 -mb-px border-b-2 border-purple-600 font-medium' : 'pb-2 text-gray-500'}>Группы ({selectedGroupIds.size})</button>
                <button onClick={() => setActiveTab('subjects')} className={activeTab === 'subjects' ? 'pb-2 -mb-px border-b-2 border-purple-600 font-medium' : 'pb-2 text-gray-500'}>Предметы ({selectedStudyPlanIds.size})</button>
                <button onClick={() => setActiveTab('classrooms')} className={activeTab === 'classrooms' ? 'pb-2 -mb-px border-b-2 border-purple-600 font-medium' : 'pb-2 text-gray-500'}>Кабинеты ({selectedClassroomIds.size})</button>
                <button onClick={() => setActiveTab('constraints')} className={activeTab === 'constraints' ? 'pb-2 -mb-px border-b-2 border-purple-600 font-medium' : 'pb-2 text-gray-500'}>Ограничения ({customConstraints.length})</button>
            </div>

            {loading && <div className="text-sm text-gray-500">Загрузка...</div>}
            {submitError && <div className="text-sm text-red-600">{submitError}</div>}

            {!loading && (
                <div className="space-y-6">
                    {activeTab === 'teachers' && renderTeachers()}
                    {activeTab === 'groups' && renderGroups()}
                    {activeTab === 'subjects' && renderSubjects()}
                    {activeTab === 'classrooms' && renderClassrooms()}
                    {activeTab === 'constraints' && renderConstraints()}
                </div>
            )}
            {/* Ассемблированный промпт (превью) */}
            <div className="mt-8">
                <h2 className="text-sm font-semibold mb-2 text-gray-700">Собранный промпт (предпросмотр)</h2>
                <textarea readOnly value={assembledPrompt} className="w-full border rounded p-3 text-xs h-56 bg-gray-50" />
            </div>
            {/* Итоговая сетка расписания */}
            <div className="mt-8">
                <h2 className="text-sm font-semibold mb-2 text-gray-700">Итоговое расписание (weekly) / Grid</h2>
                {/* missedLessons alert */}
                {missedLessons.length > 0 && (
                    <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-sm text-red-700">
                        <b>Внимание!</b> Не удалось поставить некоторые предметы:<br />
                        <ul className="list-disc ml-5 mt-1">
                            {missedLessons.map((m, i) => {
                                const group = groups.find(g => g.id === m.groupId);
                                const subject = studyPlans.find(sp => sp.id === m.studyPlanId);
                                return (
                                    <li key={i}>
                                        <b>Группа:</b> {group ? group.name : m.groupId}, <b>Предмет:</b> {subject ? subject.name : m.studyPlanId}<br />
                                        <span className="text-xs">Причина: {m.reason}</span>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="mt-2 text-xs text-gray-500">Оператору необходимо вручную скорректировать расписание для этих случаев.</div>
                    </div>
                )}
                {/* Фильтры */}
                <div className="flex flex-wrap gap-2 mb-3 items-center">
                    <span className="text-xs text-gray-500 mr-2">Фильтр:</span>
                    <Button size="sm" variant={gridFilter === 'all' ? 'primary' : 'outline'} onClick={() => { setGridFilter('all'); setGridFilterValue(''); }}>Все</Button>
                    <Button size="sm" variant={gridFilter === 'group' ? 'primary' : 'outline'} onClick={() => { setGridFilter('group'); setGridFilterValue(''); }}>По группе</Button>
                    <Button size="sm" variant={gridFilter === 'teacher' ? 'primary' : 'outline'} onClick={() => { setGridFilter('teacher'); setGridFilterValue(''); }}>По учителю</Button>
                    <Button size="sm" variant={gridFilter === 'classroom' ? 'primary' : 'outline'} onClick={() => { setGridFilter('classroom'); setGridFilterValue(''); }}>По кабинету</Button>
                    {(gridFilter === 'group') && (
                        <select className="ml-2 border rounded px-2 py-1 text-xs" value={gridFilterValue} onChange={e => setGridFilterValue(e.target.value)}>
                            <option value="">— выбрать группу —</option>
                            {groupOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    )}
                    {(gridFilter === 'teacher') && (
                        <select className="ml-2 border rounded px-2 py-1 text-xs" value={gridFilterValue} onChange={e => setGridFilterValue(e.target.value)}>
                            <option value="">— выбрать учителя —</option>
                            {teacherOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    )}
                    {(gridFilter === 'classroom') && (
                        <select className="ml-2 border rounded px-2 py-1 text-xs" value={gridFilterValue} onChange={e => setGridFilterValue(e.target.value)}>
                            <option value="">— выбрать кабинет —</option>
                            {classroomOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    )}
                </div>
                <div className="overflow-auto border rounded">
                    <table className="min-w-full border text-xs">
                        <thead>
                            <tr>
                                <th className="border px-2 py-1 bg-gray-100">Урок/День</th>
                                {days.map(d => <th key={d} className="border px-2 py-1 bg-gray-100 w-40">{d}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map((slot, sIdx) => (
                                <tr key={slot}>
                                    <td className="border px-2 py-1 font-medium bg-gray-50 text-center">{slot}</td>
                                    {days.map((d, dIdx) => {
                                        const lesson = grid[sIdx][dIdx];
                                        const onDragStart = (e: React.DragEvent) => {
                                            e.dataTransfer.setData('text/plain', JSON.stringify({ fromSlot: sIdx, fromDay: dIdx }));
                                        };
                                        const onDrop = (e: React.DragEvent) => {
                                            e.preventDefault();
                                            const data = e.dataTransfer.getData('text/plain');
                                            if (!data) return;
                                            const { fromSlot, fromDay } = JSON.parse(data);
                                            if (fromSlot === sIdx && fromDay === dIdx) return;
                                            setGrid(prev => {
                                                const copy = prev.map(r => r.slice());
                                                const dragged = { ...copy[fromSlot][fromDay] };
                                                copy[fromSlot][fromDay] = { subject: '' };
                                                copy[sIdx][dIdx] = dragged;
                                                return copy;
                                            });
                                        };
                                        const onDragOver = (e: React.DragEvent) => {
                                            e.preventDefault();
                                        };
                                        // Цвет карточки по предмету (studyPlanId)
                                        const colorList = [
                                            'bg-purple-100 border-purple-200',
                                            'bg-blue-100 border-blue-200',
                                            'bg-green-100 border-green-200',
                                            'bg-amber-100 border-amber-200',
                                            'bg-pink-100 border-pink-200',
                                            'bg-cyan-100 border-cyan-200',
                                            'bg-lime-100 border-lime-200',
                                            'bg-fuchsia-100 border-fuchsia-200',
                                        ];
                                        const colorIdx = lesson.studyPlanId ? lesson.studyPlanId % colorList.length : 0;
                                        const cardColor = colorList[colorIdx];
                                        return (
                                            <td
                                                key={d}
                                                className="border align-top p-1 h-16 w-40 bg-white relative group"
                                                draggable={!!lesson.subject}
                                                onDragStart={lesson.subject ? onDragStart : undefined}
                                                onDrop={onDrop}
                                                onDragOver={onDragOver}
                                            >
                                                {lesson.subject && isLessonVisible(lesson) ? (
                                                    <button onClick={() => openCellForm(sIdx, dIdx)} className="w-full h-full text-left">
                                                        <div className={`rounded-lg shadow-sm border ${cardColor} p-2 space-y-1 transition hover:shadow-md min-h-[60px] flex flex-col justify-between`}>
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <BookOpen className="h-4 w-4 text-purple-400 mr-1" />
                                                                <span className="font-semibold truncate" title={lesson.subject}>{lesson.subject}</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 text-[11px]">
                                                                {lesson.group && <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 px-1 rounded"><Users className="h-3 w-3 text-blue-400" />{lesson.group}</span>}
                                                                {lesson.teacher && <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 px-1 rounded"><Calendar className="h-3 w-3 text-purple-400" />{lesson.teacher}</span>}
                                                                {lesson.classroom && <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 px-1 rounded"><MapPin className="h-3 w-3 text-amber-400" />{lesson.classroom}</span>}
                                                                {lesson.startTime && <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 px-1 rounded"><SlidersHorizontal className="h-3 w-3 text-gray-400" />{lesson.startTime}</span>}
                                                            </div>
                                                        </div>
                                                        <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-[9px] text-purple-500 px-1">edit</span>
                                                    </button>
                                                ) : (
                                                    <button onClick={() => openCellForm(sIdx, dIdx)} className="w-full h-full flex items-center justify-center text-purple-300 hover:text-purple-600 transition" title="Добавить">
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!aiResponse && <div className="text-xs text-gray-500 mt-2">Пока нет сгенерированного расписания — отправьте данные ИИ.</div>}
                {aiResponse && <div className="text-[11px] text-gray-500 mt-2">Все занятия имеют повторяемость раз в неделю (weekly).</div>}
            </div>
            {editingCell && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">{`Ячейка: ${days[editingCell.dayIdx]} • Урок ${editingCell.slotIdx + 1}`}</h3>
                            <button onClick={closeCellForm} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-medium mb-1">Учебный план / предмет</label>
                                <select value={cellForm.studyPlanId} onChange={e => setCellForm(f => ({ ...f, studyPlanId: e.target.value }))} className="w-full border rounded px-2 py-1">
                                    <option value="">— выберите —</option>
                                    {studyPlans.filter(sp => selectedStudyPlanIds.size === 0 || selectedStudyPlanIds.has(sp.id)).map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Учитель</label>
                                    <select value={cellForm.teacherId} onChange={e => setCellForm(f => ({ ...f, teacherId: e.target.value }))} className="w-full border rounded px-2 py-1">
                                        <option value="">—</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.surname}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Группа</label>
                                    <select value={cellForm.groupId} onChange={e => setCellForm(f => ({ ...f, groupId: e.target.value }))} className="w-full border rounded px-2 py-1">
                                        <option value="">—</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Аудитория</label>
                                <select value={cellForm.classroomId} onChange={e => setCellForm(f => ({ ...f, classroomId: e.target.value }))} className="w-full border rounded px-2 py-1">
                                    <option value="">—</option>
                                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Начало</label>
                                    <input type="time" value={cellForm.startTime} onChange={e => setCellForm(f => ({ ...f, startTime: e.target.value }))} className="w-full border rounded px-2 py-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Длительность (мин)</label>
                                    <input type="number" min={10} max={180} value={cellForm.duration} onChange={e => setCellForm(f => ({ ...f, duration: e.target.value }))} className="w-full border rounded px-2 py-1" />
                                </div>
                            </div>
                            {cellForm.startTime && <div className="text-[11px] text-gray-500">Конец: {addMinutes(cellForm.startTime, parseInt(cellForm.duration, 10) || 50)}</div>}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Формат</label>
                                    <select value={cellForm.format} onChange={e => setCellForm(f => ({ ...f, format: e.target.value as 'offline' | 'online' }))} className="w-full border rounded px-2 py-1 text-xs">
                                        <option value="offline">Офлайн</option>
                                        <option value="online">Онлайн</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Repeat</label>
                                    <select value={cellForm.repeat} onChange={e => setCellForm(f => ({ ...f, repeat: e.target.value as 'weekly' | 'biweekly' | 'once' }))} className="w-full border rounded px-2 py-1 text-xs">
                                        <option value="weekly">weekly</option>
                                        <option value="biweekly">biweekly</option>
                                        <option value="once">once</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Статус</label>
                                    <select value={cellForm.status} onChange={e => setCellForm(f => ({ ...f, status: e.target.value as 'upcoming' | 'completed' | 'cancelled' }))} className="w-full border rounded px-2 py-1 text-xs">
                                        <option value="upcoming">upcoming</option>
                                        <option value="completed">completed</option>
                                        <option value="cancelled">cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="text-[11px] text-gray-500">Повторяемость: weekly (фиксировано)</div>
                        </div>
                        <div className="flex justify-between gap-2 pt-2">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={clearCell} disabled={!grid[editingCell.slotIdx][editingCell.dayIdx].subject}>Очистить</Button>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={closeCellForm}>Отмена</Button>
                                <Button onClick={saveCellForm} disabled={!cellForm.studyPlanId || !cellForm.startTime} className="bg-purple-600 hover:bg-purple-700 text-white">Сохранить</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIScheduleBuilder;
