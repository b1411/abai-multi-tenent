import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import { Comment } from '../../types/newsFeed';
import UserAvatar from './UserAvatar';
import TimeAgo from './TimeAgo';

interface CommentThreadProps {
  comments: Comment[];
  isOpen: boolean;
  onToggle: () => void;
  onAddComment: (content: string) => void;
  className?: string;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  isOpen,
  onToggle,
  onAddComment,
  className = ''
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {/* Toggle button */}
      <motion.button
        onClick={onToggle}
        className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-4 h-4" />
        <span>{comments.length > 0 ? comments.length : 'Комментировать'}</span>
      </motion.button>

      {/* Comments section */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-4 space-y-4 border-t border-gray-100 pt-4"
          >
            {/* Existing comments */}
            <div className="space-y-3">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex space-x-3"
                >
                  <UserAvatar user={comment.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author.name} {comment.author.surname}
                        </span>
                        <TimeAgo date={comment.createdAt} className="text-xs" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add comment form */}
            <motion.form
              onSubmit={handleSubmit}
              className="flex space-x-2 md:space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <UserAvatar 
                user={{ 
                  name: 'Вы', 
                  avatar: '' 
                }} 
                size="sm" 
              />
              <div className="flex-1 flex space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Напишите комментарий..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={1}
                    style={{
                      minHeight: '40px',
                      maxHeight: '120px',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="self-end p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </motion.form>

            {/* Empty state */}
            {comments.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Пока нет комментариев</p>
                <p className="text-xs">Станьте первым, кто прокомментирует!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentThread;
