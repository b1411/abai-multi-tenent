import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FaTimes, FaInfoCircle, FaUserTie, FaUsers, FaBuilding, FaCogs, FaFileAlt, FaPaperclip, FaTrash, FaDownload, FaCalendarPlus, FaSync } from 'react-icons/fa';
import ClassroomService from '../services/classroomService';
import { Classroom } from '../types/classroom';
import { ClassroomBooking } from '../types/classroomBooking';
import ClassroomBookingModal from './ClassroomBookingModal';
import FileUpload from './FileUpload';
import fileService, { UploadedFile } from '../services/fileService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface ClassroomDetailsModalProps {
    classroomId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
}

type TabKey = 'info' | 'equipment' | 'documents' | 'bookings';

const tabLabels: Record<TabKey, string> = {
    info: 'Инфо',
    equipment: 'Оборудование',
    documents: 'Документы',
    bookings: 'Бронирования'
};

const statusLabels: Record<ClassroomBooking['status'], string> = {
    PENDING: 'Ожидает',
    APPROVED: 'Подтверждено',
    REJECTED: 'Отклонено',
    CANCELLED: 'Отменено'
};

const statusColors: Record<ClassroomBooking['status'], string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700'
};

const ClassroomDetailsModal: React.FC<ClassroomDetailsModalProps> = ({
    classroomId,
    isOpen,
    onClose,
    onUpdated
}) => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();

    const [activeTab, setActiveTab] = useState<TabKey>('info');
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Documents
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);

    // Bookings
    const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    const canAttachDocs = ['ADMIN', 'TEACHER'].includes(user?.role || '');
    const canChangeBookingStatus = user?.role === 'ADMIN';
    const canCreateBooking = ['ADMIN', 'TEACHER', 'STUDENT'].includes(user?.role || '');

    const fetchClassroom = useCallback(async () => {
        if (!classroomId || !isOpen) return;
        setLoading(true);
        setLoadError(null);
        try {
            const data = await ClassroomService.getClassroomById(classroomId);
            setClassroom(data);
        } catch (e: any) {
            setLoadError(e?.message || 'Ошибка загрузки аудитории');
        } finally {
            setLoading(false);
        }
    }, [classroomId, isOpen]);

    const fetchDocuments = useCallback(async () => {
        if (!classroom?.fileIds || classroom.fileIds.length === 0) {
            setFiles([]);
            return;
        }
        setFilesLoading(true);
        try {
            const fetched: UploadedFile[] = [];
            for (const id of classroom.fileIds) {
                try {
                    const f = await fileService.getFile(id);
                    fetched.push(f);
                } catch {
                    // ignore single file error
                }
            }
            setFiles(fetched);
        } finally {
            setFilesLoading(false);
        }
    }, [classroom]);

    const fetchBookings = useCallback(async () => {
        if (!classroomId || !isOpen) return;
        setBookingsLoading(true);
        try {
            const list = await ClassroomService.listBookings(classroomId);
            const sorted = [...list].sort((a, b) => {
                if (a.date === b.date) return a.startTime.localeCompare(b.startTime);
                return a.date.localeCompare(b.date);
            });
            setBookings(sorted);
        } catch {
            // silent
        } finally {
            setBookingsLoading(false);
        }
    }, [classroomId, isOpen]);

    // Initial & dependency loads
    useEffect(() => {
        if (isOpen) {
            fetchClassroom();
            setActiveTab('info');
        } else {
            setClassroom(null);
            setFiles([]);
            setBookings([]);
        }
    }, [isOpen, fetchClassroom]);

    // Load docs & bookings after classroom loaded
    useEffect(() => {
        if (isOpen && classroom) {
            fetchDocuments();
            fetchBookings();
        }
    }, [isOpen, classroom, fetchDocuments, fetchBookings]);

    const handleFileUpload = async (content: string, fileName: string, fileId?: number) => {
        if (!fileId || !classroom) return;
        try {
            await ClassroomService.attachDocument(classroom.id, fileId);
            success('Документ прикреплен');
            await fetchClassroom();
            onUpdated?.();
        } catch (e: any) {
            showError(e?.message || 'Ошибка прикрепления');
        }
    };

    const handleDetachFile = async (fileId: number) => {
        if (!classroom) return;
        try {
            await ClassroomService.detachDocument(classroom.id, fileId);
            success('Документ откреплен');
            await fetchClassroom();
            onUpdated?.();
        } catch (e: any) {
            showError(e?.message || 'Ошибка удаления');
        }
    };

    const handleBookingCreated = async () => {
        await fetchBookings();
        await fetchClassroom();
        onUpdated?.();
    };

    const updateBookingStatus = async (bookingId: string, status: ClassroomBooking['status']) => {
        try {
            await ClassroomService.updateBookingStatus(bookingId, status);
            success('Статус обновлен');
            await fetchBookings();
        } catch (e: any) {
            showError(e?.message || 'Ошибка обновления статуса');
        }
    };

    const infoItems = useMemo(() => {
        if (!classroom) return [];
        return [
            { label: 'Название', value: classroom.name },
            { label: 'Здание', value: classroom.building },
            { label: 'Этаж', value: classroom.floor },
            { label: 'Вместимость', value: classroom.capacity },
            { label: 'Тип', value: classroom.type },
            { label: 'Ответственный', value: classroom.responsible ? `${classroom.responsible.name} ${classroom.responsible.surname}` : '—' },
            { label: 'Описание', value: classroom.description || '—' },
        ];
    }, [classroom]);

    if (!isOpen || !classroomId) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-5xl max-h-[95vh] flex flex-col animate-slide-up sm:animate-none">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 sm:px-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                            Аудитория {classroom ? classroom.name : ''}
                        </h2>
                        {classroom && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                {classroom.building}, этаж {classroom.floor} • {classroom.capacity} мест
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchClassroom()}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Обновить"
                            disabled={loading}
                        >
                            <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 sm:px-6 pt-3 bg-white border-b border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(tabLabels).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key as TabKey)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                        {activeTab === 'bookings' && canCreateBooking && (
                            <button
                                onClick={() => setShowBookingModal(true)}
                                className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
                            >
                                <FaCalendarPlus className="w-4 h-4" />
                                Новое бронирование
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {loadError && (
                        <div className="text-sm text-red-600">{loadError}</div>
                    )}
                    {loading && !classroom && (
                        <div className="text-sm text-gray-500">Загрузка...</div>
                    )}

                    {/* Info Tab */}
                    {activeTab === 'info' && classroom && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {infoItems.map(item => (
                                <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-1">{item.label}</div>
                                    <div className="text-sm text-gray-800 break-words">{item.value as string}</div>
                                </div>
                            ))}

                            {/* Schedules preview */}
                            {classroom.schedules && classroom.schedules.length > 0 && (
                                <div className="md:col-span-2">
                                    <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <FaInfoCircle className="w-4 h-4 text-blue-500" />
                                        Ближайшие занятия (расписание)
                                    </div>
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                        {classroom.schedules.slice(0, 20).map(s => (
                                            <div key={s.id} className="border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm flex flex-col gap-0.5">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-800 truncate">{s.studyPlan.name}</span>
                                                    <span className="text-gray-500">{s.startTime}-{s.endTime}</span>
                                                </div>
                                                <div className="text-gray-600 truncate">
                                                    Группа: {s.group.name} • Преп: {s.teacher.user.name} {s.teacher.user.surname}
                                                </div>
                                                <div className="text-gray-400">
                                                    День: {s.dayOfWeek}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Equipment Tab */}
                    {activeTab === 'equipment' && classroom && (
                        <div>
                            {classroom.equipment.length === 0 ? (
                                <div className="text-sm text-gray-500">Оборудование не указано</div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {classroom.equipment.map((eq, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200"
                                        >
                                            {eq}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && classroom && (
                        <div className="space-y-6">
                            {canAttachDocs && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <FaPaperclip className="w-4 h-4" /> Прикрепить документ
                                    </h4>
                                    <FileUpload
                                        onFileUpload={handleFileUpload}
                                        onError={(err) => showError(err)}
                                        acceptedTypes={['.pdf', '.doc', '.docx', '.txt']}
                                        maxSize={15}
                                    />
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <FaFileAlt className="w-4 h-4" /> Документы
                                </h4>
                                {filesLoading ? (
                                    <div className="text-sm text-gray-500">Загрузка...</div>
                                ) : files.length === 0 ? (
                                    <div className="text-sm text-gray-500">Нет документов</div>
                                ) : (
                                    <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                                        {files.map(f => (
                                            <li key={f.id} className="flex items-center gap-3 px-3 py-2 text-xs sm:text-sm">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-800 truncate">{f.originalName || f.name}</div>
                                                    <div className="text-gray-500 text-[11px] sm:text-xs">
                                                        {f.type} • {(f.size / 1024).toFixed(1)} KB
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => fileService.downloadFile(f.id, f.originalName || f.name)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Скачать"
                                                >
                                                    <FaDownload className="w-4 h-4" />
                                                </button>
                                                {canAttachDocs && (
                                                    <button
                                                        onClick={() => handleDetachFile(f.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Открепить"
                                                    >
                                                        <FaTrash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bookings Tab */}
                    {activeTab === 'bookings' && (
                        <div className="space-y-4">
                            {bookingsLoading ? (
                                <div className="text-sm text-gray-500">Загрузка...</div>
                            ) : bookings.length === 0 ? (
                                <div className="text-sm text-gray-500">Нет бронирований</div>
                            ) : (
                                <ul className="space-y-2">
                                    {bookings.map(b => (
                                        <li
                                            key={b.id}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm flex flex-col gap-1"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-800">
                                                    {new Date(b.date).toLocaleDateString('ru-RU', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })} {b.startTime}-{b.endTime}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusColors[b.status]}`}
                                                >
                                                    {statusLabels[b.status]}
                                                </span>
                                            </div>
                                            <div className="text-gray-700 truncate">{b.purpose}</div>
                                            <div className="text-gray-500 truncate">{b.responsiblePerson}</div>
                                            {canChangeBookingStatus && b.status === 'PENDING' && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    <button
                                                        onClick={() => updateBookingStatus(b.id, 'APPROVED')}
                                                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] transition-colors"
                                                    >
                                                        Подтвердить
                                                    </button>
                                                    <button
                                                        onClick={() => updateBookingStatus(b.id, 'REJECTED')}
                                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] transition-colors"
                                                    >
                                                        Отклонить
                                                    </button>
                                                </div>
                                            )}
                                            {canChangeBookingStatus && b.status === 'APPROVED' && (
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={() => updateBookingStatus(b.id, 'CANCELLED')}
                                                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-[11px] transition-colors"
                                                    >
                                                        Отменить
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Embedded Booking Modal */}
            <ClassroomBookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                classrooms={classroom ? [classroom] : []}
                classroomId={classroomId || undefined}
                onCreated={handleBookingCreated}
            />
        </div>
    );
};

export default ClassroomDetailsModal;
