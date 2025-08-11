import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-4 text-gray-600">Страница не найдена</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Назад
          </button>
          <Link
            to="/"
            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
