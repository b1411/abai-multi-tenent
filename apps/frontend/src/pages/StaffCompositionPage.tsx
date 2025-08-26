import React, { useEffect, useState, useMemo } from 'react';
import { teacherService } from '../services/teacherService';
import type { Teacher } from '../types/teacher';
import { FaSync, FaSearch, FaExchangeAlt } from 'react-icons/fa';

interface CompositionResponse {
  staff: Teacher[];
  partTime: Teacher[];
}

const StaffCompositionPage: React.FC = () => {
  const [data, setData] = useState<CompositionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [changingId, setChangingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await teacherService.getEmploymentComposition();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterList = (list: Teacher[]) =>
    list.filter(t => {
      const q = search.toLowerCase();
      return (
        t.user.name.toLowerCase().includes(q) ||
        t.user.surname.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q)
      );
    });

  const staffFiltered = useMemo(
    () => (data ? filterList(data.staff) : []),
    [data, search]
  );

  const partTimeFiltered = useMemo(
    () => (data ? filterList(data.partTime) : []),
    [data, search]
  );

  const changeType = async (teacher: Teacher) => {
    try {
      setChangingId(teacher.id);
      const target = teacher.employmentType === 'STAFF' ? 'PART_TIME' : 'STAFF';
      await teacherService.changeEmploymentType(teacher.id, target);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Ошибка смены типа занятости');
    } finally {
      setChangingId(null);
    }
  };

  // Helpers
  const formatStatus = (t: Teacher) =>
    t.employmentType === 'STAFF' ? 'Штатный' : 'Совместитель';

  const formatExperience = (t: Teacher) =>
    t.experience !== undefined && t.experience !== null ? `${t.experience} лет` : '-';

  const formatPosition = (t: Teacher) =>
    t.specialization || 'Преподаватель';

  const Table: React.FC<{ title: string; list: Teacher[]; type: 'STAFF' | 'PART_TIME' }> = ({ title, list, type }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-sm sm:text-base">{title}</h2>
        <span className="text-xs text-gray-500">Всего: {list.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="px-3 py-2 text-left font-medium">Сотрудник</th>
              <th className="px-3 py-2 text-left font-medium">Должность</th>
              <th className="px-3 py-2 text-center font-medium">Стаж</th>
              <th className="px-3 py-2 text-center font-medium">Статус</th>
              <th className="px-3 py-2 text-center font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {list.map(t => {
              const targetLabel = t.employmentType === 'STAFF' ? 'В совместители' : 'В штат';
              return (
                <tr
                  key={t.id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {t.user.surname} {t.user.name}
                    {t.user.middlename ? ' ' + t.user.middlename : ''}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatPosition(t)}
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {formatExperience(t)}
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.employmentType === 'STAFF'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {formatStatus(t)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => changeType(t)}
                      disabled={changingId === t.id}
                      title={targetLabel}
                      aria-label={targetLabel}
                      className="mx-auto flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 disabled:opacity-40 transition-colors"
                    >
                      {changingId === t.id ? (
                        <span className="animate-pulse text-gray-400">...</span>
                      ) : (
                        <FaExchangeAlt className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500 text-sm"
                >
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Кадровый состав
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Штатные сотрудники и совместители
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 sm:w-60"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Table title="Штатные сотрудники" list={staffFiltered} type="STAFF" />
            <Table title="Совместители" list={partTimeFiltered} type="PART_TIME" />
        </div>
      )}
    </div>
  );
};

export default StaffCompositionPage;
