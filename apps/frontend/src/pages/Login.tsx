import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { FaFaceSmile } from 'react-icons/fa6';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../hooks/useAuth';
import { LoginDto } from '../types/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFaceIDLoading] = useState(false);
  const [formData, setFormData] = useState<LoginDto>({
    email: '',
    password: '',
    rememberMe: false
  });

  // Если пользователь уже авторизован, перенаправляем его
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Анимация для формы
  const formVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.8,
        type: "spring",
        stiffness: 100
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Очищаем ошибку при изменении полей
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(formData);
      handleSuccessfulLogin();
    } catch (err: unknown) {
      let message = 'Произошла ошибка при входе';
      if (err && typeof err === 'object') {
        const e = err as { message?: string };
        if (e.message) message = e.message;
      }
      setError(message);
      setIsLoading(false);
    }
  };

  const handleFaceIDLogin = async () => {
    // Пока что заглушка для Face ID, можно добавить реальную реализацию позже
    setError('Face ID пока не реализован. Используйте обычный вход.');
  };

  // Функция для показа настроек после успешного входа
  const handleSuccessfulLogin = async () => {
    setIsSuccess(true);
    
    setTimeout(() => {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md relative z-10">
        {/* Логотип */}
        <div className="flex justify-center mb-8">
          <motion.img
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 100,
              damping: 10
            }}
            src="/logo rfm.png"
            alt="РФМШ Logo"
            className="w-32 h-32 object-contain"
          />
        </div>

        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 md:p-8 relative border-2 border-[#ca181f]/20"
        >
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl z-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="bg-[#ca181f] text-white rounded-full p-4"
                >
                  <FaCheck className="w-8 h-8" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <h2 className="text-2xl font-semibold text-center mb-2 text-[#ca181f]">Добро пожаловать</h2>
          <p className="text-gray-600 text-center mb-8">Войдите в свою учетную запись, чтобы продолжить</p>

          {/* Кнопка входа через Face ID */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFaceIDLogin}
            disabled={isFaceIDLoading}
            className={`w-full flex items-center justify-center py-2 px-4 mb-6 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ca181f] ${isFaceIDLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isFaceIDLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-[#ca181f] border-t-transparent rounded-full mr-2"
              />
            ) : (
              <FaFaceSmile className="w-5 h-5 mr-2 text-[#ca181f]" />
            )}
            {isFaceIDLoading ? 'Аутентификация...' : 'Войти через Face ID'}
          </motion.button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или</span>
            </div>
          </div>

          {/* Показ ошибки */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center"
            >
              <FaExclamationTriangle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </motion.div>
          )}

          {/* Форма входа */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-[#ca181f]/60" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 sm:py-2 text-base sm:text-sm border border-[#ca181f]/20 rounded-lg focus:ring-2 focus:ring-[#ca181f] focus:border-[#ca181f] bg-white/50 transition-all duration-200 ease-in-out hover:shadow-lg"
                  placeholder="Введите email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-[#ca181f]/60" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-10 py-3 sm:py-2 text-base sm:text-sm border border-[#ca181f]/20 rounded-lg focus:ring-2 focus:ring-[#ca181f] focus:border-[#ca181f] bg-white/50 transition-all duration-200 ease-in-out hover:shadow-lg"
                  placeholder="Введите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-[#ca181f]/60" />
                  ) : (
                    <FaEye className="h-5 w-5 text-[#ca181f]/60" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#ca181f] focus:ring-[#ca181f] border-[#ca181f]/20 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Запомнить меня
                </label>
              </div>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/forgot-password"
                className="text-sm font-medium text-[#ca181f] hover:text-[#ca181f]/80"
              >
                Забыли пароль?
              </motion.a>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 sm:py-2 px-4 text-base sm:text-sm border border-transparent rounded-lg shadow-sm font-medium text-white bg-[#ca181f] hover:bg-[#ca181f]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ca181f] transition-all duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Войти'
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center text-sm text-[#ca181f]/70"
        >
          Copyright © 2024 - РФМШ
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-2 text-center text-sm text-[#ca181f]/70"
        >
          Powered by AB.AI
        </motion.p>
      </div>

    </div>
  );
};

export default Login;
