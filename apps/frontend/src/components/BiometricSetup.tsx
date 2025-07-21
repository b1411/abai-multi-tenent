import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { FaFaceSmile } from 'react-icons/fa6';
import biometricService from '../services/biometricService';
import { useAuth } from '../hooks/useAuth';

interface BiometricSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

const BiometricSetup: React.FC<BiometricSetupProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const supported = biometricService.isSupported();
    setIsSupported(supported);
    
    if (supported) {
      const available = await biometricService.isBiometricAvailable();
      setIsBiometricAvailable(available);
      
      const credentials = biometricService.hasStoredCredentials();
      setHasCredentials(credentials);
    }
  };

  const handleSetupBiometric = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await biometricService.registerBiometric(
        user.email,
        `${user.name} ${user.surname}`
      );
      
      if (result) {
        setSuccess('Face ID успешно настроен!');
        setHasCredentials(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка настройки Face ID');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBiometric = () => {
    if (!user) return;
    
    biometricService.removeBiometricData(user.email);
    setHasCredentials(false);
    setSuccess('Face ID данные удалены');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Настройка Face ID</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {!isSupported && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 mr-2" />
                <span className="text-red-700">Ваш браузер не поддерживает биометрическую аутентификацию</span>
              </div>
            </div>
          )}

          {isSupported && !isBiometricAvailable && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-500 mr-2" />
                <span className="text-yellow-700">Биометрическая аутентификация недоступна на этом устройстве</span>
              </div>
            </div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center">
                <FaCheck className="text-green-500 mr-2" />
                <span className="text-green-700">{success}</span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </motion.div>
          )}

          <div className="text-center mb-6">
            <FaFaceSmile className="w-16 h-16 mx-auto mb-4 text-[#ca181f]" />
            <p className="text-gray-600 mb-2">
              {hasCredentials 
                ? 'Face ID уже настроен для вашего аккаунта' 
                : 'Настройте Face ID для быстрого входа в систему'
              }
            </p>
            <p className="text-sm text-gray-500">
              Используйте биометрическую аутентификацию для безопасного входа без пароля
            </p>
          </div>

          <div className="space-y-3">
            {isSupported && isBiometricAvailable && !hasCredentials && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSetupBiometric}
                disabled={isLoading}
                className="w-full bg-[#ca181f] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#ca181f]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Настройка...
                  </div>
                ) : (
                  'Настроить Face ID'
                )}
              </motion.button>
            )}

            {hasCredentials && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemoveBiometric}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <FaTrash className="mr-2" />
                Удалить Face ID
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Закрыть
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BiometricSetup;
