import React, { useState } from 'react';
import { X, Calendar, Clock, FileText, BookOpen, User, CheckCircle, Upload, ExternalLink } from 'lucide-react';
import { Homework, HomeworkStatus } from '../types/homework';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils';

interface HomeworkDetailModalProps {
  homework: Homework;
  onClose: () => void;
  onSubmit?: (file: File, comment?: string) => void;
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
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionComment, setSubmissionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getHomeworkStatus = (): HomeworkStatus => {
    const now = new Date();
    const deadline = new Date(homework.deadline);
    
    const hasSubmission = homework.studentsSubmissions?.some(
      submission => submission.studentId === user?.id
    );

    if (hasSubmission) {
      const submission = homework.studentsSubmissions?.find(
        submission => submission.studentId === user?.id
      );
      if (submission?.lessonResult?.homeworkScore !== undefined) {
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
    submission => submission.studentId === user?.id
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmissionFile(file);
    }
  };

  const handleSubmitWork = async () => {
    if (!submissionFile || !onSubmit) return;

    try {
      setIsSubmitting(true);
      await onSubmit(submissionFile, submissionComment);
      setSubmissionFile(null);
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
          {homework.materials?.lecture && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Описание задания
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{homework.materials.lecture}</p>
              </div>
            </div>
          )}

          {/* Additional Files */}
          {homework.additionalFiles && homework.additionalFiles.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Дополнительные материалы</h3>
              <div className="space-y-2">
                {homework.additionalFiles.map(file => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-gray-500 mr-3" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-500">{file.type} • {(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Student Submission Status */}
          {hasRole('STUDENT') && userSubmission && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Ваша отправка</h3>
              <div className="text-sm text-blue-800">
                <div>Отправлено: {formatDateTime(userSubmission.submittedAt)}</div>
                {userSubmission.comment && (
                  <div className="mt-1">Комментарий: {userSubmission.comment}</div>
                )}
                {userSubmission.lessonResult?.homeworkScore !== undefined && (
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

          {/* Submit Work Form (for students) */}
          {hasRole('STUDENT') && !userSubmission && status !== 'overdue' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Отправить работу</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Файл с работой *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isSubmitting}
                  />
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
                  disabled={!submissionFile || isSubmitting}
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
              </div>
            </div>
          )}

          {/* Teacher Actions */}
          {(hasRole('ADMIN') || hasRole('TEACHER')) && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkDetailModal;
