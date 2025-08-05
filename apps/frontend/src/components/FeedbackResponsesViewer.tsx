import React, { useState, useEffect } from 'react';
import { feedbackService, FeedbackTemplate } from '../services/feedbackService';

interface AnonymizedResponse {
  id: number;
  anonymousId: string;
  role: string;
  template: string;
  answers: any;
  period: string;
  submittedAt: string;
  templateQuestions: any[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const FeedbackResponsesViewer: React.FC = () => {
  const [responses, setResponses] = useState<AnonymizedResponse[]>([]);
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [expandedResponse, setExpandedResponse] = useState<number | null>(null);

  useEffect(() => {
    loadTemplates();
    loadResponses();
  }, []);

  useEffect(() => {
    loadResponses();
  }, [pagination.page, selectedTemplate, selectedPeriod]);

  const loadTemplates = async () => {
    try {
      const templatesData = await feedbackService.getAllTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
    }
  };

  const loadResponses = async () => {
    setLoading(true);
    try {
      const data = await feedbackService.getAnonymizedResponses({
        templateId: selectedTemplate,
        period: selectedPeriod || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setResponses(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки ответов:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAnswer = (question: any, answer: any) => {
    if (answer === null || answer === undefined) {
      return '—';
    }

    switch (question.type) {
      case 'RATING_1_5':
        return `${answer}/5`;
      case 'RATING_1_10':
        return `${answer}/10`;
      case 'EMOTIONAL_SCALE':
        return `${answer}%`;
      case 'YES_NO':
        return answer ? 'Да' : 'Нет';
      case 'TEXT':
        return answer || '—';
      case 'TEACHER_RATING':
        if (typeof answer === 'object') {
          return Object.entries(answer)
            .map(([teacherId, rating]) => `Преподаватель ${teacherId}: ${rating}/5`)
            .join(', ');
        }
        return answer.toString();
      default:
        return answer.toString();
    }
  };

  const getRatingColor = (question: any, answer: any) => {
    if (question.type === 'RATING_1_5') {
      if (answer >= 4) return 'text-green-600';
      if (answer >= 3) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (question.type === 'EMOTIONAL_SCALE') {
      if (answer >= 70) return 'text-green-600';
      if (answer >= 40) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-700';
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId ? parseInt(templateId) : undefined);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleExpanded = (responseId: number) => {
    setExpandedResponse(expandedResponse === responseId ? null : responseId);
  };

  const getPeriodOptions = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const periods = [];
    
    for (let year = currentYear; year >= currentYear - 1; year--) {
      const maxMonth = year === currentYear ? currentMonth : 12;
      for (let month = maxMonth; month >= 1; month--) {
        const periodString = `${year}-${month.toString().padStart(2, '0')}`;
        periods.push({
          value: periodString,
          label: `${getMonthName(month)} ${year}`,
        });
      }
    }
    
    return periods;
  };

  const getMonthName = (month: number) => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[month - 1];
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Анонимизированные ответы студентов
        </h2>
        
        {/* Фильтры */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Шаблон формы
            </label>
            <select
              value={selectedTemplate || ''}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все шаблоны</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Период
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все периоды</option>
              {getPeriodOptions().map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Список ответов */}
          <div className="space-y-4">
            {responses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Ответы не найдены
              </div>
            ) : (
              responses.map((response) => (
                <div
                  key={response.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {response.anonymousId}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {response.template} • {response.role} • {response.period}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(response.submittedAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleExpanded(response.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        {expandedResponse === response.id ? 'Скрыть' : 'Показать ответы'}
                      </button>
                    </div>
                  </div>
                  
                  {expandedResponse === response.id && (
                    <div className="p-4">
                      <div className="grid gap-4">
                        {response.templateQuestions.map((question, index) => {
                          const answer = response.answers[question.id];
                          if (answer === undefined || answer === null) return null;
                          
                          return (
                            <div key={question.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-800 flex-1 pr-4">
                                  {index + 1}. {question.question}
                                </h4>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {question.category}
                                </span>
                              </div>
                              <p className={`text-lg ${getRatingColor(question, answer)}`}>
                                {formatAnswer(question, answer)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Показано {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} ответов
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Назад
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        pagination.page === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Далее
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeedbackResponsesViewer;
