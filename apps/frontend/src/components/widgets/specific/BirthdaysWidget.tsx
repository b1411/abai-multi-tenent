import React from 'react';
import { Widget } from '../../../types/widget';
import { Gift, Calendar, Users, Heart } from 'lucide-react';

interface BirthdaysWidgetProps {
  data: any;
  widget: Widget;
}

const BirthdaysWidget: React.FC<BirthdaysWidgetProps> = ({ data, widget }) => {
  // Mock data structure for birthdays
  const mockData = {
    upcomingBirthdays: [
      {
        id: 1,
        name: 'Аманжолова Галия Каримовна',
        position: 'Учитель математики',
        date: '2025-01-30',
        daysUntil: 3,
        age: 45
      },
      {
        id: 2,
        name: 'Султанов Данияр Болатович',
        position: 'Учитель истории',
        date: '2025-02-02',
        daysUntil: 6,
        age: 38
      },
      {
        id: 3,
        name: 'Жумабекова Сауле Амановна',
        position: 'Учитель химии',
        date: '2025-02-05',
        daysUntil: 9,
        age: 52
      }
    ],
    todayBirthdays: [],
    thisWeekBirthdays: 1,
    thisMonthBirthdays: 5,
    message: data?.message || null
  };

  const birthdays = data || mockData;

  if (birthdays.message) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center p-4">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-600 mb-2">Дни рождения</p>
          <p className="text-xs text-gray-500">{birthdays.message}</p>
        </div>
      </div>
    );
  }

  if (birthdays.upcomingBirthdays.length === 0 && birthdays.todayBirthdays.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Gift className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Нет предстоящих дней рождения</p>
        </div>
      </div>
    );
  }

  const getDaysText = (days: number) => {
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Завтра';
    if (days < 5) return `Через ${days} дня`;
    return `Через ${days} дней`;
  };

  const getAgeText = (age: number) => {
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${age} лет`;
    }
    
    if (lastDigit === 1) return `${age} год`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${age} года`;
    return `${age} лет`;
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* Header with stats */}
        <div className="mb-3 p-3 rounded-lg bg-pink-50 border border-pink-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-semibold text-pink-800">Дни рождения</span>
            </div>
            <Heart className="h-4 w-4 text-pink-600" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-pink-700">{birthdays.thisWeekBirthdays}</div>
              <div className="text-pink-600">На неделе</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-pink-700">{birthdays.thisMonthBirthdays}</div>
              <div className="text-pink-600">В месяце</div>
            </div>
          </div>
        </div>

        {/* Today's birthdays */}
        {birthdays.todayBirthdays.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-600 mb-2">Сегодня празднуют</div>
            <div className="space-y-2">
              {birthdays.todayBirthdays.map((person: any) => (
                <div key={person.id} className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                      <Gift className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {person.name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {person.position}
                      </div>
                      <div className="text-xs font-medium text-yellow-700">
                        🎉 {getAgeText(person.age)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming birthdays */}
        <div className="flex-1 overflow-auto">
          <div className="text-xs font-medium text-gray-600 mb-2">Предстоящие дни рождения</div>
          <div className="space-y-2">
            {birthdays.upcomingBirthdays.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((person: any) => (
              <div key={person.id} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {person.name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {person.position}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-purple-600 font-medium">
                        {getDaysText(person.daysUntil)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(person.date).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {birthdays.upcomingBirthdays.length > (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {birthdays.upcomingBirthdays.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} дней рождения
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

export default BirthdaysWidget;
