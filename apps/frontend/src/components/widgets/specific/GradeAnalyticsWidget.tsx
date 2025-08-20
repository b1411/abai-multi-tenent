import React, { useEffect, useState } from 'react';
import { Widget } from '../../../types/widget';
import { TrendingUp, PieChart, Award, BarChart3, Users } from 'lucide-react';
import widgetService from '../../../services/widgetService';
import { formatNumberShort } from '../base/numberFormat';

interface GradeDistributionItem { grade: string; count: number; percentage: number; }
interface SubjectStat { subject: string; average: number; count: number; }
interface ClassPerformance { class: string; average: number; students: number; }
interface GradeAnalyticsData {
  averageGrade: number;
  totalGrades: number;
  trend: string;
  trendDirection: 'up' | 'down';
  gradeDistribution: GradeDistributionItem[];
  topSubjects: SubjectStat[];
  classesPerformance: ClassPerformance[];
}

interface GradeAnalyticsWidgetProps {
  data: GradeAnalyticsData | null;
  widget: Widget;
}

const GradeAnalyticsWidget: React.FC<GradeAnalyticsWidgetProps> = ({ data, widget }) => {
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
      const result = await widgetService.getWidgetData('grade-analytics');
      setWidgetData(result);
    } catch (error) {
      console.error('Error loading grade analytics data:', error);
      setWidgetData({
        averageGrade: 4.1,
        totalGrades: 1247,
        trend: '+0.15',
        trendDirection: 'up',
        gradeDistribution: [
          { grade: '5', count: 312, percentage: 25.0 },
          { grade: '4', count: 458, percentage: 36.7 },
          { grade: '3', count: 387, percentage: 31.0 },
          { grade: '2', count: 90, percentage: 7.3 }
        ],
        topSubjects: [
          { subject: 'Физкультура', average: 4.8, count: 156 },
          { subject: 'Искусство', average: 4.6, count: 142 },
          { subject: 'Математика', average: 4.2, count: 287 },
          { subject: 'История', average: 4.1, count: 198 },
          { subject: 'Физика', average: 3.9, count: 234 }
        ],
        classesPerformance: [
          { class: '10А', average: 4.5, students: 28 },
          { class: '9Б', average: 4.3, students: 26 },
          { class: '11А', average: 4.2, students: 24 },
          { class: '8В', average: 4.0, students: 29 },
          { class: '10Б', average: 3.8, students: 27 }
        ]
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

  const analytics: GradeAnalyticsData = widgetData || {
    averageGrade: 0,
    totalGrades: 0,
    trend: '0',
    trendDirection: 'up',
    gradeDistribution: [],
    topSubjects: [],
    classesPerformance: []
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '5':
        return 'bg-green-500';
      case '4':
        return 'bg-blue-500';
      case '3':
        return 'bg-yellow-500';
      case '2':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSubjectColor = (average: number) => {
    if (average >= 4.5) return 'text-green-600';
    if (average >= 4.0) return 'text-blue-600';
    if (average >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* Overall analytics header */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Аналитика оценок</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-lg font-bold text-blue-700">
                {analytics.averageGrade}
              </div>
              {analytics.trendDirection === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 text-red-600 rotate-180">
                  <TrendingUp />
                </div>
              )}
              <span className="text-xs text-green-600 font-medium">{analytics.trend}</span>
            </div>
          </div>
          <div className="text-xs text-blue-600">
              Средний балл по школе ({formatNumberShort(analytics.totalGrades)} оценок)
          </div>
        </div>

        {/* Grade distribution */}
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Распределение оценок</div>
          <div className="grid grid-cols-4 gap-2">
            {(analytics.gradeDistribution || []).map((item: GradeDistributionItem, index: number) => (
              <div key={index} className="text-center">
                <div className={`w-full h-6 ${getGradeColor(item.grade)} rounded-t-lg flex items-center justify-center text-white font-bold text-sm`}>
                  {item.grade}
                </div>
                <div className="text-xs font-bold text-gray-900 mt-1" title={item.count.toLocaleString('ru-RU')}>
                  {formatNumberShort(item.count)}
                </div>
                <div className="text-xs text-gray-500">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top subjects */}
        <div className="flex-1 overflow-auto">
          <div className="text-xs font-medium text-gray-600 mb-2">
            {widget.size === 'small' ? 'Лучшие предметы' : 'Средний балл по предметам'}
          </div>
          <div className="space-y-2">
            {(analytics.topSubjects || []).slice(0, widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 5).map((subject: SubjectStat, index: number) => (
              <div key={index} className="p-2 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                      <span className="text-xs font-bold text-gray-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {subject.subject}
                      </div>
                      {widget.size !== 'small' && (
                        <div className="text-xs text-gray-500" title={subject.count.toLocaleString('ru-RU')}>
                          {formatNumberShort(subject.count)} оценок
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getSubjectColor(subject.average)}`}>
                      {subject.average}
                    </div>
                  </div>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      subject.average >= 4.5 ? 'bg-green-500' :
                      subject.average >= 4.0 ? 'bg-blue-500' :
                      subject.average >= 3.5 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(subject.average / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Class performance for large widgets */}
        {widget.size === 'large' && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">Лучшие классы</div>
            <div className="grid grid-cols-2 gap-2">
              {(analytics.classesPerformance || []).slice(0, 4).map((classItem: ClassPerformance, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-700">{classItem.class}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-medium ${getSubjectColor(classItem.average)}`}>
                      {classItem.average}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(analytics.topSubjects || []).length > (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 5) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {(analytics.topSubjects || []).length - (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 5)} предметов
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

export default GradeAnalyticsWidget;
