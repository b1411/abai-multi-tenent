import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  user: {
    name: string;
    surname?: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const initials = `${user.name?.[0] || ''}${user.surname?.[0] || ''}`;

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={`${user.name} ${user.surname || ''}`}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-gray-200 ${className}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextSibling) {
            (target.nextSibling as HTMLElement).style.display = 'flex';
          }
        }}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium ring-2 ring-gray-200 ${className}`}>
      {initials || <User className="w-1/2 h-1/2" />}
    </div>
  );
};

export default UserAvatar;
