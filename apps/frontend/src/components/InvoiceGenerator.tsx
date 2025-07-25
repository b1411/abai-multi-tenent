import React, { useState } from 'react';
import { 
  FaFilePdf, 
  FaFileCode, 
  FaCalendarAlt, 
  FaQrcode, 
  FaStickyNote,
  FaTimes,
  FaDownload,
  FaSpinner
} from 'react-icons/fa';
import paymentsService, { InvoiceOptions } from '../services/paymentsService';

interface InvoiceGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId?: string;
  studentId?: string;
  mode: 'single' | 'summary';
  studentName?: string;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  isOpen,
  onClose,
  paymentId,
  studentId,
  mode,
  studentName
}) => {
  const [options, setOptions] = useState<Required<InvoiceOptions>>({
    type: mode === 'summary' ? 'summary' : 'payment',
    format: 'pdf',
    startDate: '',
    endDate: '',
    notes: '',
    includeQrCode: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (key: keyof Required<InvoiceOptions>, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = async () => {
    if (mode === 'single' && !paymentId) {
      setError('Не указан ID платежа');
      return;
    }

    if (mode === 'summary' && !studentId) {
      setError('Не указан ID студента');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let blob: Blob;
      let filename: string;

      if (mode === 'single' && paymentId) {
        blob = await paymentsService.generateInvoice(paymentId, options);
        filename = `invoice_${paymentId}_${Date.now()}.${options.format}`;
      } else if (mode === 'summary' && studentId) {
        blob = await paymentsService.generateSummaryInvoice(studentId, options);
        filename = `summary_invoice_${studentId}_${Date.now()}.${options.format}`;
      } else {
        throw new Error('Некорректные параметры');
      }

      // Скачиваем файл
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error('Ошибка при генерации квитанции:', err);
      setError('Ошибка при генерации квитанции. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'summary' ? 'Сводная квитанция' : 'Генерация квитанции'}
            </h2>
            {studentName && (
              <p className="text-blue-100 text-sm mt-1">для {studentName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Тип квитанции */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-4">
              Тип квитанции
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleOptionChange('type', 'payment')}
                className={`group relative p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                  options.type === 'payment'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
                disabled={mode === 'summary'}
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  options.type === 'payment' ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-green-100'
                }`}>
                  <FaDownload className={`text-xl ${
                    options.type === 'payment' ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'
                  }`} />
                </div>
                <div className="text-sm font-semibold mb-1">Оплата</div>
                <div className="text-xs text-gray-500">Квитанция об оплате</div>
                {options.type === 'payment' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => handleOptionChange('type', 'debt')}
                className={`group relative p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                  options.type === 'debt'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                }`}
                disabled={mode === 'summary'}
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  options.type === 'debt' ? 'bg-red-100' : 'bg-gray-100 group-hover:bg-red-100'
                }`}>
                  <FaDownload className={`text-xl ${
                    options.type === 'debt' ? 'text-red-600' : 'text-gray-500 group-hover:text-red-600'
                  }`} />
                </div>
                <div className="text-sm font-semibold mb-1">Задолженность</div>
                <div className="text-xs text-gray-500">Уведомление о долге</div>
                {options.type === 'debt' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => handleOptionChange('type', 'summary')}
                className={`group relative p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                  options.type === 'summary'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  options.type === 'summary' ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'
                }`}>
                  <FaDownload className={`text-xl ${
                    options.type === 'summary' ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                  }`} />
                </div>
                <div className="text-sm font-semibold mb-1">Сводная</div>
                <div className="text-xs text-gray-500">Общий отчет</div>
                {options.type === 'summary' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Формат */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-4">
              Формат файла
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleOptionChange('format', 'pdf')}
                className={`group relative p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                  options.format === 'pdf'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  options.format === 'pdf' ? 'bg-red-100' : 'bg-gray-100 group-hover:bg-red-100'
                }`}>
                  <FaFilePdf className={`text-xl ${
                    options.format === 'pdf' ? 'text-red-600' : 'text-gray-500 group-hover:text-red-600'
                  }`} />
                </div>
                <div className="text-sm font-semibold mb-1">PDF</div>
                <div className="text-xs text-gray-500">Готов к печати</div>
                {options.format === 'pdf' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => handleOptionChange('format', 'html')}
                className={`group relative p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                  options.format === 'html'
                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  options.format === 'html' ? 'bg-orange-100' : 'bg-gray-100 group-hover:bg-orange-100'
                }`}>
                  <FaFileCode className={`text-xl ${
                    options.format === 'html' ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'
                  }`} />
                </div>
                <div className="text-sm font-semibold mb-1">HTML</div>
                <div className="text-xs text-gray-500">Веб-просмотр</div>
                {options.format === 'html' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Период (только для сводных квитанций) */}
          {mode === 'summary' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-blue-800 mb-4 flex items-center">
                <FaCalendarAlt className="mr-2" />
                Период отчета
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-2">Дата начала</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={options.startDate}
                      onChange={(e) => handleOptionChange('startDate', e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <FaCalendarAlt className="absolute left-3 top-3.5 text-blue-400" size={14} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-2">Дата окончания</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={options.endDate}
                      onChange={(e) => handleOptionChange('endDate', e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <FaCalendarAlt className="absolute left-3 top-3.5 text-blue-400" size={14} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Оставьте поля пустыми для включения всех платежей студента
              </p>
            </div>
          )}

          {/* Дополнительные опции */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-800 mb-4">
              Дополнительные опции
            </label>
            
            {/* QR код */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <FaQrcode className="text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">QR код для оплаты</div>
                  <div className="text-xs text-gray-500">Добавить QR код для быстрой оплаты</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOptionChange('includeQrCode', !options.includeQrCode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                  options.includeQrCode ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-lg ${
                    options.includeQrCode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Примечания */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <FaStickyNote className="mr-2 text-amber-600" />
                Примечания
              </label>
              <textarea
                value={options.notes}
                onChange={(e) => handleOptionChange('notes', e.target.value)}
                placeholder="Дополнительная информация для квитанции..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Эта информация будет отображена в квитанции
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки действий - фиксированные внизу */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-b-2xl">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0 flex-1 pr-4">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              {mode === 'summary' 
                ? 'Будет создана сводная квитанция по всем платежам студента'
                : 'Будет создана квитанция для выбранного платежа'
              }
            </div>
            <div className="text-xs text-gray-500">
              Документ будет автоматически скачан после генерации
            </div>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 bg-white"
            >
              Отмена
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center shadow-lg"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Генерация...
                </>
              ) : (
                <>
                  <FaDownload className="mr-2" />
                  Сгенерировать
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
