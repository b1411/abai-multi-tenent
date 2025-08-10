import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../services/apiClient';
import AnimatedBackground from '../components/AnimatedBackground';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Недействительная ссылка для сброса пароля.');
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов.');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: unknown) {
      let message = 'Не удалось сбросить пароль. Попробуйте снова.';
      if (err && typeof err === 'object') {
        const e = err as { response?: { data?: { message?: string } } };
        if (e.response?.data?.message) message = e.response.data.message;
        else if ('message' in err) message = (err as Error).message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8"
        >
          <h1 className="text-2xl font-bold text-center text-[#ca181f] mb-2">Сброс пароля</h1>
          <p className="text-sm text-gray-600 text-center mb-6">Придумайте новый пароль для вашего аккаунта.</p>

          {success ? (
            <div className="text-center space-y-4">
              <p className="text-green-600">Пароль успешно обновлен. Перенаправляем на страницу входа...</p>
              <a href="/login" className="text-[#ca181f] hover:underline">Перейти на вход</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ca181f]"
                  placeholder="Минимум 8 символов"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Повторите пароль</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ca181f]"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 rounded-lg text-white font-medium bg-[#ca181f] hover:bg-[#b3161c] transition ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Обновление...' : 'Обновить пароль'}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
