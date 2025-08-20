import React, { useEffect, useState } from 'react';
import { Widget } from '../../../types/widget';
import { Star, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import widgetService from '../../../services/widgetService';
import { formatNumberShort } from '../base/numberFormat';

interface RecentGradeItem {
  subject: string;
  teacher?: string;
  date?: string;
  grade: number;
}

interface GradesData {
  averageGrade: number;
  recentGrades: RecentGradeItem[];
  trend: 'up' | 'down' | 'stable';
  gradeDistribution?: Record<string, number>;
}

interface GradesWidgetProps {
  data: GradesData | null;
  widget: Widget;
}

const GradesWidget: React.FC<GradesWidgetProps> = ({ data, widget }) => {
  const [widgetData, setWidgetData] = useState(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      loadWidgetData();
    }
  }, [data]);

  const loadWidgetData = async () => {
    try {
      setLoading(true);
      const result = await widgetService.getWidgetData('grades');
      setWidgetData(result);
    } catch (error) {
      console.error('Error loading grades data:', error);
      setWidgetData({ 
        averageGrade: 0, 
        recentGrades: [],
        trend: 'stable'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const grades = widgetData?.recentGrades || [];
  const averageGrade = widgetData?.averageGrade || 0;
  const trend = widgetData?.trend || 'stable';

  if (grades.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Star className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Пока нет оценок</p>
        </div>
      </div>
    );
  }

  const getGradeColor = (grade: number) => {
    if (grade === 5) return 'bg-green-100 text-green-800 border-green-200';
    if (grade === 4) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (grade === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BookOpen className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-700 bg-green-50 border-green-200';
    if (trend === 'down') return 'text-red-700 bg-red-50 border-red-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1 min-w-0">
        {/* Header with average grade */}
        <div className="flex items-center justify-between mb-3 min-w-0">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getTrendColor()} min-w-0`} title={`Средний балл: ${averageGrade}`}>
            {getTrendIcon()}
            <span className="text-sm font-semibold truncate">Средний балл: {averageGrade}</span>
          </div>
        </div>

        {/* Recent grades list */}
        <div className="flex-1 overflow-auto space-y-2 min-w-0">
          {grades.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((gradeItem: RecentGradeItem, index: number) => (
            <div key={index} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
              <div className="flex items-center justify-between min-w-0 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate" title={gradeItem.subject}>{gradeItem.subject}</div>
                  {gradeItem.teacher && (
                    <div className="text-xs text-gray-500 mt-1 truncate" title={gradeItem.teacher}>{gradeItem.teacher}</div>
                  )}
                  {gradeItem.date && (
                    <div className="text-xs text-gray-400 mt-1 whitespace-nowrap" title={new Date(gradeItem.date).toLocaleDateString('ru-RU')}>
                      {new Date(gradeItem.date).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
                <div className={`ml-3 px-2 py-1 rounded-full text-sm font-bold border ${getGradeColor(gradeItem.grade)} whitespace-nowrap`} title={`${gradeItem.grade}`}>
                  {gradeItem.grade}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grade distribution for large widgets */}
        {widget.size === 'large' && data?.gradeDistribution && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
            <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Распределение оценок">Распределение оценок</div>
            <div className="grid grid-cols-4 gap-2 min-w-0">
              {Object.entries(data.gradeDistribution).reverse().map(([grade, count]: [string, number]) => (
                <div key={grade} className="text-center overflow-hidden">
                  <div className={`text-sm font-bold px-2 py-1 rounded border ${getGradeColor(parseInt(grade))} whitespace-nowrap`} title={grade}>{grade}</div>
                  <div className="text-xs text-gray-500 mt-1 whitespace-nowrap" title={Number(count).toLocaleString('ru-RU')}>
                    {formatNumberShort(Number(count))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {grades.length > (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 truncate" title={`и еще ${grades.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} оценок`}>
              и еще {grades.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} оценок
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GradesWidget;
