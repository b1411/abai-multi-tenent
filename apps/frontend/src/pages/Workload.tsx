import React, { useState, useEffect } from 'react';
import {
    FaDownload,
    FaSearch,
    FaFileExport,
    FaCalendarAlt,
    FaClock,
    FaChevronDown,
    FaEdit,
    FaSave,
    FaTimes,
    FaPlus,
    FaSync
} from 'react-icons/fa';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Spinner } from '../components/ui/Spinner';
import { workloadService } from '../services/workloadService';
import { WorkloadAnalytics } from '../types/workload';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface TeacherWorkedHours {
    id: number;
    teacherId: number;
    month: number;
    year: number;
    scheduledHours: number;
    workedHours: number;
    substitutedHours: number;
    substitutedByOthers: number;
    teacher: {
        user: {
            id: number;
            name: string;
            surname: string;
            email: string;
        };
    };
}

interface TeacherWorkedHoursDetails {
    summary: TeacherWorkedHours;
    details: {
        regular: any[];
        substitutions: any[];
        cancelled: any[];
        rescheduled: any[];
    };
    statistics: {
        totalSchedules: number;
        completedSchedules: number;
        cancelledSchedules: number;
        rescheduledSchedules: number;
        substitutionSchedules: number;
    };
}

type PeriodType = 'month' | 'quarter' | 'year';

const WorkloadPage: React.FC = () => {
    // Состояние для данных
    const [teachersData, setTeachersData] = useState<TeacherWorkedHours[]>([]);
    const [analytics, setAnalytics] = useState<WorkloadAnalytics | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherWorkedHoursDetails | null>(null);

    // Состояние UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Фильтры
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [periodType, setPeriodType] = useState<PeriodType>('month');

    // Состояние для действий
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // API методы
    const fetchTeachersWorkedHours = async () => {
        try {
            setLoading(true);
            const data = await workloadService.getAllWorkedHours(selectedMonth, selectedYear);
            setTeachersData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const data = await workloadService.getAnalytics({
                academicYear: selectedYear.toString()
            });
            console.log('Analytics data:', data);
            console.log('Subject distribution:', data?.subjectDistribution);
            setAnalytics(data);
        } catch (err) {
            console.error('Ошибка загрузки аналитики:', err);
        }
    };

    const fetchTeacherDetails = async (teacherId: number) => {
        try {
            const data = await workloadService.getTeacherWorkedHoursDetails(teacherId, selectedMonth, selectedYear);
            setSelectedTeacher(data);
            setIsModalOpen(true);
        } catch (err) {
            console.error('Ошибка загрузки деталей преподавателя:', err);
            alert('Ошибка загрузки деталей преподавателя');
        }
    };

    const recalculateAllHours = async () => {
        if (!confirm(`Пересчитать отработанные часы всех преподавателей за ${selectedMonth}/${selectedYear}?`)) {
            return;
        }

        setIsRecalculating(true);
        try {
            const result = await workloadService.recalculateAllWorkedHours2(selectedYear, selectedMonth);
            alert(`Пересчет завершен!\n${result.message || 'Данные обновлены'}`);

            await fetchTeachersWorkedHours();
            await fetchAnalytics();
        } catch (err) {
            console.error('Ошибка пересчета:', err);
            alert('Ошибка при пересчете часов');
        } finally {
            setIsRecalculating(false);
        }
    };

    const syncTeacherHours = async (teacherId: number) => {
        setIsSyncing(true);
        try {
            const result = await workloadService.syncTeacherWorkedHours(teacherId, selectedYear, selectedMonth);
            alert(`Синхронизация завершена!\n${result.message || 'Данные синхронизированы'}`);

            await fetchTeachersWorkedHours();
            if (selectedTeacher?.summary.teacherId === teacherId) {
                await fetchTeacherDetails(teacherId);
            }
        } catch (err) {
            console.error('Ошибка синхронизации:', err);
            alert('Ошибка при синхронизации часов');
        } finally {
            setIsSyncing(false);
        }
    };

    // Эффекты
    useEffect(() => {
        fetchTeachersWorkedHours();
        fetchAnalytics();
    }, [selectedYear, selectedMonth, periodType]);

    // Вспомогательные функции
    const getMonthName = (month: number): string => {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return months[month - 1];
    };

    const filteredTeachers = teachersData.filter(teacher => {
        const fullName = `${teacher.teacher.user.name} ${teacher.teacher.user.surname}`;
        return fullName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Данные для графиков
    const teacherChartData = filteredTeachers.map(teacher => {
        const fullName = `${teacher.teacher.user.name} ${teacher.teacher.user.surname}`;
        const shortName = fullName.length > 15
            ? `${teacher.teacher.user.surname} ${teacher.teacher.user.name.charAt(0)}.`
            : fullName;

        return {
            name: shortName,
            scheduled: teacher.scheduledHours,
            worked: teacher.workedHours,
            substituted: teacher.substitutedHours,
            difference: teacher.workedHours - teacher.scheduledHours
        };
    });

    const subjectChartData = analytics?.subjectDistribution.map(subject => ({
        name: subject.name,
        hours: subject.hours,
        value: subject.hours
    })) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-600">Ошибка: {error}</p>
                <button
                    onClick={() => {
                        setError(null);
                        fetchTeachersWorkedHours();
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            {/* Заголовок и основные контролы */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Отработанные часы преподавателей</h1>
                    <p className="text-sm text-gray-500">
                        Реальные данные из расписания за {getMonthName(selectedMonth)} {selectedYear}
                    </p>
                </div>

                {/* Фильтры */}
                <div className="flex flex-wrap gap-2">
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{getMonthName(month)}</option>
                        ))}
                    </select>

                    <button
                        className={`px-4 py-2 bg-green-600 text-white rounded-md flex items-center text-sm ${isRecalculating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        onClick={recalculateAllHours}
                        disabled={isRecalculating}
                    >
                        {isRecalculating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <FaSync className="mr-2" />
                        )}
                        {isRecalculating ? 'Пересчет...' : 'Пересчитать'}
                    </button>
                </div>
            </div>

            {/* Графики */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* График нагрузки преподавателей */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-semibold mb-4">Отработанные часы по преподавателям</h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={teacherChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    label={{
                                        value: 'Часы',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { fill: '#6B7280' }
                                    }}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        return (
                                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                <p className="font-medium text-gray-900 mb-1">{label}</p>
                                                {payload.map((entry, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: entry.color }}
                                                        />
                                                        <span className="text-gray-600">{entry.name}:</span>
                                                        <span className="font-medium">{entry.value} ч.</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="scheduled" name="Запланировано" fill="#8884d8" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="worked" name="Отработано" fill="#82ca9d" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="substituted" name="Замещений" fill="#ffc658" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* График распределения по предметам */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-semibold mb-4">Распределение часов по предметам</h2>
                    <div className="h-[400px]">
                        {subjectChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subjectChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="hours"
                                    >
                                        {subjectChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                strokeWidth={1}
                                                stroke="#fff"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) return null;
                                            const data = payload[0];
                                            return (
                                                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                    <p className="font-medium text-gray-900 mb-1">{data.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: data.color }}
                                                        />
                                                        <span className="text-gray-600">{data.value} часов</span>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Нет данных по предметам
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Поиск */}
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Поиск преподавателя..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>

                <div className="text-sm text-gray-500">
                    Показано {filteredTeachers.length} из {teachersData.length} преподавателей
                </div>
            </div>

            {/* Таблица */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Преподаватель
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Запланировано
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Отработано
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Замещений
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Отклонение
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Действия
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTeachers.map((teacher) => {
                                const fullName = `${teacher.teacher.user.name} ${teacher.teacher.user.surname}`;
                                const difference = teacher.workedHours - teacher.scheduledHours;

                                return (
                                    <tr
                                        key={teacher.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => fetchTeacherDetails(teacher.teacherId)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{fullName}</div>
                                            <div className="text-sm text-gray-500">{teacher.teacher.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {teacher.scheduledHours} ч.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {teacher.workedHours} ч.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {teacher.substitutedHours} ч.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${difference > 0 ? 'bg-green-100 text-green-800' :
                                                    difference < 0 ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {difference > 0 ? '+' : ''}{difference} ч.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    syncTeacherHours(teacher.teacherId);
                                                }}
                                                disabled={isSyncing}
                                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                            >
                                                <FaSync className={isSyncing ? 'animate-spin' : ''} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Модальное окно с деталями */}
            {isModalOpen && selectedTeacher && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Заголовок */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {selectedTeacher.summary.teacher.user.name} {selectedTeacher.summary.teacher.user.surname}
                                    </h2>
                                    <p className="text-gray-600">{selectedTeacher.summary.teacher.user.email}</p>
                                    <p className="text-sm text-gray-500">
                                        {getMonthName(selectedTeacher.summary.month)} {selectedTeacher.summary.year}
                                    </p>
                                </div>
                                <button
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    <FaTimes size={24} />
                                </button>
                            </div>

                            {/* Статистика */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-sm text-blue-700">Запланировано</div>
                                    <div className="text-2xl font-bold text-blue-900">
                                        {selectedTeacher.summary.scheduledHours} ч.
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-sm text-green-700">Отработано</div>
                                    <div className="text-2xl font-bold text-green-900">
                                        {selectedTeacher.summary.workedHours} ч.
                                    </div>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <div className="text-sm text-yellow-700">Замещений</div>
                                    <div className="text-2xl font-bold text-yellow-900">
                                        {selectedTeacher.summary.substitutedHours} ч.
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="text-sm text-purple-700">Замещено другими</div>
                                    <div className="text-2xl font-bold text-purple-900">
                                        {selectedTeacher.summary.substitutedByOthers} ч.
                                    </div>
                                </div>
                            </div>

                            {/* Статистика занятий */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <h3 className="text-lg font-semibold mb-3">Статистика занятий</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {selectedTeacher.statistics.totalSchedules}
                                        </div>
                                        <div className="text-sm text-gray-600">Всего</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {selectedTeacher.statistics.completedSchedules}
                                        </div>
                                        <div className="text-sm text-gray-600">Проведено</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {selectedTeacher.statistics.cancelledSchedules}
                                        </div>
                                        <div className="text-sm text-gray-600">Отменено</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {selectedTeacher.statistics.rescheduledSchedules}
                                        </div>
                                        <div className="text-sm text-gray-600">Перенесено</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {selectedTeacher.statistics.substitutionSchedules}
                                        </div>
                                        <div className="text-sm text-gray-600">Замещений</div>
                                    </div>
                                </div>
                            </div>

                            {/* Кнопки действий */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => syncTeacherHours(selectedTeacher.summary.teacherId)}
                                    disabled={isSyncing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSyncing ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <FaSync />
                                    )}
                                    {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkloadPage;
