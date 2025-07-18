import React, { useState } from 'react';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBook,
  FaChalkboardTeacher,
  FaStar,
  FaEdit,
  FaCamera,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram
} from 'react-icons/fa';
import { IconType } from 'react-icons';

interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

interface Experience {
  id: string;
  position: string;
  organization: string;
  startDate: string;
  endDate?: string;
  description: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: IconType;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'education' | 'experience'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    firstName: 'Иван',
    lastName: 'Иванов',
    email: 'ivan@example.com',
    phone: '+7 (999) 123-45-67',
    location: 'Москва, Россия',
    bio: 'Учитель математики с 10-летним опытом работы. Специализируюсь на подготовке к ЕГЭ и олимпиадам.',
    avatar: '/path/to/avatar.jpg',
    coverImage: '/path/to/cover.jpg',
    subjects: ['Математика', 'Физика', 'Информатика'],
    socialLinks: {
      facebook: 'https://facebook.com/ivan',
      twitter: 'https://twitter.com/ivan',
      linkedin: 'https://linkedin.com/in/ivan',
      instagram: 'https://instagram.com/ivan'
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Лучший учитель года',
      date: '2023',
      description: 'Победитель конкурса "Лучший учитель года" в категории "Математика"'
    },
    {
      id: '2',
      title: 'Высшая квалификационная категория',
      date: '2022',
      description: 'Присвоена высшая квалификационная категория по результатам аттестации'
    }
  ]);

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      institution: 'Московский государственный университет',
      degree: 'Магистр',
      field: 'Математика',
      startYear: 2010,
      endYear: 2012
    },
    {
      id: '2',
      institution: 'Московский государственный университет',
      degree: 'Бакалавр',
      field: 'Математика',
      startYear: 2006,
      endYear: 2010
    }
  ]);

  const [experience, setExperience] = useState<Experience[]>([
    {
      id: '1',
      position: 'Старший учитель математики',
      organization: 'Школа №1234',
      startDate: '2018',
      description: 'Преподавание математики в старших классах, подготовка к ЕГЭ и олимпиадам'
    },
    {
      id: '2',
      position: 'Учитель математики',
      organization: 'Гимназия №5678',
      startDate: '2012',
      endDate: '2018',
      description: 'Преподавание математики в средних и старших классах'
    }
  ]);

  const socialLinks: SocialLink[] = [
    { platform: 'Facebook', url: 'https://facebook.com', icon: FaFacebook },
    { platform: 'Twitter', url: 'https://twitter.com', icon: FaTwitter },
    { platform: 'LinkedIn', url: 'https://linkedin.com', icon: FaLinkedin },
    { platform: 'Instagram', url: 'https://instagram.com', icon: FaInstagram }
  ];

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Сохранить изменения в профиле
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Обложка */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        {isEditing && (
          <button className="absolute right-4 top-4 rounded-full bg-white p-2 text-gray-600 hover:bg-gray-100">
            <FaCamera className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Основная информация */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-32">
          <div className="relative rounded-lg bg-white p-6 shadow-lg">
            <div className="sm:flex sm:items-center sm:space-x-6">
              <div className="relative mb-4 sm:mb-0">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white">
                  <img
                    src={profile.avatar}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="h-full w-full object-cover"
                  />
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-gray-600 hover:bg-gray-100">
                      <FaCamera className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="mt-1 text-lg text-gray-500">{profile.bio}</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                      <FaEdit className="mr-2" />
                      Редактировать
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveProfile}
                      className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                    >
                      Сохранить
                    </button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex items-center text-gray-600">
                    <FaEnvelope className="mr-2" />
                    {profile.email}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaPhone className="mr-2" />
                    {profile.phone}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="mr-2" />
                    {profile.location}
                  </div>
                  <div className="flex items-center space-x-4">
                    {socialLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <a
                          key={link.platform}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600"
                        >
                          <Icon className="w-6 h-6" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Вкладки */}
            <div className="mt-8 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Обзор', icon: FaUser },
                  { id: 'achievements', label: 'Достижения', icon: FaStar },
                  { id: 'education', label: 'Образование', icon: FaGraduationCap },
                  { id: 'experience', label: 'Опыт', icon: FaChalkboardTeacher }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center border-b-2 px-1 pb-4 text-sm font-medium ${
                      activeTab === id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Содержимое вкладок */}
            <div className="mt-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">О себе</h3>
                    <p className="mt-2 text-gray-600">{profile.bio}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Предметы</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="space-y-6">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="rounded-lg border border-gray-200 bg-white p-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {achievement.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {achievement.date}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">
                        {achievement.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'education' && (
                <div className="space-y-6">
                  {education.map((edu) => (
                    <div
                      key={edu.id}
                      className="rounded-lg border border-gray-200 bg-white p-6"
                    >
                      <div className="flex items-center space-x-3">
                        <FaGraduationCap className="h-6 w-6 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {edu.degree} в {edu.field}
                          </h3>
                          <p className="text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-500">
                            {edu.startYear} - {edu.endYear || 'настоящее время'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-6">
                  {experience.map((exp) => (
                    <div
                      key={exp.id}
                      className="rounded-lg border border-gray-200 bg-white p-6"
                    >
                      <div className="flex items-center space-x-3">
                        <FaChalkboardTeacher className="h-6 w-6 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {exp.position}
                          </h3>
                          <p className="text-gray-600">{exp.organization}</p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate} - {exp.endDate || 'настоящее время'}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-600">{exp.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 