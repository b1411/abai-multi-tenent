import React from 'react';
import { Widget } from '../../../types/widget';
import { Bell, Calendar, Users, ExternalLink } from 'lucide-react';

interface NewsWidgetProps {
  data: any;
  widget: Widget;
}

const NewsWidget: React.FC<NewsWidgetProps> = ({ data, widget }) => {
  // Mock data structure for news
  const mockData = {
    news: [
      {
        id: 1,
        title: 'Объявление о зимних каникулах',
        summary: 'Информация о расписании каникул и важных датах',
        date: '2025-01-27',
        author: 'Администрация',
        category: 'announcement',
        priority: 'high'
      },
      {
        id: 2,
        title: 'Новые курсы по программированию',
        summary: 'Открыта запись на дополнительные курсы Python и JavaScript',
        date: '2025-01-26',
        author: 'Кенесарова А.М.',
        category: 'education',
        priority: 'medium'
      },
      {
        id: 3,
        title: 'Спортивные соревнования',
        summary: 'Межшкольные соревнования по баскетболу в следующем месяце',
        date: '2025-01-25',
        author: 'Спортивный отдел',
        category: 'sports',
        priority: 'medium'
      },
      {
        id: 4,
        title: 'Родительское собрание',
        summary: 'Приглашаем всех родителей на общее собрание',
        date: '2025-01-24',
        author: 'Классные руководители',
        category: 'meeting',
        priority: 'high'
      },
      {
        id: 5,
        title: 'Изменения в расписании',
        summary: 'Временные изменения в расписании на следующую неделю',
        date: '2025-01-23',
        author: 'Учебная часть',
        category: 'schedule',
        priority: 'low'
      }
    ]
  };

  const news = data?.news || mockData.news;

  if (news.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Пока нет новостей</p>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement':
        return <Bell className="h-4 w-4 text-blue-600" />;
      case 'education':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'sports':
        return <ExternalLink className="h-4 w-4 text-orange-600" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'schedule':
        return <Calendar className="h-4 w-4 text-indigo-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'education':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'sports':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'meeting':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'schedule':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'announcement':
        return 'Объявление';
      case 'education':
        return 'Образование';
      case 'sports':
        return 'Спорт';
      case 'meeting':
        return 'Собрание';
      case 'schedule':
        return 'Расписание';
      default:
        return 'Новости';
    }
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* News list */}
        <div className="flex-1 overflow-auto space-y-2">
          {news.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((newsItem: any) => (
            <div
              key={newsItem.id}
              className={`p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 border-l-4 ${getPriorityColor(newsItem.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(newsItem.category)}
                  <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(newsItem.category)}`}>
                    {getCategoryName(newsItem.category)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(newsItem.date).toLocaleDateString('ru-RU')}
                </div>
              </div>
              
              <div className="mb-2">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                  {newsItem.title}
                </h4>
                {widget.size !== 'small' && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {newsItem.summary}
                  </p>
                )}
              </div>
              
              {newsItem.author && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 truncate">
                    {newsItem.author}
                  </div>
                  {newsItem.priority === 'high' && (
                    <div className="text-xs font-medium text-red-600">
                      Важно
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {news.length > (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {news.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} новостей
            </div>
          </div>
        )}

        {/* Demo indicator */}
        <div className="mt-2 flex justify-end">
          <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            Demo
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsWidget;
