import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RealtimeChat from './RealtimeChat';

export default function RealtimeChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Управление скроллом и focus
  useEffect(() => {
    if (isOpen) {
      // Сохраняем текущий активный элемент
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Блокируем скролл body
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Предотвращаем скачок контента

      // Фокусируемся на модалке
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Восстанавливаем скролл body
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      // Возвращаем фокус на предыдущий элемент
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Обработка Escape для закрытия модалки
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  }, []);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Оверлей */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleChat}
          />

          {/* Модальное окно с чатом */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
            onClick={handleOverlayClick}
          >
            <motion.div
              ref={modalRef}
              className="relative w-full h-full max-w-7xl max-h-[95vh] overflow-y-scroll sm:max-h-[90vh] bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
              initial={{
                scale: 0.8,
                opacity: 0,
                y: 50
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
                y: 50
              }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.4
              }}
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-modal-title"
            >
              {/* Заголовок модалки */}
              <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-6 border-b border-white/10 bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <motion.div
                    className="w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full shadow-lg"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7],
                      boxShadow: [
                        '0 0 10px rgba(34, 197, 94, 0.3)',
                        '0 0 20px rgba(34, 197, 94, 0.6)',
                        '0 0 10px rgba(34, 197, 94, 0.3)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <h2
                    id="chat-modal-title"
                    className="text-lg sm:text-2xl font-bold text-white"
                  >
                    Abai AI Голосовой Чат
                  </h2>
                  <span className="text-xs sm:text-sm text-green-300 bg-green-400/10 px-2 sm:px-3 py-1 rounded-full border border-green-400/20">
                    Онлайн
                  </span>
                </div>

                <motion.button
                  onClick={toggleChat}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-400/40 flex items-center justify-center text-white hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Закрыть чат"
                >
                  <span className="text-sm sm:text-base">✕</span>
                </motion.button>
              </div>

              {/* Контент чата - занимает оставшееся место */}
              <div className="flex-1 min-h-0 bg-gradient-to-b from-slate-900/50 to-slate-800/50">
                <RealtimeChat />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Кнопка в правом нижнем углу */}
      <motion.button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg overflow-hidden focus:outline-none focus:ring-4 focus:ring-purple-500/50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(124, 58, 237, 0.5)',
            '0 0 30px rgba(236, 72, 153, 0.7)',
            '0 0 20px rgba(124, 58, 237, 0.5)',
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        aria-label={isOpen ? "Закрыть чат" : "Открыть чат"}
      >
        {/* Градиентный фон кнопки */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'linear-gradient(45deg, #7c3aed, #ec4899)',
              'linear-gradient(135deg, #ec4899, #f59e0b)',
              'linear-gradient(225deg, #f59e0b, #06b6d4)',
              'linear-gradient(315deg, #06b6d4, #7c3aed)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Иконка */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-white text-lg sm:text-2xl"
          >
            {isOpen ? '✕' : '💬'}
          </motion.div>
        </div>

        {/* Пульсирующий эффект */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3), transparent)',
          }}
        />
      </motion.button>

      {/* Модальное окно через Portal */}
      {mounted && typeof document !== 'undefined' &&
        createPortal(modalContent, document.body)
      }
    </>
  );
}
