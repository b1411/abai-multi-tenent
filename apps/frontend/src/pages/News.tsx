import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, RefreshCw, Plus, Search, Filter } from 'lucide-react';
import { CreatePost, PostCard, SwipeGestures, PullToRefresh } from '../components/newsFeed';
import CommentThread from '../components/newsFeed/CommentThread';
import { useNewsFeed } from '../hooks/useNewsFeed';

const News: React.FC = () => {
  const {
    posts,
    isLoading,
    error,
    createPost,
    addReaction,
    removeReaction,
    addComment,
    editPost,
    deletePost,
    refreshPosts
  } = useNewsFeed();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);

  useEffect(() => {
    refreshPosts();
    // eslint-disable-next-line
  }, []);

  // Filter posts based on search query
  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.author.surname && post.author.surname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 w-full">
      <div className="flex flex-col gap-2 px-3 md:px-4 py-3 md:py-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-lg md:text-2xl text-gray-900">Новости</span>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={refreshPosts}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Обновить"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Новый пост</span>
            </motion.button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">

      {/* Main content with pull to refresh */}
      <PullToRefresh onRefresh={refreshPosts} refreshing={isLoading}>
        <div className="max-w-4xl mx-auto px-2 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
          {/* Create post section */}
          <AnimatePresence>
            {showCreatePost && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CreatePost
                  onCreatePost={async (data) => {
                    await createPost(data);
                    setShowCreatePost(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile create post button */}
          {!showCreatePost && (
            <motion.button
              onClick={() => setShowCreatePost(true)}
              className="md:hidden w-full p-4 bg-white border border-gray-200 rounded-lg text-left text-gray-500 hover:bg-gray-50 transition-colors mx-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Поделитесь новостями или мыслями...
            </motion.button>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <p className="text-red-600 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Posts feed */}
          <div className="space-y-4 md:space-y-6">
            <AnimatePresence>
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SwipeGestures
                    onSwipeReaction={(type) => addReaction(post.id, type)}
                  >
                    <PostCard
                      post={post}
                      onReaction={addReaction}
                      onRemoveReaction={removeReaction}
                      onAddComment={addComment}
                      editPost={editPost}
                      deletePost={deletePost}
                      currentUserId={post.author.id}
                      className=""
                      onToggleComments={() =>
                        openCommentsPostId === post.id
                          ? setOpenCommentsPostId(null)
                          : setOpenCommentsPostId(post.id)
                      }
                    />
                    {openCommentsPostId === post.id && (
                      <CommentThread
                        comments={post.comments}
                        isOpen={true}
                        onToggle={() => setOpenCommentsPostId(null)}
                        onAddComment={(content: string) => addComment(post.id, content)}
                      />
                    )}
                  </SwipeGestures>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {filteredPosts.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Newspaper className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Ничего не найдено' : 'Пока нет постов'}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Попробуйте изменить поисковый запрос'
                  : 'Станьте первым, кто поделится новостями!'
                }
              </p>
              {!searchQuery && (
                <motion.button
                  onClick={() => setShowCreatePost(true)}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Создать первый пост
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Loading skeleton */}
          {isLoading && posts.length === 0 && (
            <div className="space-y-4 md:space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-6 animate-pulse">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Floating action button for mobile */}
      <motion.button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors md:hidden z-40 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
    </div>
  );
};

export default News;
