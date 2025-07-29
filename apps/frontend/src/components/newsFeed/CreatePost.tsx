import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Image, 
  Paperclip, 
  X, 
  Send, 
  Smile,
  Upload
} from 'lucide-react';
import { CreatePostData } from '../../types/newsFeed';
import UserAvatar from './UserAvatar';

interface CreatePostProps {
  onCreatePost: (data: CreatePostData) => Promise<void>;
  className?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ onCreatePost, className = '' }) => {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Image dropzone
  const imageDropzone = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setSelectedImages(prev => [...prev, ...acceptedFiles].slice(0, 5));
    }
  });

  // Files dropzone
  const fileDropzone = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    maxFiles: 3,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setSelectedFiles(prev => [...prev, ...acceptedFiles].slice(0, 3));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreatePost({
        content: content.trim(),
        images: selectedImages,
        files: selectedFiles
      });
      
      // Reset form
      setContent('');
      setSelectedImages([]);
      setSelectedFiles([]);
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const commonEmojis = ['😊', '❤️', '👍', '🎉', '🔥', '💡', '📚', '🚀', '✨', '💪'];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <form onSubmit={handleSubmit} className="p-3 md:p-6">
        {/* Header */}
        <div className="flex items-start space-x-2 md:space-x-3 mb-3 md:mb-4">
          <UserAvatar 
            user={{ 
              name: 'Вы', 
              avatar: '' 
            }} 
            size="md" 
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Поделитесь новостями или мыслями..."
              className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              rows={isExpanded ? 4 : 2}
              style={{
                minHeight: isExpanded ? '100px' : '60px',
                maxHeight: '200px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                if (isExpanded) {
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                }
              }}
            />
          </div>
        </div>

        {/* Emoji picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex flex-wrap gap-2">
                {commonEmojis.map((emoji, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => setContent(prev => prev + emoji)}
                    className="text-lg hover:scale-125 transition-transform p-1 rounded"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected images preview */}
        {selectedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 space-y-2"
          >
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between pt-3 border-t border-gray-100"
            >
              <div className="flex items-center space-x-2">
                {/* Image upload */}
                <motion.button
                  type="button"
                  onClick={() => imageDropzone.open()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Добавить изображения"
                >
                  <Image className="w-5 h-5" />
                </motion.button>

                {/* File upload */}
                <motion.button
                  type="button"
                  onClick={() => fileDropzone.open()}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Добавить файлы"
                >
                  <Paperclip className="w-5 h-5" />
                </motion.button>

                {/* Emoji picker toggle */}
                <motion.button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-lg transition-colors ${
                    showEmojiPicker 
                      ? 'text-yellow-600 bg-yellow-50' 
                      : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Добавить эмодзи"
                >
                  <Smile className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Submit button */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent('');
                    setSelectedImages([]);
                    setSelectedFiles([]);
                    setShowEmojiPicker(false);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Отмена
                </button>
                
                <motion.button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
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
                  <span>{isSubmitting ? 'Публикуем...' : 'Опубликовать'}</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Hidden file inputs */}
      <input {...imageDropzone.getInputProps()} />
      <input {...fileDropzone.getInputProps()} />
    </motion.div>
  );
};

export default CreatePost;
