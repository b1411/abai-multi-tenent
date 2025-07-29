import React from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Send,
} from 'lucide-react';
import { type Document, type DocumentApproval } from '../services/edoService';

interface DocumentStatusCardProps {
  document: Document;
  onView: () => void;
  onApprove?: () => void;
  onSendForApproval?: () => void;
  canApprove?: boolean;
  canSendForApproval?: boolean;
  currentUserId?: number;
}

const DocumentStatusCard: React.FC<DocumentStatusCardProps> = ({
  document,
  onView,
  onApprove,
  onSendForApproval,
  canApprove = false,
  canSendForApproval = false,
  currentUserId,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Черновик';
      case 'IN_PROGRESS':
        return 'На согласовании';
      case 'APPROVED':
        return 'Согласован';
      case 'REJECTED':
        return 'Отклонен';
      case 'COMPLETED':
        return 'Завершен';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'STUDENT_CERTIFICATE':
        return 'Справка об обучении';
      case 'ADMINISTRATIVE_ORDER':
        return 'Административный приказ';
      case 'FINANCIAL_CONTRACT':
        return 'Финансовый договор';
      case 'ENROLLMENT_ORDER':
        return 'Приказ о зачислении';
      case 'ACADEMIC_TRANSCRIPT':
        return 'Академическая справка';
      default:
        return type;
    }
  };

  const getApprovalProgress = () => {
    if (!document.approvals || document.approvals.length === 0) {
      return { approved: 0, total: 0, percentage: 0 };
    }

    const approved = document.approvals.filter(a => a.status === 'APPROVED').length;
    const total = document.approvals.length;
    const percentage = total > 0 ? (approved / total) * 100 : 0;

    return { approved, total, percentage };
  };

  const { approved, total, percentage } = getApprovalProgress();

  const getCurrentUserApproval = (): DocumentApproval | null => {
    if (!currentUserId || !document.approvals) return null;
    return document.approvals.find(a => a.approverId === currentUserId) || null;
  };

  const currentUserApproval = getCurrentUserApproval();

  const getNextApprover = () => {
    if (!document.approvals) return null;
    return document.approvals.find(a => a.status === 'PENDING');
  };

  const nextApprover = getNextApprover();

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
      {/* Заголовок документа */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
            {document.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{getTypeText(document.type)}</span>
            {document.number && (
              <>
                <span>•</span>
                <span>№ {document.number}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            document.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
            document.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            document.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getStatusIcon(document.status)}
            {getStatusText(document.status)}
          </span>
        </div>
      </div>

      {/* Информация о документе */}
      <div className="space-y-2 mb-4">
        {document.createdBy && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Создатель: {document.createdBy.name} {document.createdBy.surname}</span>
          </div>
        )}
        
        {document.responsible && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Ответственный: {document.responsible.name} {document.responsible.surname}</span>
          </div>
        )}

        {document.student && document.student.user && document.student.group && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Студент: {document.student.user.name} {document.student.user.surname} ({document.student.group.name})</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Создан: {new Date(document.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>

        {document.deadline && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Срок: {new Date(document.deadline).toLocaleDateString('ru-RU')}</span>
          </div>
        )}
      </div>

      {/* Прогресс согласования */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Согласование</span>
            <span className="text-sm text-gray-600">{approved}/{total}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                document.status === 'APPROVED' ? 'bg-green-500' :
                document.status === 'REJECTED' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          {/* Текущий этап согласования */}
          {document.status === 'IN_PROGRESS' && nextApprover && nextApprover.approver && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              <span>Ожидает согласования: {nextApprover.approver.name} {nextApprover.approver.surname}</span>
            </div>
          )}

          {/* Статус для текущего пользователя */}
          {currentUserApproval && (
            <div className="flex items-center gap-2 text-sm">
              {currentUserApproval.status === 'APPROVED' && (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-700">Вы согласовали документ</span>
                </>
              )}
              {currentUserApproval.status === 'REJECTED' && (
                <>
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-red-700">Вы отклонили документ</span>
                </>
              )}
              {currentUserApproval.status === 'PENDING' && (
                <>
                  <Clock className="w-3 h-3 text-yellow-500" />
                  <span className="text-yellow-700">Ожидает вашего согласования</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Метрики */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        {document._count && document._count.comments > 0 && (
          <span>{document._count.comments} комментариев</span>
        )}
        {document._count && document._count.files > 0 && (
          <span>{document._count.files} файлов</span>
        )}
      </div>

      {/* Действия */}
      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          <Eye className="w-4 h-4" />
          Просмотр
        </button>

        {canSendForApproval && onSendForApproval && document.status === 'DRAFT' && (
          <button
            onClick={onSendForApproval}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
          >
            <Send className="w-4 h-4" />
            На согласование
          </button>
        )}

        {canApprove && onApprove && currentUserApproval?.status === 'PENDING' && (
          <button
            onClick={onApprove}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <ThumbsUp className="w-4 h-4" />
            Согласовать
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentStatusCard;
