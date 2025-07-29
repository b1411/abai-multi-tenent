import React, { useState } from 'react';
import { GroupForm } from '../components/GroupForm';
import { useGroups } from '../hooks/useGroups';
import { Group } from '../types/group';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

const Groups: React.FC = () => {
  const {
    groups,
    statistics,
    loading,
    error,
    createGroup,
    deleteGroup,
  } = useGroups();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Сортировка групп по курсу и названию
  const sortedGroups = [...groups].sort((a, b) => {
    if (a.courseNumber !== b.courseNumber) {
      return a.courseNumber - b.courseNumber;
    }
    return a.name.localeCompare(b.name);
  });

  const handleCreateGroup = async (data: any) => {
    try {
      await createGroup(data);
      setShowCreateForm(false);
    } catch (error) {
      // Ошибка отображается через error state
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteGroup(id);
      setDeleteConfirm(null);
    } catch (error) {
      // Ошибка отображается через error state
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getCourseColor = (courseNumber: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[(courseNumber - 1) % colors.length];
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Заголовок и кнопка создания */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Группы</h1>
            <p className="mt-1 text-sm text-gray-600">
              Управление учебными группами и их составом
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Создать группу</span>
            <span className="sm:hidden">Создать</span>
          </button>
        </div>

        {/* Статистика */}
        {statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Всего групп
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {statistics.totalGroups}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Всего студентов
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {statistics.totalStudents}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Среднее в группе
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {Math.round(statistics.averageStudentsPerGroup)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
                    </svg>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Курсов
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {statistics.groupsByCourse.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Форма создания группы */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 w-full max-w-sm sm:max-w-md lg:max-w-lg">
              <GroupForm
                onSubmit={handleCreateGroup}
                onCancel={() => setShowCreateForm(false)}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Уведомления */}
        {error && (
          <Alert variant="error" message={error} />
        )}

        {/* Список групп */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Список групп
            </h3>
            
            {loading && (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            )}

            {!loading && sortedGroups.length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Нет групп</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Создайте первую группу для начала работы.
                </p>
              </div>
            )}

            {!loading && sortedGroups.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {sortedGroups.map((group: Group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                          {group.name}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCourseColor(group.courseNumber)} mt-1`}>
                          {group.courseNumber} курс
                        </span>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => setDeleteConfirm(group.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                          title="Удалить группу"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                      <div className="flex justify-between items-center">
                        <span>Студентов:</span>
                        <span className="font-medium">{group.studentsCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Создана:</span>
                        <span className="text-right">{formatDate(group.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Модал подтверждения удаления */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Удалить группу?
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="w-full sm:w-auto px-4 py-2 bg-white text-black border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm sm:text-base"
                    >
                      Отменить
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(deleteConfirm)}
                      disabled={loading}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 text-sm sm:text-base"
                    >
                      {loading ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Groups;
