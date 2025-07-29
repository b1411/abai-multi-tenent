import React from 'react';

interface TimeAgoProps {
  date: string;
  className?: string;
}

const TimeAgo: React.FC<TimeAgoProps> = ({ date, className = '' }) => {
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'только что';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} мин назад`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ч назад`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} дн назад`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} нед назад`;
    }

    // For older posts, show the actual date
    return postDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <time 
      dateTime={date}
      className={`text-gray-500 ${className}`}
      title={new Date(date).toLocaleString('ru-RU')}
    >
      {formatTimeAgo(date)}
    </time>
  );
};

export default TimeAgo;
