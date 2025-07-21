import React, { useState } from 'react';
import { FaTimes, FaCheck, FaTruck, FaHistory, FaComments, FaFileAlt } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedCost: string;
  files: File[];
}

interface CreateModalProps extends ModalProps {
  onSubmit: (data: FormData) => void;
}

interface ViewModalProps extends ModalProps {
  request: any;
}

export const CreateRequestModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    priority: 'Средний',
    estimatedCost: '',
    files: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Создание заявки на снабжение</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex gap-4 mb-6">
            <div className={`flex-1 ${activeStep === 1 ? '' : 'opacity-50'}`}>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                  1
                </div>
                <div className="mt-2">Основная информация</div>
              </div>
            </div>
            <div className={`flex-1 ${activeStep === 2 ? '' : 'opacity-50'}`}>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                  2
                </div>
                <div className="mt-2">Детали и бюджет</div>
              </div>
            </div>
            <div className={`flex-1 ${activeStep === 3 ? '' : 'opacity-50'}`}>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                  3
                </div>
                <div className="mt-2">Подтверждение</div>
              </div>
            </div>
          </div>

          {activeStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Название</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1">Описание</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1">Категория</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Выберите категорию</option>
                  <option value="office">Офисные принадлежности</option>
                  <option value="tech">Техника</option>
                  <option value="furniture">Мебель</option>
                </select>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Приоритет</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Низкий">Низкий</option>
                  <option value="Средний">Средний</option>
                  <option value="Высокий">Высокий</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Предполагаемая стоимость</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1">Прикрепить файлы</label>
                <input
                  type="file"
                  multiple
                  className="w-full p-2 border rounded"
                  onChange={(e) => setFormData({ ...formData, files: Array.from(e.target.files || []) })}
                />
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold">Проверьте введенные данные</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold">Название</div>
                    <div>{formData.title}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Категория</div>
                    <div>{formData.category}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Приоритет</div>
                    <div>{formData.priority}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Стоимость</div>
                    <div>{formData.estimatedCost} ₽</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-semibold">Описание</div>
                  <div>{formData.description}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Назад
              </button>
            )}
            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto"
              >
                Далее
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-auto"
              >
                Создать заявку
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const ViewRequestModal: React.FC<ViewModalProps> = ({ isOpen, onClose, request }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments'>('details');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Просмотр заявки #{request.id}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4 border-b mb-6">
            <button
              className={`px-4 py-2 flex items-center gap-2 ${
                activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-500' : ''
              }`}
              onClick={() => setActiveTab('details')}
            >
              <FaFileAlt /> Детали
            </button>
            <button
              className={`px-4 py-2 flex items-center gap-2 ${
                activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-500' : ''
              }`}
              onClick={() => setActiveTab('history')}
            >
              <FaHistory /> История
            </button>
            <button
              className={`px-4 py-2 flex items-center gap-2 ${
                activeTab === 'comments' ? 'border-b-2 border-blue-500 text-blue-500' : ''
              }`}
              onClick={() => setActiveTab('comments')}
            >
              <FaComments /> Комментарии
            </button>
          </div>

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-4">Основная информация</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500">Статус:</span>
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        {request.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Приоритет:</span>
                      <span className="ml-2">{request.priority}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Категория:</span>
                      <span className="ml-2">{request.category}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-4">Финансы</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500">Предполагаемая стоимость:</span>
                      <span className="ml-2">{request.estimatedCost} ₽</span>
                    </div>
                    {request.actualCost && (
                      <div>
                        <span className="text-gray-500">Фактическая стоимость:</span>
                        <span className="ml-2">{request.actualCost} ₽</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Описание</h3>
                <p className="text-gray-700">{request.description}</p>
              </div>

              <div>
                <h3 className="font-bold mb-4">Цепочка согласования</h3>
                <div className="space-y-4">
                  {request.approvalChain.map((step: any, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{step.approver}</div>
                        <div className="text-sm text-gray-500">
                          {step.status === 'Ожидает' ? 'Ожидает рассмотрения' : `${step.status} ${step.date}`}
                        </div>
                      </div>
                      {step.status === 'Одобрено' && <FaCheck className="text-green-500" />}
                      {step.status === 'Отклонено' && <FaTimes className="text-red-500" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {request.movements?.map((movement: any, index: number) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {movement.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.user} • {new Date(movement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="mb-4">
                <textarea
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="Добавить комментарий..."
                />
                <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Отправить
                </button>
              </div>
              {request.comments?.map((comment: any, index: number) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{comment.user}</p>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 