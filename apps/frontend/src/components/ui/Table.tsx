import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  loading = false,
  sortBy,
  sortDirection,
  onSort,
  className = ''
}) => {
  const handleSort = (key: string) => {
    if (!onSort) return;
    
    const newDirection = sortBy === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.width ? column.width : ''
                } ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {column.sortable && (
                    <div className="flex flex-col">
                      <ChevronUp
                        className={`h-3 w-3 ${
                          sortBy === column.key && sortDirection === 'asc'
                            ? 'text-[#ca181f]'
                            : 'text-gray-400'
                        }`}
                      />
                      <ChevronDown
                        className={`h-3 w-3 -mt-1 ${
                          sortBy === column.key && sortDirection === 'desc'
                            ? 'text-[#ca181f]'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ca181f]"></div>
                  <span className="ml-2 text-gray-500">Загрузка...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                Нет данных
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render
                      ? column.render(record[column.key], record)
                      : record[column.key]}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
