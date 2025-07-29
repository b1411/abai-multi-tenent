import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaPlus, FaCalendar, FaCaretDown, FaTimes, FaEdit, FaEye } from 'react-icons/fa';
import { journalService } from '../services/journalService';
import { useAuth } from '../hooks/useAuth';
import type {
    LessonResult,
    Student,
    Lesson,
    CreateLessonResultDto,
    UpdateLessonResultDto,
    JournalFilters
} from '../types/journal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { PaginateResponseDto } from '../types/api';

interface GradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: number;
    lessonId: number;
    initialResult?: LessonResult;
    onSave: (data: CreateLessonResultDto | UpdateLessonResultDto) => Promise<void>;
}

interface GradeInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: LessonResult;
    student: Student;
    lesson: Lesson;
}

const GradeModal: React.FC<GradeModalProps> = ({
    isOpen,
    onClose,
    studentId,
    lessonId,
    initialResult,
    onSave
}) => {
    const [lessonScore, setLessonScore] = useState(initialResult?.lessonScore || '');
    const [lessonScoreComment, setLessonScoreComment] = useState(initialResult?.lessonScoreComment || '');
    const [homeworkScore, setHomeworkScore] = useState(initialResult?.homeworkScore || '');
    const [homeworkScoreComment, setHomeworkScoreComment] = useState(initialResult?.homeworkScoreComment || '');
    const [attendance, setAttendance] = useState<boolean | undefined>(initialResult?.attendance);
    const [absentReason, setAbsentReason] = useState<'SICK' | 'FAMILY' | 'OTHER' | ''>
        (initialResult?.absentReason || '');
    const [absentComment, setAbsentComment] = useState(initialResult?.absentComment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data: CreateLessonResultDto | UpdateLessonResultDto = {
                ...(initialResult ? {} : { studentId, lessonId }),
                lessonScore: lessonScore ? Number(lessonScore) : undefined,
                lessonScorecomment: lessonScoreComment || undefined, // Исправлено название поля
                homeworkScore: homeworkScore ? Number(homeworkScore) : undefined,
                homeworkScoreComment: homeworkScoreComment || undefined,
                attendance: attendance,
                absentReason: absentReason || undefined,
                absentComment: absentComment || undefined,
            };

            await onSave(data);
            onClose();
        } catch (error) {
            console.error('Ошибка при сохранении оценки:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редактирование оценок">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Посещаемость */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Посещаемость
                    </label>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="attendance"
                                checked={attendance === true}
                                onChange={() => setAttendance(true)}
                                className="mr-2"
                            />
                            Присутствовал
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="attendance"
                                checked={attendance === false}
                                onChange={() => setAttendance(false)}
                                className="mr-2"
                            />
                            Отсутствовал
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="attendance"
                                checked={attendance === undefined}
                                onChange={() => setAttendance(undefined)}
                                className="mr-2"
                            />
                            Не отмечено
                        </label>
                    </div>
                </div>

                {/* Причина отсутствия */}
                {attendance === false && (
                    <div className="space-y-4">
                        <Select
                            label="Причина отсутствия"
                            value={absentReason}
                            onChange={(value) => setAbsentReason(value as 'SICK' | 'FAMILY' | 'OTHER' | '')}
                            options={[
                                { value: '', label: 'Выберите причину' },
                                { value: 'SICK', label: 'Болезнь' },
                                { value: 'FAMILY', label: 'Семейные обстоятельства' },
                                { value: 'OTHER', label: 'Другие причины' },
                            ]}
                        />
                        <Input
                            label="Комментарий к отсутствию"
                            value={absentComment}
                            onChange={(e) => setAbsentComment(e.target.value)}
                            placeholder="Дополнительная информация..."
                        />
                    </div>
                )}

                {/* Оценки (только если присутствовал или не отмечено) */}
                {attendance !== false && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Классная работа */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Классная работа</h4>
                                <Input
                                    label="Оценка (1-5)"
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={lessonScore}
                                    onChange={(e) => setLessonScore(e.target.value)}
                                    placeholder="Оценка за урок"
                                />
                                <Input
                                    label="Комментарий"
                                    value={lessonScoreComment}
                                    onChange={(e) => setLessonScoreComment(e.target.value)}
                                    placeholder="Комментарий к оценке..."
                                />
                            </div>

                            {/* Домашняя работа */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Домашняя работа</h4>
                                <Input
                                    label="Оценка (1-5)"
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={homeworkScore}
                                    onChange={(e) => setHomeworkScore(e.target.value)}
                                    placeholder="Оценка за ДЗ"
                                />
                                <Input
                                    label="Комментарий"
                                    value={homeworkScoreComment}
                                    onChange={(e) => setHomeworkScoreComment(e.target.value)}
                                    placeholder="Комментарий к оценке..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner size="sm" /> : 'Сохранить'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const GradeInfoModal: React.FC<GradeInfoModalProps> = ({
    isOpen,
    onClose,
    result,
    student,
    lesson
}) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Информация об оценке">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-500">Студент</span>
                        <p className="font-medium">{student.user?.surname} {student.user?.name}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500">Группа</span>
                        <p className="font-medium">{student.group?.name || 'Не указана'}</p>
                    </div>
                </div>

                <div>
                    <span className="text-sm text-gray-500">Урок</span>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-gray-600">{lesson.date}</p>
                </div>

                <div className="space-y-4">
                    {/* Посещаемость */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">Посещаемость</span>
                        <div className="mt-1">
                            {result.attendance === true && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Присутствовал
                                </span>
                            )}
                            {result.attendance === false && (
                                <div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Отсутствовал
                                    </span>
                                    {result.absentReason && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Причина: {journalService.getAbsentReasonText(result.absentReason)}
                                        </p>
                                    )}
                                    {result.absentComment && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Комментарий: {result.absentComment}
                                        </p>
                                    )}
                                </div>
                            )}
                            {result.attendance === undefined && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Не отмечено
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Оценки */}
                    {(result.lessonScore || result.homeworkScore) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.lessonScore && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <span className="text-sm text-gray-500">Классная работа</span>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${journalService.getGradeColor(result.lessonScore)}`}>
                                            {result.lessonScore}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-600">
                                            {journalService.getGradeText(result.lessonScore)}
                                        </span>
                                    </div>
                                    {result.lessonScoreComment && (
                                        <p className="text-sm text-gray-600 mt-2">{result.lessonScoreComment}</p>
                                    )}
                                </div>
                            )}

                            {result.homeworkScore && (
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <span className="text-sm text-gray-500">Домашняя работа</span>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${journalService.getGradeColor(result.homeworkScore)}`}>
                                            {result.homeworkScore}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-600">
                                            {journalService.getGradeText(result.homeworkScore)}
                                        </span>
                                    </div>
                                    {result.homeworkScoreComment && (
                                        <p className="text-sm text-gray-600 mt-2">{result.homeworkScoreComment}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-xs text-gray-500">
                    Создано: {new Date(result.createdAt).toLocaleString('ru-RU')}
                    {result.updatedAt !== result.createdAt && (
                        <span className="block">
                            Обновлено: {new Date(result.updatedAt).toLocaleString('ru-RU')}
                        </span>
                    )}
                </div>
            </div>
        </Modal>
    );
};

const AcademicJournal: React.FC = () => {
    const { user } = useAuth();
    
    // Устанавливаем промежуток в месяц по умолчанию
    const getDefaultDateRange = () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Первый день текущего месяца
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Последний день текущего месяца
        
        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        };
    };
    
    const [filters, setFilters] = useState<JournalFilters>(getDefaultDateRange());
    const [groups, setGroups] = useState<Array<{ id: number; name: string; courseNumber: number }>>([]);
    const [studyPlans, setStudyPlans] = useState<PaginateResponseDto<{ id: number; name: string; description?: string }> | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [results, setResults] = useState<LessonResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Модальные окна
    const [gradeModal, setGradeModal] = useState<{
        isOpen: boolean;
        studentId?: number;
        lessonId?: number;
        result?: LessonResult;
    }>({ isOpen: false });
    const [infoModal, setInfoModal] = useState<{
        isOpen: boolean;
        result?: LessonResult;
        student?: Student;
        lesson?: Lesson;
    }>({ isOpen: false });

    // Определяем возможности пользователя
    const canEdit = user?.role === 'ADMIN' || user?.role === 'TEACHER';
    const canViewAll = user?.role === 'ADMIN' || user?.role === 'TEACHER';

    // Загрузка начальных данных
    useEffect(() => {
        loadInitialData();
    }, []);

    // Загрузка журнала при изменении фильтров
    useEffect(() => {
        if (canViewAll) {
            // Для преподавателей и админов - загружаем только когда все фильтры заполнены
            if (filters.groupId && filters.studyPlanId && filters.startDate && filters.endDate) {
                loadJournalData();
            }
        } else if (user?.role === 'STUDENT') {
            // Для студентов - загружаем их оценки автоматически
            loadStudentJournal();
        }
    }, [filters.groupId, filters.studyPlanId, filters.startDate, filters.endDate, user]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [groupsData, studyPlansData] = await Promise.all([
                journalService.getGroups(),
                journalService.getStudyPlans(),
            ]);
            setGroups(groupsData);
            setStudyPlans(studyPlansData);
        } catch (err) {
            setError('Ошибка загрузки данных');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadJournalData = async () => {
        if (!filters.groupId || !filters.studyPlanId || !filters.startDate || !filters.endDate) return;

        try {
            setLoading(true);

            // Загружаем уроки и журнал параллельно
            const [lessonsData, journalData] = await Promise.all([
                journalService.getLessons({
                    groupId: filters.groupId,
                    studyPlanId: filters.studyPlanId,
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }),
                journalService.getGroupJournalByPeriod(
                    filters.groupId,
                    filters.startDate,
                    filters.endDate
                )
            ]);

            console.log('Загруженные данные:', { lessonsData, journalData });

            setLessons(lessonsData || []);

            // Получаем студентов
            if ((journalData as any).students) {
                setStudents((journalData as any).students || []);
            } else {
                // Если студентов нет в журнале, загружаем отдельно
                try {
                    const groupStudents = await journalService.getGroupStudents(filters.groupId);
                    setStudents(groupStudents || []);
                } catch (studentsErr) {
                    console.error('Ошибка загрузки студентов:', studentsErr);
                    setStudents([]);
                }
            }

            // Извлекаем результаты из уроков (сначала пробуем из lessonsData)
            const allResults: LessonResult[] = [];

            if (lessonsData && lessonsData.length > 0) {
                console.log('Обрабатываем уроки из API /lessons:', lessonsData);
                lessonsData.forEach((lesson: any, index: number) => {
                    console.log(`Урок ${index + 1}:`, lesson);
                    console.log(`LessonResult для урока ${lesson.id}:`, lesson.LessonResult);
                    if (lesson.LessonResult && lesson.LessonResult.length > 0) {
                        console.log(`Добавляем ${lesson.LessonResult.length} результатов из урока ${lesson.id}`);
                        allResults.push(...lesson.LessonResult);
                    }
                });
            }

            // Если результатов нет в lessonsData, пробуем извлечь из journalData.lessons
            if (allResults.length === 0 && (journalData as any).lessons) {
                console.log('Пробуем извлечь результаты из journalData.lessons:', (journalData as any).lessons);
                (journalData as any).lessons.forEach((lesson: any, index: number) => {
                    console.log(`Урок из журнала ${index + 1}:`, lesson);
                    console.log(`LessonResult для урока ${lesson.id}:`, lesson.LessonResult);
                    if (lesson.LessonResult && lesson.LessonResult.length > 0) {
                        console.log(`Добавляем ${lesson.LessonResult.length} результатов из урока журнала ${lesson.id}`);
                        allResults.push(...lesson.LessonResult);
                    }
                });
            }

            setResults(allResults);

            console.log('ФИНАЛЬНЫЕ извлеченные результаты:', allResults);
            console.log('Количество результатов:', allResults.length);
        } catch (err) {
            setError('Ошибка загрузки журнала');
            console.error('Ошибка загрузки журнала:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStudentJournal = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            // Загружаем оценки студента
            const studentData = await journalService.getMyGrades({
                startDate: filters.startDate,
                endDate: filters.endDate,
                studyPlanId: filters.studyPlanId
            });

            console.log('Данные студента:', studentData);

            // Устанавливаем данные
            if (studentData.student) {
                setStudents([studentData.student]);
            }

            setResults(studentData.results || []);

            // Извлекаем уроки из результатов
            const uniqueLessons: any[] = [];
            studentData.results?.forEach((result: any) => {
                const lesson = result.Lesson || result.lesson; // API возвращает с заглавной буквы
                if (lesson && !uniqueLessons.find(l => l.id === lesson.id)) {
                    uniqueLessons.push({
                        ...lesson,
                        title: lesson.name || lesson.title, // используем name как title
                        date: lesson.date
                    });
                }
            });

            // Сортируем уроки по дате
            uniqueLessons.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setLessons(uniqueLessons);

        } catch (err) {
            setError('Ошибка загрузки ваших оценок');
            console.error('Ошибка загрузки оценок студента:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveResult = async (data: CreateLessonResultDto | UpdateLessonResultDto) => {
        if (gradeModal.result) {
            // Обновление существующего результата
            await journalService.updateLessonResult(gradeModal.result.id, data as UpdateLessonResultDto);
        } else {
            // Создание нового результата
            await journalService.createLessonResult(data as CreateLessonResultDto);
        }
        await loadJournalData();
    };

    const handleGradeClick = (studentId: number, lessonId: number) => {
        const existingResult = results.find(r => r.studentId === studentId && r.lessonId === lessonId);

        if (existingResult && !canEdit) {
            // Показываем информацию
            const student = students.find(s => s.id === studentId);
            const lesson = lessons.find(l => l.id === lessonId);
            if (student && lesson) {
                setInfoModal({ isOpen: true, result: existingResult, student, lesson });
            }
        } else {
            // Открываем модальное окно для редактирования
            setGradeModal({
                isOpen: true,
                studentId,
                lessonId,
                result: existingResult,
            });
        }
    };

    const getResultForStudentAndLesson = (studentId: number, lessonId: number): LessonResult | undefined => {
        return results.find(r => r.studentId === studentId && r.lessonId === lessonId);
    };

    const renderGradeCell = (studentId: number, lessonId: number) => {
        const result = getResultForStudentAndLesson(studentId, lessonId);

        // Отладочная информация
        console.log(`Проверяем оценку для студента ${studentId}, урок ${lessonId}:`, result);

        if (!result) {
            return canEdit ? (
                <button
                    onClick={() => handleGradeClick(studentId, lessonId)}
                    className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 text-gray-400 flex items-center justify-center hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                    <FaPlus />
                </button>
            ) : (
                <div className="w-12 h-12 flex items-center justify-center text-gray-300">
                    -
                </div>
            );
        }

        // Показываем оценки или отсутствие
        if (result.attendance === false) {
            return (
                <button
                    onClick={() => handleGradeClick(studentId, lessonId)}
                    className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-medium hover:bg-red-200 transition-colors"
                    title={`Отсутствовал. ${result.absentReason ? journalService.getAbsentReasonText(result.absentReason) : ''}`}
                >
                    Н
                </button>
            );
        }

        // Показываем средний балл или отдельные оценки
        const grades = [result.lessonScore, result.homeworkScore].filter((grade): grade is number => grade !== undefined && grade !== null);
        if (grades.length === 0) {
            return (
                <button
                    onClick={() => handleGradeClick(studentId, lessonId)}
                    className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    {canEdit ? <FaEdit /> : <FaEye />}
                </button>
            );
        }

        const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;

        return (
            <button
                onClick={() => handleGradeClick(studentId, lessonId)}
                className={`w-12 h-12 rounded-full text-white font-medium hover:opacity-90 transition-opacity ${journalService.getGradeColor(averageGrade)}`}
                title={`
          ${result.lessonScore ? `Урок: ${result.lessonScore}` : ''}
          ${result.homeworkScore ? `ДЗ: ${result.homeworkScore}` : ''}
          Средний: ${averageGrade.toFixed(1)}
        `.trim()}
            >
                {averageGrade.toFixed(1)}
            </button>
        );
    };

    if (loading && !lessons.length) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    {user?.role === 'STUDENT' ? 'Мои оценки' :
                        user?.role === 'PARENT' ? 'Оценки ребенка' :
                            'Электронный журнал'}
                </h1>
            </div>

            {error && (
                <Alert variant="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {/* Фильтры */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {canViewAll && (
                        <Select
                            label="Группа"
                            value={filters.groupId?.toString() || ''}
                            onChange={(value) => setFilters(prev => ({ ...prev, groupId: Number(value) || undefined }))}
                            options={[
                                { value: '', label: 'Выберите группу' },
                                ...groups.map(g => ({ value: g.id.toString(), label: g.name }))
                            ]}
                        />
                    )}

                    <Select
                        label="Предмет"
                        value={filters.studyPlanId?.toString() || ''}
                        onChange={(value) => setFilters(prev => ({ ...prev, studyPlanId: Number(value) || undefined }))}
                        options={[
                            { value: '', label: 'Все предметы' },
                            ...(studyPlans?.data?.map(sp => ({ value: sp.id.toString(), label: sp.name })) || [])
                        ]}
                    />

                    <Input
                        label="Дата начала"
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />

                    <Input
                        label="Дата окончания"
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                </div>
            </div>

            {/* Журнал */}
            {lessons.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] border-r">
                                        Студент
                                    </th>
                                    {lessons.map((lesson) => (
                                        <th key={lesson.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] border-r">
                                            <div>
                                                {new Date(lesson.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                            <div className="text-xs font-normal text-gray-400 mt-1">
                                                {(lesson as any).name || lesson.title}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="sticky left-0 bg-white px-6 py-4 whitespace-nowrap border-r">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.user.surname} {student.user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.group?.name || 'Нет группы'}
                                                    </div>
                                                </div>
                                            </td>
                                            {lessons.map((lesson) => (
                                                <td key={lesson.id} className="px-4 py-4 text-center border-r">
                                                    {renderGradeCell(student.id, lesson.id)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={lessons.length + 1} className="px-6 py-8 text-center text-gray-500">
                                            Нет студентов в группе
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : filters.groupId && filters.studyPlanId ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">Нет уроков для отображения</p>
                </div>
            ) : canViewAll ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">Выберите группу и предмет для просмотра журнала</p>
                </div>
            ) : null}

            {/* Модальные окна */}
            <GradeModal
                isOpen={gradeModal.isOpen}
                onClose={() => setGradeModal({ isOpen: false })}
                studentId={gradeModal.studentId!}
                lessonId={gradeModal.lessonId!}
                initialResult={gradeModal.result}
                onSave={handleSaveResult}
            />

            <GradeInfoModal
                isOpen={infoModal.isOpen}
                onClose={() => setInfoModal({ isOpen: false })}
                result={infoModal.result!}
                student={infoModal.student!}
                lesson={infoModal.lesson!}
            />
        </div>
    );
};

export default AcademicJournal;
