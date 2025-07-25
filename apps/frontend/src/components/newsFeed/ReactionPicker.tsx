import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionType } from '../../types/newsFeed';

interface ReactionPickerProps {
  onReaction: (type: ReactionType) => void;
  currentReaction?: ReactionType;
  isOpen: boolean;
  onClose: () => void;
}

const reactionConfig = {
  LIKE: { emoji: '❤️', label: 'Нравится', color: 'text-red-500' },
  LOVE: { emoji: '😍', label: 'Обожаю', color: 'text-pink-500' },
  LAUGH: { emoji: '😂', label: 'Смешно', color: 'text-yellow-500' },
  WOW: { emoji: '😮', label: 'Вау', color: 'text-blue-500' },
  SAD: { emoji: '😢', label: 'Грустно', color: 'text-gray-500' },
  ANGRY: { emoji: '😡', label: 'Злит', color: 'text-orange-500' }
};

const ReactionPicker: React.FC<ReactionPickerProps> = ({ 
  onReaction, 
  currentReaction, 
  isOpen, 
  onClose 
}) => {
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

  const handleReactionClick = (type: ReactionType) => {
    onReaction(type);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          {/* Reaction picker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.3 }}
            className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-gray-200 px-2 md:px-3 py-2 z-50"
          >
            <div className="flex items-center space-x-1 md:space-x-2">
              {Object.entries(reactionConfig).map(([type, config]) => (
                <motion.button
                  key={type}
                  onClick={() => handleReactionClick(type as ReactionType)}
                  onMouseEnter={() => setHoveredReaction(type as ReactionType)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  onTouchStart={() => setHoveredReaction(type as ReactionType)}
                  onTouchEnd={() => setHoveredReaction(null)}
                  className={`relative text-xl md:text-2xl hover:scale-125 transition-transform duration-200 p-1 md:p-0 ${
                    currentReaction === type ? 'scale-110' : ''
                  }`}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {config.emoji}
                  
                  {/* Tooltip */}
                  <AnimatePresence>
                    {hoveredReaction === type && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                      >
                        {config.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export { reactionConfig };
export default ReactionPicker;
