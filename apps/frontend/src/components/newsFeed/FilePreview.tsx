import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye, 
  File,
  FileImage,
  FileSpreadsheet
} from 'lucide-react';
import { PostFile, PostImage } from '../../types/newsFeed';

interface FilePreviewProps {
  files: PostFile[];
  images: PostImage[];
  className?: string;
}

const getFileIcon = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return <FileText className="w-8 h-8 text-red-500" />;
    case 'docx':
    case 'doc':
      return <FileText className="w-8 h-8 text-blue-500" />;
    case 'xlsx':
    case 'xls':
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImage className="w-8 h-8 text-purple-500" />;
    default:
      return <File className="w-8 h-8 text-gray-500" />;
  }
};

const FilePreview: React.FC<FilePreviewProps> = ({ files, images, className = '' }) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Images */}
      {images.length > 0 && (
        <div className={`grid gap-2 ${
          images.length === 1 ? 'grid-cols-1' :
          images.length === 2 ? 'grid-cols-2' :
          images.length === 3 ? 'grid-cols-2 md:grid-cols-3' :
          'grid-cols-2'
        }`}>
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer group ${
                images.length === 3 && index === 2 ? 'col-span-2 md:col-span-1' : ''
              }`}
              onClick={() => setSelectedImage(image.imageUrl)}
            >
              <img
                src={image.imageUrl}
                alt={image.fileName}
                className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <Eye className="w-6 h-6 md:w-8 md:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(file.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                  <p className="text-xs text-gray-500 uppercase">{file.fileType}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  onClick={() => window.open(file.fileUrl, '_blank')}
                  title="Просмотреть"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 md:p-2 text-gray-400 hover:text-green-600 transition-colors"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = file.fileUrl;
                    link.download = file.fileName;
                    link.click();
                  }}
                  title="Скачать"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Image lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              ×
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
