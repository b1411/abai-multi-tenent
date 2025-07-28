import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Trophy, 
  TrendingUp, 
  Bell, 
  Plus,
  Filter,
  Search,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import EventCard from '../components/jasLife/EventsFeed/EventCard';
import CreateEventModal from '../components/jasLife/EventsFeed/CreateEventModal';
import JoinClubModal from '../components/jasLife/ClubDirectory/JoinClubModal';
import SubmitHoursModal from '../components/jasLife/VolunteerTracker/SubmitHoursModal';
import useJasLife from '../hooks/useJasLife';
import { getCategoryIcon, getVolunteerLevelColor } from '../data/mockJasLifeData';
import { Club, CreateEventForm, SubmitHoursForm } from '../types/jasLife';

const JasLife: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'clubs' | 'hours' | 'leaderboard'>('events');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [joinClubModalOpen, setJoinClubModalOpen] = useState(false);
  const [submitHoursModalOpen, setSubmitHoursModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  
  const {
    events,
    eventsLoading,
    clubs,
    clubsLoading,
    volunteerHours,
    volunteerLoading,
    globalStats,
    leaderboard,
    notifications,
    registerForEvent,
    joinClub,
    submitVolunteerHours,
    refreshData,
    error
  } = useJasLife();

  // Event handlers
  const handleRegister = async (eventId: string) => {
    try {
      await registerForEvent(eventId);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleJoinClub = async (club: Club) => {
    setSelectedClub(club);
    setJoinClubModalOpen(true);
  };

  const handleJoinClubSubmit = async (clubId: string, message: string) => {
    try {
      await joinClub(clubId);
    } catch (err) {
      console.error('Join club failed:', err);
    }
  };

  const handleCreateEvent = async (form: CreateEventForm) => {
    try {
      // Mock implementation - would normally call API
      console.log('Creating event:', form);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Refresh data to show new event
      refreshData();
    } catch (err) {
      console.error('Create event failed:', err);
    }
  };

  const handleSubmitHours = async (form: SubmitHoursForm) => {
    try {
      // Transform form to VolunteerHours format
      const hoursData = {
        user: { id: 'current-user' } as any, // Mock current user
        description: form.description,
        hours: form.hours,
        date: form.date,
        category: form.category,
        event: undefined, // Will be set if form.eventId exists
        evidence: form.evidence ? form.evidence.name : undefined // Convert File to string
      };
      
      await submitVolunteerHours(hoursData);
    } catch (err) {
      console.error('Submit hours failed:', err);
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadNotifications = notifications.filter(n => !n.readAt).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  JAS.LIFE
                </h1>
                <p className="text-sm text-gray-600">Кампус жизни</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              {globalStats && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600">{globalStats.upcomingEvents}</div>
                    <div className="text-xs text-gray-600">События</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{globalStats.totalClubs}</div>
                    <div className="text-xs text-gray-600">Клубы</div>  
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">{globalStats.activeUsers}</div>
                    <div className="text-xs text-gray-600">Активных</div>
                  </div>
                </>
              )}
              
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 bg-gradient-to-r from-violet-100 to-purple-100 rounded-xl hover:from-violet-200 hover:to-purple-200 transition-colors">
                  <Bell className="w-5 h-5 text-violet-600" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск событий, клубов, активностей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all"
              />
            </div>
            
            <button 
              onClick={refreshData}
              className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <PermissionGuard module="events" action="create">
              <button 
                onClick={() => setCreateEventModalOpen(true)}
                className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-purple-100">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-4">
            {[
              { id: 'events', label: 'События', icon: Calendar, count: events.length },
              { id: 'clubs', label: 'Клубы', icon: Users, count: clubs.length },
              { id: 'hours', label: 'Мои часы', icon: Trophy, count: volunteerHours.length },
              { id: 'leaderboard', label: 'Рейтинг', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/70 hover:text-violet-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-violet-100 text-violet-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Предстоящие события
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-purple-200 rounded-xl hover:bg-white transition-colors">
                <Filter className="w-4 h-4" />
                Фильтры
              </button>
            </div>

            {eventsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRegister={handleRegister}
                    isRegistered={event.attendees.some(a => a.id === 'current-user')}
                    isOrganizer={event.organizer.id === '1'} // Mock: user ID 1 is organizer for demo
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'События не найдены' : 'Пока нет событий'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Попробуйте изменить поисковый запрос'
                    : 'Новые события появятся в ближайшее время'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Clubs Tab */}
        {activeTab === 'clubs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Клубы и сообщества
              </h2>
            </div>

            {clubsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map(club => (
                  <div key={club.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={club.logo}
                        alt={club.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="font-bold text-lg">{club.name}</h3>
                        <p className="text-sm opacity-90">{club.memberCount} участников</p>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {club.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < Math.floor(club.rating) ? 'opacity-100' : 'opacity-30'}>
                                ⭐
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{club.rating}</span>
                        </div>
                        
                        <button
                          onClick={() => handleJoinClub(club)}
                          className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all"
                        >
                          Вступить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Volunteer Hours Tab */}
        {activeTab === 'hours' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Мои волонтерские часы
              </h2>
              <PermissionGuard module="volunteer" action="create">
                <button 
                  onClick={() => setSubmitHoursModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
                >
                  Подать часы
                </button>
              </PermissionGuard>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Мой прогресс</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getVolunteerLevelColor('silver')}`}></div>
                  <span className="text-sm font-medium text-gray-700">Silver</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>75 из 100 часов</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-gray-400 to-gray-600 h-3 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Еще 25 часов до Gold уровня! 🏆
              </p>
            </div>

            {/* Hours Table */}
            {volunteerLoading ? (
              <div className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Активность
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Часы
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {volunteerHours.map(hour => (
                        <tr key={hour.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {getCategoryIcon(hour.category)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {hour.event?.title || hour.description}
                                </div>
                                {hour.event && (
                                  <div className="text-sm text-gray-500">
                                    {hour.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {hour.hours}ч
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {hour.date.toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              hour.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : hour.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {hour.status === 'approved' && '✅ Подтверждено'}
                              {hour.status === 'pending' && '⏳ На проверке'}
                              {hour.status === 'rejected' && '❌ Отклонено'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Рейтинг активности
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top 3 */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-6">Топ волонтеров семестра</h3>
                  
                  <div className="space-y-4">
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <div key={entry.user.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {index + 1}
                        </div>
                        
                        <img
                          src={entry.user.avatar}
                          alt={entry.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {entry.user.name} {entry.user.surname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.user.faculty}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-lg text-purple-600">
                            {entry.score}
                          </div>
                          <div className="text-xs text-gray-500">часов</div>
                        </div>
                        
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getVolunteerLevelColor(entry.user.volunteerLevel)}`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-6">
                {globalStats && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Общая статистика</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {globalStats.totalVolunteerHours.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Всего часов</div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-violet-600">
                          {globalStats.totalUsers}
                        </div>
                        <div className="text-sm text-gray-600">Участников</div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-pink-600">
                          {globalStats.totalEvents}
                        </div>
                        <div className="text-sm text-gray-600">События проведено</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* My Position */}
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4">Моя позиция</h3>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">#3</div>
                    <div className="text-white/80">в общем рейтинге</div>
                    <div className="text-2xl font-bold">75 часов</div>
                    <div className="text-white/80">в этом семестре</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Components */}
      <CreateEventModal
        isOpen={createEventModalOpen}
        onClose={() => setCreateEventModalOpen(false)}
        onSubmit={handleCreateEvent}
      />

      <JoinClubModal
        club={selectedClub}
        isOpen={joinClubModalOpen}
        onClose={() => {
          setJoinClubModalOpen(false);
          setSelectedClub(null);
        }}
        onJoin={handleJoinClubSubmit}
      />

      <SubmitHoursModal
        isOpen={submitHoursModalOpen}
        onClose={() => setSubmitHoursModalOpen(false)}
        onSubmit={handleSubmitHours}
      />
    </div>
  );
};

export default JasLife;
