import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { edoService, type Document } from '../services/edoService';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import DocumentStatusCard from '../components/DocumentStatusCard';
import QuickApprovalModal from '../components/QuickApprovalModal';
import SendForApprovalModal from '../components/SendForApprovalModal';

interface DocumentStats {
  total: number;
  draft: number;
  inProgress: number;
  approved: number;
  rejected: number;
}

const EdoPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    draft: 0,
    inProgress: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSendForApprovalModal, setShowSendForApprovalModal] = useState(false);
  const [currentUser] = useState(() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  });

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    calculateStats();
  }, [documents]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      };

      const data = await edoService.getDocuments(filters);
      setDocuments(data.data || []);
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const newStats = documents.reduce(
      (acc, doc) => {
        acc.total++;
        switch (doc.status) {
          case 'DRAFT':
            acc.draft++;
            break;
          case 'IN_PROGRESS':
            acc.inProgress++;
            break;
          case 'APPROVED':
            acc.approved++;
            break;
          case 'REJECTED':
            acc.rejected++;
            break;
        }
        return acc;
      },
      { total: 0, draft: 0, inProgress: 0, approved: 0, rejected: 0 }
    );
    setStats(newStats);
  };

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

  const handleCreateDocument = () => {
    navigate('/edo/create');
  };

  const handleDocumentClick = (documentId: string) => {
    navigate(`/edo/${documentId}`);
  };

  const handleQuickApprove = (document: Document) => {
    setSelectedDocument(document);
    setShowApprovalModal(true);
  };

  const handleApprove = async (comment?: string) => {
    if (!selectedDocument) return;

    try {
      await edoService.approveDocument(selectedDocument.id, {
        status: 'APPROVED',
        comment,
      });
      
      // Обновляем список документов
      await fetchDocuments();
    } catch (error) {
      console.error('Ошибка согласования:', error);
      throw error;
    }
  };

  const handleReject = async (comment: string) => {
    if (!selectedDocument) return;

    try {
      await edoService.rejectDocument(selectedDocument.id, comment);
      
      // Обновляем список документов
      await fetchDocuments();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      throw error;
    }
  };

  const handleSendForApproval = (document: Document) => {
    setSelectedDocument(document);
    setShowSendForApprovalModal(true);
  };

  const handleSendDocument = async (approverIds: number[]) => {
    if (!selectedDocument) return;

    try {
      await edoService.sendForApproval(selectedDocument.id, approverIds);
      
      // Обновляем список документов
      await fetchDocuments();
    } catch (error) {
      console.error('Ошибка отправки на согласование:', error);
      throw error;
    }
  };

  const canApprove = (document: Document): boolean => {
    if (!currentUser || !document.approvals) return false;
    
    return document.approvals.some(approval => 
      approval.approverId === currentUser.id && 
      approval.status === 'PENDING'
    );
  };

  const canSendForApproval = (document: Document): boolean => {
    if (!currentUser) return false;
    
    return document.status === 'DRAFT' && 
           (document.createdById === currentUser.id || 
            document.responsibleId === currentUser.id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Электронный документооборот
          </h1>
          <p className="text-gray-600 mt-1">
            Управление документами и процессами согласования
          </p>
        </div>
        <PermissionGuard module="edo" action="create">
          <button
            onClick={handleCreateDocument}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Создать документ
          </button>
        </PermissionGuard>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего документов</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Черновики</p>
              <p className="text-2xl font-bold text-gray-500">{stats.draft}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">На согласовании</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Согласованы</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Отклонены</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Поиск по названию или номеру документа..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все статусы</option>
              <option value="DRAFT">Черновик</option>
              <option value="IN_PROGRESS">На согласовании</option>
              <option value="APPROVED">Согласован</option>
              <option value="REJECTED">Отклонен</option>
              <option value="COMPLETED">Завершен</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все типы</option>
              <option value="STUDENT_CERTIFICATE">Справка об обучении</option>
              <option value="ADMINISTRATIVE_ORDER">Административный приказ</option>
              <option value="FINANCIAL_CONTRACT">Финансовый договор</option>
              <option value="ENROLLMENT_ORDER">Приказ о зачислении</option>
              <option value="ACADEMIC_TRANSCRIPT">Академическая справка</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список документов */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Документы</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Загрузка документов...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Документы не найдены</p>
            <PermissionGuard module="edo" action="create">
              <button
                onClick={handleCreateDocument}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Создать первый документ
              </button>
            </PermissionGuard>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {documents.map((document) => (
              <DocumentStatusCard
                key={document.id}
                document={document}
                onView={() => handleDocumentClick(document.id)}
                onApprove={() => handleQuickApprove(document)}
                onSendForApproval={() => handleSendForApproval(document)}
                canApprove={canApprove(document)}
                canSendForApproval={canSendForApproval(document)}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно быстрого согласования */}
      <QuickApprovalModal
        document={selectedDocument}
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Модальное окно отправки на согласование */}
      <SendForApprovalModal
        document={selectedDocument}
        isOpen={showSendForApprovalModal}
        onClose={() => setShowSendForApprovalModal(false)}
        onSend={handleSendDocument}
      />
    </div>
  );
};

export default EdoPage;
