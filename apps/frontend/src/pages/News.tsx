import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, RefreshCw, Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import { CreatePost, PostCard, SwipeGestures, PullToRefresh } from '../components/newsFeed';
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
    refreshPosts
  } = useNewsFeed();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on search query
  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.author.surname && post.author.surname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                <Newspaper className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">Новости</h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Последние новости и обновления</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 md:space-x-2">
              <motion.button
                onClick={refreshPosts}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Обновить ленту"
              >
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>

              <PermissionGuard module="news" action="create">
                <motion.button
                  onClick={() => setShowCreatePost(!showCreatePost)}
                  className="hidden sm:flex items-center space-x-2 px-3 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Новый пост</span>
                  <span className="md:hidden">Пост</span>
                </motion.button>
              </PermissionGuard>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

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
            <PermissionGuard module="news" action="create">
              <motion.button
                onClick={() => setShowCreatePost(true)}
                className="md:hidden w-full p-4 bg-white border border-gray-200 rounded-lg text-left text-gray-500 hover:bg-gray-50 transition-colors mx-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Поделитесь новостями или мыслями...
              </motion.button>
            </PermissionGuard>
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
                    disabled={false}
                    className="md:pointer-events-none"
                  >
                    <PostCard
                      post={post}
                      onReaction={addReaction}
                      onRemoveReaction={removeReaction}
                      onAddComment={addComment}
                    />
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
              <PermissionGuard module="news" action="create">
                <motion.button
                  onClick={() => setShowCreatePost(true)}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Создать первый пост
                </motion.button>
              </PermissionGuard>
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
      <PermissionGuard module="news" action="create">
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
      </PermissionGuard>
    </div>
  );
};

export default News;
