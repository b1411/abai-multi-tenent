import React, { useState } from 'react';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Share2, 
  Eye,
  Clock,
  Users,
  Calendar,
  MapPin,
  X
} from 'lucide-react';
import { Event } from '../../../types/jasLife';
import { generateMockQRCode } from '../../../data/mockJasLifeData';

interface QRGeneratorProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ event, isOpen, onClose }) => {
  const [qrSize, setQrSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [includeEventInfo, setIncludeEventInfo] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrDataUrl = generateMockQRCode(event.qrCode);
  const checkInUrl = `${window.location.origin}/jas-life/checkin/${event.qrCode}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(checkInUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-code-${event.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR-код: ${event.title}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif; 
                text-align: center;
              }
              .qr-container { 
                max-width: 400px; 
                margin: 0 auto; 
                border: 2px dashed #ccc; 
                padding: 20px; 
                border-radius: 10px;
              }
              .qr-code { 
                max-width: 100%; 
                height: auto; 
                margin: 20px 0;
              }
              .event-info { 
                text-align: left; 
                margin-top: 20px; 
                font-size: 14px;
              }
              .event-title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 10px; 
                text-align: center;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="event-title">${event.title}</div>
              <img src="${qrDataUrl}" alt="QR-код" class="qr-code" />
              ${includeEventInfo ? `
                <div class="event-info">
                  <div><strong>Дата:</strong> ${event.date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</div>
                  <div><strong>Место:</strong> ${event.location}</div>
                  <div><strong>Организатор:</strong> ${event.organizer.name}</div>
                  <div><strong>Для регистрации отсканируйте QR-код</strong></div>
                </div>
              ` : ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getSizeClass = () => {
    switch (qrSize) {
      case 'small': return 'w-32 h-32';
      case 'medium': return 'w-48 h-48';
      case 'large': return 'w-64 h-64';
      default: return 'w-48 h-48';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">QR-код для регистрации</h2>
              <p className="text-sm text-gray-600">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Event Summary */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" />
                <span>{event.date.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-600" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span>{event.currentParticipants} участников</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-600" />
                <span>+{event.volunteerHours} часов</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Code Preview */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Предварительный просмотр</h3>
              
              {/* QR Code Display */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 mb-4">
                <img
                  src={qrDataUrl}
                  alt="QR-код"
                  className={`${getSizeClass()} mx-auto bg-white rounded-lg shadow-sm`}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Отсканируйте для регистрации
                </p>
              </div>

              {/* Size Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Размер QR-кода
                </label>
                <div className="flex gap-2 justify-center">
                  {[
                    { value: 'small', label: 'S' },
                    { value: 'medium', label: 'M' },
                    { value: 'large', label: 'L' }
                  ].map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setQrSize(size.value as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        qrSize === size.value
                          ? 'bg-violet-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include Event Info Toggle */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="includeEventInfo"
                  checked={includeEventInfo}
                  onChange={(e) => setIncludeEventInfo(e.target.checked)}
                  className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                />
                <label htmlFor="includeEventInfo" className="text-sm text-gray-700">
                  Включить информацию о событии
                </label>
              </div>
            </div>

            {/* Actions and Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Действия</h3>
              
              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleDownloadQR}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4" />
                  Скачать PNG
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-violet-200 text-violet-700 rounded-xl hover:bg-violet-50 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Печать
                </button>

                <button
                  onClick={handleCopyUrl}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Скопировано!' : 'Копировать ссылку'}
                </button>
              </div>

              {/* URL Display */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка для регистрации
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <code className="text-xs text-gray-600 break-all">
                    {checkInUrl}
                  </code>
                </div>
              </div>

              {/* Statistics Preview */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Статистика сканирований
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-gray-600">Сканирований</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">0</div>
                    <div className="text-gray-600">Регистраций</div>
                  </div>
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  📱 Инструкция по использованию
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Разместите QR-код на афише или входе</li>
                  <li>• Участники сканируют код своим телефоном</li>
                  <li>• Система автоматически регистрирует присутствие</li>
                  <li>• Волонтерские часы начисляются автоматически</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-b-2xl">
          <div className="text-xs text-gray-500">
            QR-код действителен до {event.date.toLocaleDateString('ru-RU')}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Закрыть
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Поделиться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
