import React, { useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { ReactionType } from '../../types/newsFeed';
import { reactionConfig } from './ReactionPicker';

interface SwipeGesturesProps {
  children: React.ReactNode;
  onSwipeReaction?: (type: ReactionType) => void;
  disabled?: boolean;
  className?: string;
}

const SwipeGestures: React.FC<SwipeGesturesProps> = ({
  children,
  onSwipeReaction,
  disabled = false,
  className = ''
}) => {
  const constraintsRef = useRef(null);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !onSwipeReaction) return;

    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 500;

    // Right swipe for like
    if ((offset.x > swipeThreshold || velocity.x > velocityThreshold) && Math.abs(offset.y) < 100) {
      onSwipeReaction('LIKE');
    }
    // Left swipe for love
    else if ((offset.x < -swipeThreshold || velocity.x < -velocityThreshold) && Math.abs(offset.y) < 100) {
      onSwipeReaction('LOVE');
    }
  };

  if (disabled || !onSwipeReaction) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={constraintsRef}
      className={`relative ${className}`}
    >
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.95 }}
        className="cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
      
      {/* Swipe indicators */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-2xl opacity-20 pointer-events-none">
        ❤️
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-2xl opacity-20 pointer-events-none">
        😍
      </div>
    </motion.div>
  );
};

export default SwipeGestures;
