import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTools,
  FaPlus,
  FaDownload,
  FaCalendar,
  FaFileAlt,
  FaTimes
} from 'react-icons/fa';

interface ClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: {
    id: string;
    number: string;
    name: string;
    type: string;
    capacity: number;
    status: 'free' | 'occupied' | 'maintenance';
    equipment: Array<{
      name: string;
      quantity?: number;
      status: boolean;
    }>;
    responsiblePersons: Array<{
      name: string;
      role: string;
      lastCheck?: string;
    }>;
    documents: Array<{
      type: string;
      name: string;
      url: string;
    }>;
    lastUpdate: string;
  };
}

const ClassroomModal: React.FC<ClassroomModalProps> = ({ isOpen, onClose, classroom }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Здесь будет логика загрузки файла на сервер
      console.log('Загружен файл:', file.name);
    }
  };

  const handleViewSchedule = () => {
    onClose();
    navigate(`/schedule?room=${classroom.number}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {classroom.name} / №{classroom.number}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📘 Основная информация</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Тип помещения:</span>
                <span className="font-medium">{classroom.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Вместимость:</span>
                <span className="font-medium">{classroom.capacity} чел.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <span className={`font-medium ${
                  classroom.status === 'free' ? 'text-green-600' :
                  classroom.status === 'occupied' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {classroom.status === 'free' ? '🟢 Свободна' :
                   classroom.status === 'occupied' ? '🔴 Занята' :
                   '🔧 В ремонте'}
                </span>
              </div>
            </div>

            {/* Оснащение */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">⚙️ Оснащение</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                  <FaPlus className="mr-1" />
                  Добавить оборудование
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                {classroom.equipment.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="flex items-center">
                      {item.status ? (
                        <FaCheckCircle className="text-green-500 mr-2" />
                      ) : (
                        <FaTimesCircle className="text-red-500 mr-2" />
                      )}
                      {item.name} {item.quantity && `× ${item.quantity}`}
                    </span>
                  </div>
                ))}
              </div>
              <button className="mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center">
                <FaTools className="mr-1" />
                Проверка состояния
              </button>
              <button
                onClick={() => navigate('/requests/new?room=' + classroom.number)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <FaCalendar className="mr-1" />
                Забронировать
              </button>
            </div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-4">
            {/* Ответственные */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">👤 Ответственные</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {classroom.responsiblePersons.map((person, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{person.role}:</span>
                    <span className="font-medium">{person.name}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-gray-600">Последняя проверка:</span>
                  <span className="font-medium">{classroom.lastUpdate}</span>
                </div>
              </div>
            </div>

            {/* Расписание */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📅 Расписание использования</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <button
                  onClick={handleViewSchedule}
                  className="w-full text-blue-600 hover:text-blue-700 flex items-center justify-center"
                >
                  <FaCalendar className="mr-2" />
                  Посмотреть в расписании
                </button>
              </div>
            </div>

            {/* Документы */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📝 Документы</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {classroom.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{doc.name}</span>
                    <a
                      href={doc.url}
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <FaDownload className="mr-1" />
                      Скачать
                    </a>
                  </div>
                ))}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".doc,.docx,.pdf"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2 text-blue-600 hover:text-blue-700 flex items-center justify-center"
                >
                  <FaFileAlt className="mr-2" />
                  Загрузить документ
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Поддерживаемые форматы: Word (.doc, .docx), PDF
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ClassroomModal; 