import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  Send,
  Users,
  Eye,
} from 'lucide-react';
import { edoService, type Document, type DocumentApproval, type DocumentComment } from '../services/edoService';
import { fileService } from '../services/fileService';

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [approvals, setApprovals] = useState<DocumentApproval[]>([]);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [currentUser] = useState(() => {
    // Получаем текущего пользователя из localStorage или context
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  });

  useEffect(() => {
    if (id) {
      fetchDocument();
      fetchApprovals();
      fetchComments();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const data = await edoService.getDocument(id!);
      setDocument(data);
    } catch (error) {
      console.error('Ошибка загрузки документа:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      const data = await edoService.getApprovals(id!);
      setApprovals(data);
    } catch (error) {
      console.error('Ошибка загрузки согласований:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await edoService.getComments(id!);
      setComments(data);
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      await edoService.approveDocument(id, {
        status: 'APPROVED',
        comment: approvalComment || undefined,
      });
      
      await fetchDocument();
      await fetchApprovals();
      setShowApprovalForm(false);
      setApprovalComment('');
    } catch (error) {
      console.error('Ошибка согласования:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !approvalComment.trim()) return;
    
    setActionLoading(true);
    try {
      await edoService.rejectDocument(id, approvalComment);
      
      await fetchDocument();
      await fetchApprovals();
      setShowApprovalForm(false);
      setApprovalComment('');
    } catch (error) {
      console.error('Ошибка отклонения:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return;
    
    setActionLoading(true);
    try {
      await edoService.addComment(id, { content: newComment });
      
      await fetchComments();
      setNewComment('');
      setShowCommentForm(false);
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      await fileService.downloadFile(fileId, fileName);
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Вы уверены, что хотите удалить этот документ?')) return;
    
    setActionLoading(true);
    try {
      await edoService.deleteDocument(id);
      navigate('/edo');
    } catch (error) {
      console.error('Ошибка удаления документа:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = () => {
    if (!document || !currentUser) return false;
    
    return approvals.some(approval => 
      approval.approverId === currentUser.id && 
      approval.status === 'PENDING'
    );
  };

  const canEdit = () => {
    if (!document || !currentUser) return false;
    
    return document.createdById === currentUser.id || 
           document.responsibleId === currentUser.id;
  };

  const canDelete = () => {
    if (!document || !currentUser) return false;
    
    return document.createdById === currentUser.id;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Edit className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Документ не найден</h2>
          <p className="text-gray-600">Возможно, документ был удален или у вас нет прав доступа</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/edo')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${edoService.getStatusColor(document.status)}`}>
                {getStatusIcon(document.status)}
                {edoService.getStatusText(document.status)}
              </span>
              <span className="text-sm text-gray-500">
                {edoService.getTypeText(document.type)}
              </span>
              {document.number && (
                <span className="text-sm text-gray-500">№ {document.number}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canApprove() && (
            <button
              onClick={() => setShowApprovalForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Согласовать
            </button>
          )}
          
          {canEdit() && (
            <button
              onClick={() => navigate(`/edo/${id}/edit`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </button>
          )}
          
          {canDelete() && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основное содержимое */}
        <div className="lg:col-span-2 space-y-6">
          {/* Содержание документа */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Содержание
            </h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                {document.content}
              </pre>
            </div>
          </div>

          {/* Файлы */}
          {document.files && document.files.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Прикрепленные файлы
              </h2>
              <div className="space-y-2">
                {document.files.map((docFile) => (
                  <div key={docFile.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {docFile.file.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(docFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(docFile.file.id, docFile.file.originalName)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Скачать
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Комментарии */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Комментарии ({comments.length})
              </h2>
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Добавить комментарий
              </button>
            </div>

            {showCommentForm && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Введите комментарий..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowCommentForm(false)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || actionLoading}
                    className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                  >
                    {actionLoading ? 'Добавление...' : 'Добавить'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Комментариев пока нет</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {comment.author.name} {comment.author.surname}
                      </span>
                      <span className="text-sm text-gray-500">
                        {edoService.formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Информация о документе */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Информация</h2>
            <div className="space-y-3">
              {document.createdBy && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Создатель:</span>
                  <span className="font-medium">
                    {document.createdBy.name} {document.createdBy.surname}
                  </span>
                </div>
              )}
              
              {document.responsible && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Ответственный:</span>
                  <span className="font-medium">
                    {document.responsible.name} {document.responsible.surname}
                  </span>
                </div>
              )}
              
              {document.student && document.student.user && document.student.group && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Студент:</span>
                  <span className="font-medium">
                    {document.student.user.name} {document.student.user.surname} ({document.student.group.name})
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Создан:</span>
                <span>{edoService.formatDate(document.createdAt)}</span>
              </div>
              
              {document.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Срок:</span>
                  <span>{edoService.formatDateShort(document.deadline)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Согласования */}
          {approvals.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Согласования
              </h2>
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div key={approval.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getApprovalStatusIcon(approval.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {approval.approver.name} {approval.approver.surname}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          approval.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          approval.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {approval.status === 'APPROVED' ? 'Согласован' :
                           approval.status === 'REJECTED' ? 'Отклонен' : 'Ожидает'}
                        </span>
                      </div>
                      {approval.comment && (
                        <p className="text-sm text-gray-600">{approval.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модал согласования */}
      {showApprovalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Согласование документа</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий
              </label>
              <textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Введите комментарий (опционально для согласования, обязательно для отклонения)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApprovalForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={!approvalComment.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
              >
                {actionLoading ? 'Отклонение...' : 'Отклонить'}
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
              >
                {actionLoading ? 'Согласование...' : 'Согласовать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetailPage;
