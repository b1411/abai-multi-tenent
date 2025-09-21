// Комментарии к посту
import React, { useState } from 'react';
import { Send } from 'lucide-react';
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

  if (!isOpen) return null;

  return (
    <div className={`w-full bg-white rounded-xl shadow border border-gray-200 mt-2 ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-900 text-base">Комментарии</span>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded transition"
        >
          Закрыть
        </button>
      </div>

      {/* Список комментариев */}
      <div className="px-4 py-2 space-y-4 max-h-72 overflow-y-auto">
        {comments.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-6">Нет комментариев</div>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-3">
            <UserAvatar user={comment.author} size="sm" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">
                  {comment.author
                    ? `${comment.author.name ?? ''} ${comment.author.surname ?? ''}`.trim()
                    : 'Аноним'}
                </span>
                <TimeAgo date={comment.createdAt} className="text-xs text-gray-400" />
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800">
                {comment.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Форма добавления комментария */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50"
      >
        <UserAvatar user={{ name: 'Вы', avatar: '' }} size="sm" />
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Написать комментарий..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          maxLength={300}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default CommentThread;
