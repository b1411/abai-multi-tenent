import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CalendarIcon, TrophyIcon, SchoolIcon, BookOpenIcon, UsersIcon, BriefcaseIcon } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';
import { kpiService } from '../services/kpiService';

interface PeriodicKpiScore {
  teacherId: number;
  period: { start: Date; end: Date };
  scores: {
    olympiadWins: number;
    schoolAdmissions: { elite: number; regular: number };
    qualifications: number;
    teamEvents: number;
    projectHelp: number;
    totalPoints: number;
  };
  totalPeriodicScore: number;
  bonusPoints: number;
  overallPeriodicKpi: number;
  achievements: {
    total: number;
    olympiads: number;
    admissions: number;
  };
  breakdown: {
    olympiadWins: number;
    eliteSchoolAdmissions: number;
    regularSchoolAdmissions: number;
    qualifications: number;
    teamEvents: number;
    projectHelp: number;
  };
  lastUpdated: Date;
}

interface AllTeachersPeriodicKpi {
  teachers: (PeriodicKpiScore & {
    teacherName: string;
    email: string;
    rank: number;
  })[];
  summary: {
    totalTeachers: number;
    averageScore: number;
    topPerformers: number;
    hasAchievements: number;
  };
  period: { start: Date; end: Date };
}

interface TopAchievements {
  period: { start: Date; end: Date };
  topAchievements: Array<{
    id: number;
    teacherName: string;
    type: string;
    title: string;
    points: number;
    date: Date;
  }>;
  topOlympiads: Array<{
    id: number;
    teacherName: string;
    studentName: string;
    olympiadName: string;
    subject: string;
    level: string;
    place: number;
    date: Date;
  }>;
  topAdmissions: Array<{
    id: number;
    teacherName: string;
    studentName: string;
    schoolType: string;
    schoolName: string;
    admissionYear: number;
  }>;
}

const PeriodicKpiDashboard: React.FC = () => {
  const [allTeachersData, setAllTeachersData] = useState<AllTeachersPeriodicKpi | null>(null);
  const [topAchievements, setTopAchievements] = useState<TopAchievements | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('year');
  const [activeTab, setActiveTab] = useState('overview');

  const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  };

  const currentUser = getCurrentUser();
  const isTeacher = currentUser?.role === 'TEACHER';

  const getPeriodDates = (period: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'semester':
        start.setMonth(now.getMonth() - 6);
        break;
      case 'year':
      default:
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getPeriodDates(selectedPeriod);

      const [teachersData, achievementsData] = await Promise.all([
        kpiService.getPeriodicKpi({ startDate, endDate }),
        kpiService.getPeriodicTrends({})
      ]);
      
      setAllTeachersData(teachersData as AllTeachersPeriodicKpi);
      // Создаем заглушку для topAchievements пока нет соответствующего API
      setTopAchievements({
        period: { start: new Date(startDate), end: new Date(endDate) },
        topAchievements: [],
        topOlympiads: [],
        topAdmissions: []
      });
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getAchievementTypeIcon = (type: string) => {
    switch (type) {
      case 'OLYMPIAD_WIN':
        return <TrophyIcon className="h-4 w-4" />;
      case 'SCHOOL_ADMISSION':
        return <SchoolIcon className="h-4 w-4" />;
      case 'QUALIFICATION':
        return <BookOpenIcon className="h-4 w-4" />;
      case 'TEAM_EVENT':
        return <UsersIcon className="h-4 w-4" />;
      case 'PROJECT_HELP':
        return <BriefcaseIcon className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getAchievementTypeLabel = (type: string) => {
    switch (type) {
      case 'OLYMPIAD_WIN':
        return 'Олимпиада';
      case 'SCHOOL_ADMISSION':
        return 'Поступление';
      case 'QUALIFICATION':
        return 'Квалификация';
      case 'TEAM_EVENT':
        return 'Мероприятие';
      case 'PROJECT_HELP':
        return 'Проект';
      default:
        return 'Достижение';
    }
  };

  const getLevelBadge = (level: string): 'default' | 'secondary' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'Международный': 'default',
      'Республиканский': 'secondary',
      'Городской': 'outline',
      'Школьный': 'outline'
    };
    return variants[level] || 'outline';
  };

  const getSchoolTypeBadge = (schoolType: string): 'default' | 'secondary' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'RFMSH': 'default',
      'NISH': 'default',
      'BIL': 'default',
      'LYCEUM': 'secondary',
      'PRIVATE_SCHOOL': 'secondary'
    };
    return variants[schoolType] || 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!allTeachersData || !topAchievements) {
    return (
      <div className="text-center text-gray-500 py-8">
        Нет данных для отображения
      </div>
    );
  }

  const currentTeacherData = isTeacher 
    ? allTeachersData.teachers.find(t => t.email === currentUser.email)
    : null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Рейтинг преподавателей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(allTeachersData.teachers || []).slice(0, 10).map((teacher, index) => (
                  <div key={teacher.teacherId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {teacher.rank}
                      </div>
                      <div>
                        <p className="font-medium">{teacher.teacherName}</p>
                        <p className="text-sm text-gray-500">{teacher.achievements.total} достижений</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getScoreBadgeVariant(teacher.overallPeriodicKpi)}>
                        {teacher.overallPeriodicKpi}
                      </Badge>
                      {teacher.bonusPoints > 0 && (
                        <p className="text-xs text-green-600 mt-1">+{teacher.bonusPoints} бонус</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'achievements':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Топ достижения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(topAchievements.topAchievements || []).map((achievement) => (
                  <div key={achievement.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        {getAchievementTypeIcon(achievement.type)}
                      </div>
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-sm text-gray-600">{achievement.teacherName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(achievement.date).toLocaleDateString('ru')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getAchievementTypeLabel(achievement.type)}
                      </Badge>
                      <Badge variant="default">
                        {achievement.points} очков
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'olympiads':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Топ результаты олимпиад</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(topAchievements.topOlympiads || []).map((olympiad) => (
                    <div key={olympiad.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{olympiad.olympiadName}</p>
                          <p className="text-sm text-gray-600">{olympiad.subject}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getLevelBadge(olympiad.level)}>
                            {olympiad.level}
                          </Badge>
                          <Badge variant="default">
                            {olympiad.place} место
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Ученик:</strong> {olympiad.studentName}</p>
                        <p><strong>Преподаватель:</strong> {olympiad.teacherName}</p>
                        <p><strong>Дата:</strong> {new Date(olympiad.date).toLocaleDateString('ru')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Поступления в школы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(topAchievements.topAdmissions || []).map((admission) => (
                    <div key={admission.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{admission.schoolName}</p>
                          <p className="text-sm text-gray-600">{admission.admissionYear} год</p>
                        </div>
                        <Badge variant={getSchoolTypeBadge(admission.schoolType)}>
                          {admission.schoolType}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Ученик:</strong> {admission.studentName}</p>
                        <p><strong>Преподаватель:</strong> {admission.teacherName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Периодические KPI</h1>
          <p className="text-gray-600">Достижения преподавателей за выбранный период</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="semester">Семестр</option>
            <option value="year">Год</option>
          </select>
          
          <Button onClick={fetchData} variant="outline">
            Обновить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Всего преподавателей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTeachersData.summary.totalTeachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Средний балл
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(allTeachersData.summary.averageScore)}`}>
              {allTeachersData.summary.averageScore}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Топ исполнители
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allTeachersData.summary.topPerformers}
            </div>
            <p className="text-xs text-gray-500">≥80 баллов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              С достижениями
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {allTeachersData.summary.hasAchievements}
            </div>
            <p className="text-xs text-gray-500">имеют достижения</p>
          </CardContent>
        </Card>
      </div>

      {/* Персональный KPI для преподавателя */}
      {isTeacher && currentTeacherData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrophyIcon className="h-5 w-5" />
              Ваш периодический KPI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Общий балл</span>
                  <Badge variant={getScoreBadgeVariant(currentTeacherData.overallPeriodicKpi)}>
                    {currentTeacherData.overallPeriodicKpi}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${currentTeacherData.overallPeriodicKpi}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Место в рейтинге: {currentTeacherData.rank}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Достижения</span>
                  <span className="text-sm font-bold">{currentTeacherData.achievements.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="text-xs">
                    <span className="text-gray-500">Олимпиады:</span> {currentTeacherData.achievements.olympiads}
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Поступления:</span> {currentTeacherData.achievements.admissions}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Бонусные баллы</span>
                  <span className="text-sm font-bold text-green-600">+{currentTeacherData.bonusPoints}</span>
                </div>
                <p className="text-xs text-gray-500">
                  За {currentTeacherData.scores.totalPoints} очков достижений
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Вкладки */}
      <div>
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Рейтинг
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'achievements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Достижения
          </button>
          <button
            onClick={() => setActiveTab('olympiads')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'olympiads'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Олимпиады
          </button>
        </div>

        <div className="space-y-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PeriodicKpiDashboard;
