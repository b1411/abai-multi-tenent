import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaBook, FaClock, FaCheckCircle, FaPlayCircle, FaCircle, FaCalendarAlt, FaGraduationCap, FaClipboardList, FaTasks } from 'react-icons/fa';
import { KtpData, KtpSection, KtpLesson } from '../types/ktp';
import { formatDate } from '../utils';

interface KtpTreeViewProps {
  ktpData: KtpData;
}

interface SectionCardProps {
  section: KtpSection;
  isExpanded: boolean;
  onToggle: () => void;
}

interface LessonCardProps {
  lesson: KtpLesson;
  lessonIndex: number;
  onLessonClick: (lesson: KtpLesson) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'in_progress':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'planned':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <FaCheckCircle className="w-4 h-4" />;
    case 'in_progress':
      return <FaPlayCircle className="w-4 h-4" />;
    case 'planned':
      return <FaCircle className="w-4 h-4" />;
    default:
      return <FaCircle className="w-4 h-4" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Завершен';
    case 'in_progress':
      return 'В процессе';
    case 'planned':
      return 'Запланирован';
    default:
      return 'Не определен';
  }
};

const LessonCard: React.FC<LessonCardProps> = ({ lesson, lessonIndex, onLessonClick }) => {
  const statusColor = getStatusColor(lesson.status);
  const statusIcon = getStatusIcon(lesson.status);
  const statusText = getStatusText(lesson.status);

  return (
    <div 
      className={`ml-8 mb-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${statusColor} hover:border-opacity-80`}
      onClick={() => onLessonClick(lesson)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-500 mr-3">#{lessonIndex}</span>
            <h4 className="font-semibold text-gray-800 flex-1">{lesson.title}</h4>
            <div className="flex items-center text-sm ml-4">
              {statusIcon}
              <span className="ml-1">{statusText}</span>
            </div>
          </div>
          
          {lesson.description && (
            <p className="text-sm text-gray-600 mb-3">{lesson.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center">
              <FaCalendarAlt className="w-3 h-3 mr-1" />
              <span>Неделя {lesson.week}</span>
            </div>
            
            <div className="flex items-center">
              <FaClock className="w-3 h-3 mr-1" />
              <span>{lesson.duration} ч.</span>
            </div>
            
            {lesson.date && (
              <div className="flex items-center">
                <FaCalendarAlt className="w-3 h-3 mr-1" />
                <span>{formatDate(lesson.date)}</span>
              </div>
            )}
            
            {lesson.materials && lesson.materials.length > 0 && (
              <div className="flex items-center">
                <FaBook className="w-3 h-3 mr-1" />
                <span>{lesson.materials.length} материал(ов)</span>
              </div>
            )}
          </div>
          
          {lesson.objectives && lesson.objectives.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                <FaGraduationCap className="w-3 h-3 mr-1" />
                Цели урока:
              </div>
              <ul className="text-xs text-gray-600 ml-4">
                {lesson.objectives.slice(0, 2).map((objective, index) => (
                  <li key={index} className="mb-1">• {objective}</li>
                ))}
                {lesson.objectives.length > 2 && (
                  <li className="text-gray-500 italic">и еще {lesson.objectives.length - 2}...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionCard: React.FC<SectionCardProps> = ({ section, isExpanded, onToggle }) => {
  const completedLessons = section.lessons.filter(lesson => lesson.status === 'completed').length;
  const inProgressLessons = section.lessons.filter(lesson => lesson.status === 'in_progress').length;
  const totalLessons = section.lessons.length;
  const progress = (completedLessons / totalLessons) * 100;

  return (
    <div className="mb-6">
      <div 
        className="bg-white border border-gray-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="mr-3">
              {isExpanded ? (
                <FaChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <FaChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-gray-600 mb-3">{section.description}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaBook className="w-4 h-4 mr-1" />
                  <span>{totalLessons} уроков</span>
                </div>
                
                <div className="flex items-center">
                  <FaClock className="w-4 h-4 mr-1" />
                  <span>{section.totalHours} часов</span>
                </div>
                
                <div className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  <span>{completedLessons} завершено</span>
                </div>
                
                {inProgressLessons > 0 && (
                  <div className="flex items-center">
                    <FaPlayCircle className="w-4 h-4 mr-1 text-orange-600" />
                    <span>{inProgressLessons} в процессе</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="ml-4 flex flex-col items-end">
            <div className="text-sm font-medium text-gray-700 mb-1">
              {Math.round(progress)}% завершено
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KtpTreeView: React.FC<KtpTreeViewProps> = ({ ktpData }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(ktpData.sections.filter(section => section.expanded).map(section => section.id))
  );
  const [selectedLesson, setSelectedLesson] = useState<KtpLesson | null>(null);

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleLessonClick = (lesson: KtpLesson) => {
    setSelectedLesson(lesson);
  };

  const closeLessonModal = () => {
    setSelectedLesson(null);
  };

  const completedLessons = ktpData.sections.reduce((acc, section) => 
    acc + section.lessons.filter(lesson => lesson.status === 'completed').length, 0
  );
  const totalProgress = (completedLessons / ktpData.totalLessons) * 100;

  return (
    <div className="w-full">
      {/* Общая статистика */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Общий прогресс курса</h3>
          <div className="text-2xl font-bold text-indigo-600">{Math.round(totalProgress)}%</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{ktpData.totalLessons}</div>
            <div className="text-sm text-gray-600">Всего уроков</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{ktpData.totalHours}</div>
            <div className="text-sm text-gray-600">Всего часов</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedLessons}</div>
            <div className="text-sm text-gray-600">Завершено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{ktpData.totalLessons - completedLessons}</div>
            <div className="text-sm text-gray-600">Осталось</div>
          </div>
        </div>
        
        <div className="w-full h-3 bg-white rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* Дерево разделов и уроков */}
      <div className="space-y-0">
        {ktpData.sections.map((section, sectionIndex) => (
          <div key={section.id}>
            <SectionCard
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
            
            {expandedSections.has(section.id) && (
              <div className="mb-6 animate-fadeIn">
                {section.lessons.map((lesson, lessonIndex) => {
                  const globalLessonIndex = ktpData.sections
                    .slice(0, sectionIndex)
                    .reduce((acc, prevSection) => acc + prevSection.lessons.length, 0) + lessonIndex + 1;
                  
                  return (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      lessonIndex={globalLessonIndex}
                      onLessonClick={handleLessonClick}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно с деталями урока */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{selectedLesson.title}</h2>
              <button
                onClick={closeLessonModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaCheckCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
              {selectedLesson.description && (
                <p className="text-gray-600 mb-4">{selectedLesson.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FaGraduationCap className="w-4 h-4 mr-2" />
                    Цели урока
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedLesson.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FaTasks className="w-4 h-4 mr-2" />
                    Методы обучения
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLesson.methods.map((method, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedLesson.materials && selectedLesson.materials.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FaBook className="w-4 h-4 mr-2" />
                    Материалы
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLesson.materials.map((material, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedLesson.assessment && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <FaClipboardList className="w-4 h-4 mr-2" />
                      Оценивание
                    </h4>
                    <p className="text-sm text-gray-600">{selectedLesson.assessment}</p>
                  </div>
                )}
                
                {selectedLesson.homework && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <FaTasks className="w-4 h-4 mr-2" />
                      Домашнее задание
                    </h4>
                    <p className="text-sm text-gray-600">{selectedLesson.homework}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KtpTreeView;
