import React from 'react';
import { Widget } from '../../../types/widget';
import { TrendingUp, PieChart, Award, BarChart3, Users } from 'lucide-react';
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
  // Use data from props - WidgetRenderer handles loading
  const widgetData = data;

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
      <div className="h-full flex flex-col p-1 min-w-0">
        {/* Overall analytics header */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200 overflow-hidden">
          <div className="flex items-center justify-between mb-2 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <BarChart3 className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-blue-800 truncate" title="Аналитика оценок">Аналитика оценок</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="text-lg font-bold text-blue-700 whitespace-nowrap" title={`${analytics.averageGrade}`}>{analytics.averageGrade}</div>
              {analytics.trendDirection === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 text-red-600 rotate-180">
                  <TrendingUp />
                </div>
              )}
              <span className="text-xs text-green-600 font-medium whitespace-nowrap" title={analytics.trend}>{analytics.trend}</span>
            </div>
          </div>
          <div className="text-xs text-blue-600 truncate" title={`Средний балл по школе (${analytics.totalGrades} оценок)`}>
            Средний балл по школе ({formatNumberShort(analytics.totalGrades)} оценок)
          </div>
        </div>

        {/* Grade distribution */}
        <div className="mb-3 min-w-0">
          <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Распределение оценок">Распределение оценок</div>
          <div className="grid grid-cols-4 gap-2 min-w-0">
            {(analytics.gradeDistribution || []).map((item: GradeDistributionItem, index: number) => (
              <div key={index} className="text-center">
                <div className={`w-full h-6 ${getGradeColor(item.grade)} rounded-t-lg flex items-center justify-center text-white font-bold text-sm`}>
                  {item.grade}
                </div>
                <div className="text-xs font-bold text-gray-900 mt-1 whitespace-nowrap" title={item.count.toLocaleString('ru-RU')}>{formatNumberShort(item.count)}</div>
                <div className="text-xs text-gray-500 whitespace-nowrap" title={`${item.percentage}%`}>{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top subjects */}
        <div className="flex-1 overflow-auto min-w-0">
          <div className="text-xs font-medium text-gray-600 mb-2 truncate" title={widget.size.height === 'small' ? 'Лучшие предметы' : 'Средний балл по предметам'}>
            {widget.size.height === 'small' ? 'Лучшие предметы' : 'Средний балл по предметам'}
          </div>
          <div className="space-y-2">
            {(analytics.topSubjects || []).slice(0, widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 5).map((subject: SubjectStat, index: number) => (
              <div key={index} className="p-2 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
                <div className="flex items-center justify-between min-w-0 gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 flex-shrink-0">
                      <span className="text-xs font-bold text-gray-600" title={`#${index + 1}`}>{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate" title={subject.subject}>{subject.subject}</div>
                      {widget.size.height !== 'small' && (
                        <div className="text-xs text-gray-500 truncate" title={`${subject.count.toLocaleString('ru-RU')} оценок`}>
                          {formatNumberShort(subject.count)} оценок
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${getSubjectColor(subject.average)} whitespace-nowrap`} title={`${subject.average}`}>{subject.average}</div>
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
        {widget.size.height === 'large' && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
            <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Лучшие классы">Лучшие классы</div>
            <div className="grid grid-cols-2 gap-2 min-w-0">
              {(analytics.classesPerformance || []).slice(0, 4).map((classItem: ClassPerformance, index: number) => (
                <div key={index} className="flex items-center justify-between min-w-0 gap-2">
                  <div className="flex items-center space-x-1 min-w-0">
                    <Users className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 truncate" title={classItem.class}>{classItem.class}</span>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <span className={`text-xs font-medium ${getSubjectColor(classItem.average)} whitespace-nowrap`} title={`${classItem.average}`}>{classItem.average}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(analytics.topSubjects || []).length > (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 5) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 truncate" title={`и еще ${(analytics.topSubjects || []).length - (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 5)} предметов`}>
              и еще {(analytics.topSubjects || []).length - (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 5)} предметов
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GradeAnalyticsWidget;
