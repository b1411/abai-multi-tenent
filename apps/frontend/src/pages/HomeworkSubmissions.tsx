import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MessageSquare,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { Button, Loading, Modal } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils';
import { Homework, HomeworkSubmission } from '../types/homework';
import { homeworkService } from '../services/homeworkService';
import { fileService } from '../services/fileService';

const HomeworkSubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<HomeworkSubmission | null>(null);
  const [gradeForm, setGradeForm] = useState({
    score: '',
    comment: ''
  });
  const [savingGrade, setSavingGrade] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'graded' | 'unsubmitted'>('all');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем данные ДЗ
      const homeworkData = await homeworkService.getHomework(parseInt(id!));
      setHomework(homeworkData);
      
      // Загружаем отправки студентов
      const submissionsData = await homeworkService.getHomeworkSubmissions(parseInt(id!));
      setSubmissions(submissionsData);
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission: HomeworkSubmission) => {
    setGradingSubmission(submission);
    setGradeForm({
      score: submission.lessonResult?.homeworkScore?.toString() || '',
      comment: submission.lessonResult?.homeworkScoreComment || ''
    });
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission || !gradeForm.score) return;

    try {
      setSavingGrade(true);
      
      // Вызываем API для оценки работы
      await homeworkService.gradeHomework(
        gradingSubmission.id,
        parseInt(gradeForm.score),
        gradeForm.comment
      );
      
      setGradingSubmission(null);
      setGradeForm({ score: '', comment: '' });
      await loadData(); // Перезагружаем данные
      
    } catch (error) {
      console.error('Ошибка при оценивании:', error);
      alert('Ошибка при сохранении оценки');
    } finally {
      setSavingGrade(false);
    }
  };

  const getSubmissionStatus = (submission: HomeworkSubmission): 'submitted' | 'graded' => {
    return submission.status === 'CHECKED' ? 'graded' : 'submitted';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'graded':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'На проверке';
      case 'graded':
        return 'Проверено';
      default:
        return status;
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'submitted') return getSubmissionStatus(submission) === 'submitted';
    if (filterStatus === 'graded') return getSubmissionStatus(submission) === 'graded';
    return true;
  });

  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => getSubmissionStatus(s) === 'submitted').length,
    graded: submissions.filter(s => getSubmissionStatus(s) === 'graded').length,
    avgScore: submissions.filter(s => s.lessonResult?.homeworkScore)
      .reduce((acc, s, _, arr) => acc + (s.lessonResult!.homeworkScore! / arr.length), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Загрузка отправок..." />
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Домашнее задание не найдено</p>
          <Button
            variant="outline"
            onClick={() => navigate('/homework')}
            className="mt-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к заданиям
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/homework')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{homework.name}</h1>
            <p className="text-gray-500 mt-1">
              Отправленные решения • Дедлайн: {formatDateTime(homework.deadline)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Всего отправок</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          <div className="text-sm text-gray-500">На проверке</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
          <div className="text-sm text-gray-500">Проверено</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{stats.avgScore.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Средний балл</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filterStatus === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('submitted')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filterStatus === 'submitted'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            На проверке ({stats.submitted})
          </button>
          <button
            onClick={() => setFilterStatus('graded')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filterStatus === 'graded'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Проверено ({stats.graded})
          </button>
        </div>
      </div>

      {/* Submissions */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет отправок</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'all' 
                ? 'Студенты еще не отправили свои работы.' 
                : 'Нет отправок с выбранным статусом.'
              }
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => {
            const status = getSubmissionStatus(submission);
            return (
              <div
                key={submission.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {submission.student?.user?.name} {submission.student?.user?.surname}
                        </h3>
                        <p className="text-sm text-gray-500">Студент ID: {submission.studentId}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(status)}`}>
                        {status === 'graded' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {getStatusText(status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Отправлено: {formatDateTime(submission.submittedAt)}
                      </div>
                      
                      {submission.fileUrl && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="h-4 w-4 mr-2" />
                          {submission.fileUrl.name}
                          <span className="ml-1">
                            ({(submission.fileUrl.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      )}
                    </div>

                    {submission.comment && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center mb-1">
                          <MessageSquare className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm font-medium text-gray-700">Комментарий студента:</span>
                        </div>
                        <p className="text-sm text-gray-700">{submission.comment}</p>
                      </div>
                    )}

                    {submission.lessonResult?.homeworkScore !== undefined && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Star className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-green-800">
                            Оценка: {submission.lessonResult.homeworkScore} баллов
                          </span>
                        </div>
                        {submission.lessonResult.homeworkScoreComment && (
                          <p className="text-sm text-green-700">
                            {submission.lessonResult.homeworkScoreComment}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {submission.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await fileService.downloadFile(submission.fileUrl!.id, submission.fileUrl!.name);
                          } catch (error) {
                            console.error('Error downloading file:', error);
                            alert('Ошибка скачивания файла');
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Скачать
                      </Button>
                    )}
                    
                    {(hasRole('ADMIN') || hasRole('TEACHER')) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleGradeSubmission(submission)}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        {status === 'graded' ? 'Изменить оценку' : 'Оценить'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Grading Modal */}
      {gradingSubmission && (
        <Modal
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          title="Оценить работу"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Студент: {gradingSubmission.student?.user?.name} {gradingSubmission.student?.user?.surname}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Отправлено: {formatDateTime(gradingSubmission.submittedAt)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Оценка (баллы) *
              </label>
              <input
                type="number"
                
                max="100"
                value={gradeForm.score}
                onChange={(e) => setGradeForm(prev => ({ ...prev, score: e.target.value }))}
                placeholder="Введите оценку"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={savingGrade}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Комментарий
              </label>
              <textarea
                value={gradeForm.comment}
                onChange={(e) => setGradeForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Добавьте комментарий к оценке..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={savingGrade}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setGradingSubmission(null)}
                disabled={savingGrade}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveGrade}
                disabled={!gradeForm.score || savingGrade}
                loading={savingGrade}
              >
                Сохранить оценку
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HomeworkSubmissionsPage;
