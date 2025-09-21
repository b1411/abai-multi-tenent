import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Post, ReactionType } from '../../types/newsFeed';
import UserAvatar from './UserAvatar';
import TimeAgo from './TimeAgo';
import LikeButton from './LikeButton';
import CommentThread from './CommentThread';
import FilePreview from './FilePreview';
import { useAuth } from '../../hooks/useAuth';

interface PostCardProps {
  post: Post;
  onReaction: (postId: string, type: ReactionType) => void;
  onRemoveReaction: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  editPost?: (postId: string, data: Partial<Post>) => void;
  deletePost?: (postId: string) => void;
  currentUserId?: string;
  className?: string;
  onToggleComments?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onReaction,
  onRemoveReaction,
  onAddComment,
  editPost,
  deletePost,
  currentUserId, // Mock current user ID
  className = '',
  onToggleComments
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState(post.visibility ?? 'ALL');
  const { user } = useAuth();

  currentUserId = user?.id.toString();

  // Find current user's reaction
  const currentUserReaction = post.reactions.find(
    r => r.userId === currentUserId
  )?.type;

  const handleReaction = (type: ReactionType) => {
    if (currentUserReaction === type) {
      onRemoveReaction(post.id);
    } else {
      onReaction(post.id, type);
    }
  };

  const handleRemoveReaction = () => {
    onRemoveReaction(post.id);
  };

  const handleAddComment = (content: string) => {
    onAddComment(post.id, content);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {/* Post header */}
      <div className="p-3 md:p-6">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
            <UserAvatar user={post.author} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {post.author.name} {post.author.surname}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {post.author.role}
                </span>
              </div>
              <TimeAgo date={post.createdAt} className="text-xs" />
            </div>
          </div>

          {/* Post menu */}
          <div className="relative flex-shrink-0">
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-10"
              >
                <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Пожаловаться
                </button>
                {post.author.id === currentUserId && (
                  <>
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Редактировать
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      onClick={() => {
                        if (typeof deletePost === 'function' && window.confirm('Удалить пост?')) {
                          deletePost(post.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Удалить
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Post content */}
        <div className="mb-3 md:mb-4">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full border rounded-lg p-2 text-sm"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={3}
              />
              <div className="mt-2">
                <label className="text-xs text-gray-500 mr-2">Видимость:</label>
                <select
                  value={editVisibility}
                  onChange={e => setEditVisibility(e.target.value as 'ALL' | 'ADMIN' | 'PARENT')}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="ALL">Все</option>
                  <option value="ADMIN">Только админы</option>
                  <option value="PARENT">Только родители</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-1 rounded bg-blue-500 text-white text-sm"
                  onClick={() => {
                    setIsEditing(false);
                    if ((editContent !== post.content || editVisibility !== post.visibility) && typeof editPost === 'function') {
                      editPost(post.id, { content: editContent, visibility: editVisibility });
                    }
                  }}
                >
                  Сохранить
                </button>
                <button
                  className="px-4 py-1 rounded bg-gray-200 text-gray-700 text-sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(post.content);
                    setEditVisibility(post.visibility ?? 'ALL');
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {post.content}
            </p>
          )}
        </div>

        {/* Media attachments */}
        {(post.images.length > 0 || post.files.length > 0) && (
          <div className="mb-3 md:mb-4">
            <FilePreview
              images={
                Array.isArray(post.images) && typeof post.images[0] === 'string'
                  ? post.images.map((url, idx) => ({
                      id: idx.toString(),
                      imageUrl: url,
                      fileName: url.split('/').pop() || `image_${idx + 1}`
                    }))
                  : (post.images as any[]).map((img, idx) => ({
                      id: img.id?.toString() || idx.toString(),
                      imageUrl: img.imageUrl || img.url || '',
                      fileName: img.fileName
                        ? img.fileName
                        : typeof img.imageUrl === 'string'
                          ? img.imageUrl.split('/').pop() || `image_${idx + 1}`
                          : `image_${idx + 1}`
                    }))
              }
              files={post.files.map(f => ({
                id: f.id,
                fileUrl: (f as any).url ?? f.fileUrl,
                fileName: (f as any).name ? (f as any).name.split('/').pop() : f.fileName,
                fileType: (f as any).name ? (f as any).name.split('.').pop() : f.fileType
              }))}
            />
          </div>
        )}

        {/* Post actions */}
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3 md:space-x-4">
            <LikeButton
              reactions={post.reactions}
              currentUserReaction={currentUserReaction}
              onReaction={handleReaction}
              onRemoveReaction={handleRemoveReaction}
            />

            <CommentThread
              comments={post.comments}
              isOpen={showComments}
              onToggle={onToggleComments ? onToggleComments : () => setShowComments(!showComments)}
              onAddComment={handleAddComment}
            />
            <button
              className="ml-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition"
              onClick={onToggleComments}
              type="button"
            >
              Комментарии
            </button>
          </div>

          {/* Post stats */}
          <div className="flex items-center space-x-3 md:space-x-4 text-xs text-gray-500 order-first md:order-last">
            {post._count.reactions > 0 && (
              <span>{post._count.reactions} реакций</span>
            )}
            {post._count.comments > 0 && (
              <span>{post._count.comments} комментариев</span>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.article>
  );
};

export default PostCard;
