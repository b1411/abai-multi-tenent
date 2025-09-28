import React, { useState } from 'react';
import { X, Calendar, Clock, FileText, BookOpen, User, CheckCircle, Upload, ExternalLink, Trash2, Bot } from 'lucide-react';
import { Homework, HomeworkStatus } from '../types/homework';
import ProctoringView from './ProctoringView';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils';
import { fileService, FileUploadResponse } from '../services/fileService';

interface HomeworkDetailModalProps {
  homework: Homework;
  onClose: () => void;
  onSubmit?: (files: File[], comment?: string) => void;
  onViewSubmissions?: () => void;
  loading?: boolean;
}

const HomeworkDetailModal: React.FC<HomeworkDetailModalProps> = ({
  homework,
  onClose,
  onSubmit,
  onViewSubmissions,
  loading = false
}) => {
  const { user, hasRole } = useAuth();
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submissionComment, setSubmissionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isProctoringVisible, setIsProctoringVisible] = useState(false);

  const getHomeworkStatus = (): HomeworkStatus => {
    const now = new Date();
    const deadline = new Date(homework.deadline);

    const userSubmission = homework.studentsSubmissions?.find(
      submission => submission.student?.userId === user?.id
    );

    if (userSubmission) {
      // Используем статус отправки для определения состояния
      if (userSubmission.status === 'CHECKED') {
        return 'graded';
      }
      return 'submitted';
    }

    if (now > deadline) {
      return 'overdue';
    }

    return 'pending';
  };

  const getStatusStyle = (status: HomeworkStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'graded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: HomeworkStatus) => {
    switch (status) {
      case 'pending':
        return 'Ожидает выполнения';
      case 'submitted':
        return 'На проверке';
      case 'graded':
        return 'Проверено';
      case 'overdue':
        return 'Просрочено';
      default:
        return status;
    }
  };

  const status = getHomeworkStatus();
  const userSubmission = homework.studentsSubmissions?.find(
    submission => submission.student?.userId === user?.id
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSubmissionFiles(prev => [...prev, ...files]);
    // Очищаем input для возможности повторной загрузки того же файла
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSubmissionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmitWork = async () => {
    if (submissionFiles.length === 0 || !onSubmit) return;

    try {
      setIsSubmitting(true);
      await onSubmit(submissionFiles, submissionComment);
      setSubmissionFiles([]);
      setSubmissionComment('');
    } catch (error) {
      console.error('Ошибка отправки работы:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeRemaining = (): string => {
    const now = new Date();
    const deadline = new Date(homework.deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return 'Срок истек';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}д ${hours}ч`;
    if (hours > 0) return `${hours}ч`;

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}м`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">{homework.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Deadline */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(status)}`}>
              {getStatusText(status)}
            </span>

            <div className="text-right">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">{formatDate(homework.deadline)}</span>
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">{formatDateTime(homework.deadline)}</span>
              </div>
              <div className={`text-xs mt-1 ${status === 'overdue' ? 'text-red-600' : 'text-green-600'}`}>
                {getTimeRemaining()}
              </div>
            </div>
          </div>

          {/* Lesson Info */}
          {homework.lesson && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Урок</h3>
              <div className="text-sm text-gray-600">
                <div>{homework.lesson.name}</div>
                <div className="text-xs mt-1">
                  {formatDate(homework.lesson.date)}
                  {homework.lesson.studyPlan?.teacher?.user && (
                    <span className="ml-2">
                      • {homework.lesson.studyPlan.teacher.user.name} {homework.lesson.studyPlan.teacher.user.surname}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {(homework.description || homework.materials?.lecture) && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Описание задания
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {homework.description || homework.materials?.lecture}
                </p>
              </div>
            </div>
          )}

          {/* Additional Files */}
          {homework.additionalFiles && homework.additionalFiles.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Дополнительные материалы</h3>
              <div className="space-y-2">
                {homework.additionalFiles.map(file => (
                  <button
                    key={file.id}
                    onClick={async () => {
                      try {
                        await fileService.downloadFile(file.id, file.name);
                      } catch (error) {
                        console.error('Error downloading file:', error);
                        alert('Ошибка скачивания файла');
                      }
                    }}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                  >
                    <FileText className="h-4 w-4 text-gray-500 mr-3" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-500">{file.type} • {(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Student Submission Status (only for STUDENT) */}
          {hasRole('STUDENT') && userSubmission && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Ваша отправка</h3>
              <div className="text-sm text-blue-800">
                <div>Отправлено: {formatDateTime(userSubmission.submittedAt)}</div>
                {userSubmission.comment && (
                  <div className="mt-1">Комментарий: {userSubmission.comment}</div>
                )}
                {userSubmission.lessonResult?.homeworkScore !== null && userSubmission.lessonResult?.homeworkScore !== undefined && (
                  <div className="mt-2 p-2 bg-green-100 rounded">
                    <div className="font-medium text-green-800">
                      Оценка: {userSubmission.lessonResult.homeworkScore}
                    </div>
                    {userSubmission.lessonResult.homeworkScoreComment && (
                      <div className="text-green-700 text-xs mt-1">
                        {userSubmission.lessonResult.homeworkScoreComment}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Work Form (only for STUDENT) */}
          {hasRole('STUDENT') && status !== 'overdue' && (!userSubmission || (userSubmission && (userSubmission.lessonResult?.homeworkScore === null || userSubmission.lessonResult?.homeworkScore === undefined))) && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {userSubmission ? 'Изменить работу' : 'Отправить работу'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Файлы с работой
                  </label>
                  <div className="border border-gray-300 rounded-md p-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Нажмите для загрузки</span> или перетащите файлы
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, ZIP до 10MB</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.png"
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>

                    {submissionFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Выбранные файлы:</h4>
                        {submissionFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-gray-500 mr-2" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="p-1 text-red-500 hover:text-red-700"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Загрузите файлы с вашей работой. Можно выбрать несколько файлов.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Комментарий (опционально)
                  </label>
                  <textarea
                    value={submissionComment}
                    onChange={(e) => setSubmissionComment(e.target.value)}
                    placeholder="Добавьте комментарий к вашей работе..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  onClick={handleSubmitWork}
                  disabled={submissionFiles.length === 0 || isSubmitting}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Отправить работу
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsProctoringVisible(true)}
                  className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 flex items-center justify-center mt-2"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Сдать работу
                </button>
              </div>
            </div>
          )}

          {/* Teacher Actions */}
          {(hasRole('ADMIN') || hasRole('TEACHER')) && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                {onViewSubmissions && (
                  <button
                    onClick={onViewSubmissions}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center justify-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Проверить работы ({homework.studentsSubmissions?.length || 0})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {isProctoringVisible && hasRole('STUDENT') && (
        <ProctoringView
          lessonTopic={homework.lesson?.name || 'Общая тема'}
          homeworkId={homework.id}
          lessonId={homework.lesson?.id}
          onClose={() => setIsProctoringVisible(false)}
        />
      )}
    </div>
  );
};

export default HomeworkDetailModal;
