import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { ReactionType, Reaction } from '../../types/newsFeed';
import ReactionPicker, { reactionConfig } from './ReactionPicker';
import UserAvatar from './UserAvatar';

interface LikeButtonProps {
  reactions: Reaction[];
  currentUserReaction?: ReactionType;
  onReaction: (type: ReactionType) => void;
  onRemoveReaction: () => void;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  reactions,
  currentUserReaction,
  onReaction,
  onRemoveReaction,
  className = ''
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showReactionsList, setShowReactionsList] = useState(false);

  // Group reactions by type
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<ReactionType, number>);

  // Get the most popular reactions (up to 3)
  const topReactions = Object.entries(reactionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type as ReactionType);

  const totalReactions = reactions.length;

  const handleQuickReaction = () => {
    if (currentUserReaction) {
      onRemoveReaction();
    } else {
      onReaction('LIKE');
    }
  };

  const handleLongPress = () => {
    setShowPicker(true);
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Main reaction button */}
      <div className="relative flex items-center space-x-1">
        <motion.button
          onClick={handleQuickReaction}
          onMouseDown={(e) => {
            const timer = setTimeout(handleLongPress, 500);
            const cleanup = () => {
              clearTimeout(timer);
              document.removeEventListener('mouseup', cleanup);
            };
            document.addEventListener('mouseup', cleanup);
          }}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            currentUserReaction
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {currentUserReaction ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-lg"
            >
              {reactionConfig[currentUserReaction].emoji}
            </motion.span>
          ) : (
            <Heart className="w-4 h-4" />
          )}
          {totalReactions > 0 && (
            <span className="text-xs">{totalReactions}</span>
          )}
        </motion.button>

        <ReactionPicker
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
          onReaction={onReaction}
          currentReaction={currentUserReaction}
        />
      </div>

      {/* Reaction summary */}
      {totalReactions > 0 && (
        <div className="flex items-center space-x-1">
          {topReactions.map((type) => (
            <span key={type} className="text-base">
              {reactionConfig[type].emoji}
            </span>
          ))}
          <span className="text-xs">{totalReactions}</span>
        </div>
      )}

      {/* Reactions list modal */}
      {showReactionsList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Реакции</h3>
                <button
                  onClick={() => setShowReactionsList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-80">
              {Object.entries(reactionCounts).map(([type, count]) => (
                <div key={type} className="px-4 py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{reactionConfig[type as ReactionType].emoji}</span>
                      <span className="font-medium">{reactionConfig[type as ReactionType].label}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {reactions
                      .filter(r => r.type === type)
                      .slice(0, 6)
                      .map((reaction) => (
                        <div key={reaction.id} className="flex items-center space-x-2">
                          <UserAvatar user={reaction.user} size="sm" />
                          <span className="text-sm text-gray-700">
                            {reaction.user.name} {reaction.user.surname}
                          </span>
                        </div>
                      ))}
                    {reactions.filter(r => r.type === type).length > 6 && (
                      <span className="text-sm text-gray-500">
                        и еще {reactions.filter(r => r.type === type).length - 6}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LikeButton;
