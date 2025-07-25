import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing = false,
  className = ''
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const pullThreshold = 80;
  const maxPullDistance = 120;

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY > 0) return;
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY > 0 || !startY) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, maxPullDistance);
      setPullDistance(distance);
      setIsPulling(distance > pullThreshold);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > pullThreshold && !refreshing) {
      await onRefresh();
    }
    
    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pullDistance, refreshing]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull to refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 z-10"
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: pullDistance,
          opacity: pullDistance > 20 ? 1 : 0
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="flex flex-col items-center py-4">
          <motion.div
            animate={{
              rotate: refreshing ? 360 : isPulling ? 180 : 0,
              scale: isPulling ? 1.2 : 1
            }}
            transition={{
              rotate: refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0.3 },
              scale: { duration: 0.3 }
            }}
          >
            <RefreshCw className={`w-6 h-6 ${isPulling ? 'text-blue-600' : 'text-gray-400'}`} />
          </motion.div>
          <motion.p
            className={`text-sm mt-2 ${isPulling ? 'text-blue-600' : 'text-gray-500'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: pullDistance > 40 ? 1 : 0 }}
          >
            {refreshing 
              ? 'Обновляем...' 
              : isPulling 
                ? 'Отпустите для обновления' 
                : 'Потяните для обновления'
            }
          </motion.p>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{
          y: pullDistance,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
