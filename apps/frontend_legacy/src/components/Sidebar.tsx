import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHome,
  FaBook,
  FaUsers,
  FaUserTie,
  FaChartBar,
  FaCog,
  FaSearch,
  FaUserGraduate,
  FaChartLine,
  FaCalendarAlt,
  FaBuilding,
  FaChevronDown,
  FaSmile,
  FaMoneyBillWave,
  FaFileAlt,
  FaBookOpen,
  FaThLarge,
  FaComments,
  FaRobot,
  FaCalendar,
  FaEnvelope,
  FaListUl,
  FaFolder,
  FaLock,
  FaPlug,
  FaPalette,
  FaCogs,
  FaWarehouse,
  FaBarcode,
  FaShoppingCart,
  FaShieldAlt,
  FaBrain,
  FaClipboardList,
  FaUmbrellaBeach,
  FaUserSecret
} from 'react-icons/fa';
import { SidebarLink } from './SidebarLink';

// Объект со всеми ссылками и секциями
const sidebarLinks = {
  main: [
    {
      to: '/',
      icon: <FaHome size={16} />,
      label: 'Главная',
      type: 'SidebarLink'
    }
  ],
  app: [
    {
      to: '/app/chat',
      icon: <FaComments size={16} />,
      label: 'Чат',
      type: 'SidebarLink'
    },
    {
      to: '/app/ai-chat',
      icon: <FaRobot size={16} />,
      label: 'AI чат',
      type: 'SidebarLink'
    },
    {
      to: '/app/calendar',
      icon: <FaCalendar size={16} />,
      label: 'Календарь',
      type: 'SidebarLink'
    },
    {
      to: '/app/tasks',
      icon: <FaListUl size={16} />,
      label: 'Список дел',
      type: 'SidebarLink'
    },
    {
      to: "/app/neuro-abai",
      icon: <FaBrain />,
      label: 'Fizmat AI Ala',
      type: 'SidebarLink'
    }
  ],
  study: [
    {
      to: '/academic/academic-journal',
      icon: <FaBook size={16} className="w-4 h-4 mr-3" />,
      label: 'Учебный журнал',
      type: 'Link'
    },
    {
      to: '/academic/schedule',
      icon: <FaCalendarAlt size={16} className="w-4 h-4 mr-3" />,
      label: 'Расписание',
      type: 'Link'
    },
    {
      to: '/academic/homework',
      icon: <FaBookOpen size={16} className="w-4 h-4 mr-3" />,
      label: 'Домашние задания',
      type: 'Link'
    },
    {
      to: '/academic/classrooms',
      icon: <FaBuilding size={16} className="w-4 h-4 mr-3" />,
      label: 'Аудитории и секции',
      type: 'Link'
    },
    {
      to: '/study-plans',
      icon: <FaBook size={16} className="w-4 h-4 mr-3" />,
      label: 'Учебные планы',
      type: 'Link'
    }
  ],
  students: [
    {
      to: '/students',
      icon: <FaUserGraduate size={16} className="w-4 h-4 mr-3" />,
      label: 'Списки учащихся',
      type: 'Link'
    },
    {
      to: '/performance',
      icon: <FaChartLine size={16} className="w-4 h-4 mr-3" />,
      label: 'Успеваемость',
      type: 'Link'
    }
  ],
  hr: [
    {
      to: '/hr/employees',
      icon: <FaUserTie size={16} className="w-4 h-4 mr-3" />,
      label: 'Сотрудники и преподаватели',
      type: 'Link'
    },
    {
      to: '/hr/workload',
      icon: <FaClipboardList size={16} className="w-4 h-4 mr-3" />,
      label: 'Нагрузки и расписание ставок',
      type: 'Link',
    },
    {
      to: '/hr/kpi',
      icon: <FaChartLine size={16} className="w-4 h-4 mr-3" />,
      label: 'KPI и эффективность',
      type: 'Link',
    },
    {
      to: '/hr/vacation',
      icon: <FaUmbrellaBeach size={16} className="w-4 h-4 mr-3" />,
      label: 'Отпуска и замены',
      type: 'Link',
    },
    {
      to: '/hr/fake-positions',
      icon: <FaUserSecret size={16} className="w-4 h-4 mr-3" />,
      label: 'Контроль фиктивных ставок (AI)',
      type: 'Link',
    }
  ],
  finance: [
    {
      to: '/finance/payments',
      icon: <FaMoneyBillWave size={16} />,
      label: 'Оплаты и задолженности',
      type: 'SidebarLink'
    },
    {
      to: '/finance/reports',
      icon: <FaFileAlt size={16} />,
      label: 'Финансовые отчеты',
      type: 'SidebarLink'
    },
    {
      to: '/finance/budget',
      icon: <FaChartBar size={16} />,
      label: 'Бюджет и прогноз',
      type: 'SidebarLink'
    },
    {
      to: '/finance/acl',
      icon: <FaChartLine size={16} />,
      label: 'Анализ лояльности',
      type: 'SidebarLink'
    },
    {
      to: '/finance/payroll',
      icon: <FaUserTie size={16} />,
      label: 'Управление зарплатой',
      type: 'SidebarLink'
    }
  ],
  erp: [
    {
      to: '/app/erp/inventory',
      icon: <FaBarcode size={16} />,
      label: 'Digital инвентаризация',
      type: 'SidebarLink'
    },
    {
      to: '/app/erp/supply',
      icon: <FaShoppingCart size={16} />,
      label: 'Запросы на снабжение',
      type: 'SidebarLink'
    }
  ],
  settings: [
    {
      to: '/settings/users',
      icon: <FaUsers size={16} />,
      label: 'Пользователи',
      type: 'SidebarLink'
    },
    {
      to: '/settings/permissions',
      icon: <FaLock size={16} />,
      label: 'Права доступа',
      type: 'SidebarLink'
    },
    {
      to: '/settings/integrations',
      icon: <FaPlug size={16} />,
      label: 'Интеграции',
      type: 'SidebarLink'
    },
    {
      to: '/settings/branding',
      icon: <FaPalette size={16} />,
      label: 'Брендинг',
      type: 'SidebarLink'
    },
    {
      to: '/settings/system',
      icon: <FaCogs size={16} />,
      label: 'Система',
      type: 'SidebarLink'
    }
  ]
};

export const Sidebar: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({
    study: false,
    students: false,
    hr: false,
    finance: false,
    analytics: false,
    settings: false,
    erp: false
  });

  const [isAppOpen, setIsAppOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Hamburger button for mobile
  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white rounded-full p-2 shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Открыть меню"
      >
        <FaThLarge className="w-6 h-6 text-[#ca181f]" />
      </button>
      <div className={`w-64 h-screen bg-white shadow-lg fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300 md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:block`}>
        <div className="p-4">
        <div className="flex items-center mb-8">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-corporate-primary">FIZMAT.AI</span>
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-center px-4 py-2.5 bg-gray-50 rounded-xl">
            <FaSearch className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Поиск..."
              className="bg-transparent w-full text-sm focus:outline-none text-gray-600"
            />
          </div>
        </div>

        <nav className="space-y-2">
          {/* Главная */}
          {sidebarLinks.main.map(link => (
            <SidebarLink key={link.to} to={link.to} icon={link.icon} label={link.label} />
          ))}

          {/* Приложение с выпадающим списком */}
          <div className="sidebar-item">
            <button
              onClick={() => setIsAppOpen(!isAppOpen)}
              className="sidebar-button flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100"
            >
              <FaThLarge className="mr-3" />
              <span>Приложение</span>
              <FaChevronDown className={`ml-auto transform ${isAppOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAppOpen && (
              <div className="pl-4">
                {sidebarLinks.app.map(link => (
                  <SidebarLink key={link.to} to={link.to} icon={link.icon} label={link.label} />
                ))}
              </div>
            )}
          </div>

          {/* Учебный процесс */}
          <div className="group">
            <div
              className={`flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-xl cursor-pointer transition-all duration-150 ${expandedItems.study ? 'bg-[#ca181f]/10 text-[#ca181f]' : ''}`}
              onClick={() => toggleExpand('study')}
            >
              <div className="flex items-center">
                <FaBook className="w-5 h-5 mr-3" />
                <span className="font-medium">Учебный процесс</span>
              </div>
              <FaChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedItems.study ? 'transform rotate-180' : ''}`} />
            </div>

            {expandedItems.study && (
              <div className="mt-2 ml-4 space-y-1">
                {sidebarLinks.study.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-lg transition-all duration-150"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Студенты */}
          <div className="group">
            <div
              className={`flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-xl cursor-pointer transition-all duration-150 ${expandedItems.students ? 'bg-[#ca181f]/10 text-[#ca181f]' : ''}`}
              onClick={() => toggleExpand('students')}
            >
              <div className="flex items-center">
                <FaUsers className="w-5 h-5 mr-3" />
                <span className="font-medium">Студенты</span>
              </div>
              <FaChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedItems.students ? 'transform rotate-180' : ''}`} />
            </div>

            {expandedItems.students && (
              <div className="mt-2 ml-4 space-y-1">
                {sidebarLinks.students.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-lg transition-all duration-150"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* HR (Персонал) */}
          <div className="group">
            <div
              className={`flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-xl cursor-pointer transition-all duration-150 ${expandedItems.hr ? 'bg-[#ca181f]/10 text-[#ca181f]' : ''}`}
              onClick={() => toggleExpand('hr')}
            >
              <div className="flex items-center">
                <FaUserTie className="w-5 h-5 mr-3" />
                <span className="font-medium">HR (Персонал)</span>
              </div>
              <FaChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedItems.hr ? 'transform rotate-180' : ''}`} />
            </div>

            {expandedItems.hr && (
              <div className="mt-2 ml-4 space-y-1">
                {sidebarLinks.hr.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-lg transition-all duration-150"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Финансы */}
          <div className="group">
            <div
              className={`flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-xl cursor-pointer transition-all duration-150 ${expandedItems.finance ? 'bg-[#ca181f]/10 text-[#ca181f]' : ''}`}
              onClick={() => toggleExpand('finance')}
            >
              <div className="flex items-center">
                <FaMoneyBillWave className="w-5 h-5 mr-3" />
                <span className="font-medium">Финансы</span>
              </div>
              <FaChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedItems.finance ? 'transform rotate-180' : ''}`} />
            </div>

            {expandedItems.finance && (
              <div className="mt-2 ml-4 space-y-1">
                {sidebarLinks.finance.map(link => (
                  <SidebarLink
                    key={link.to}
                    to={link.to}
                    icon={link.icon}
                    label={link.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ERP секция */}
          <div className="mb-4">
            <button
              onClick={() => toggleExpand('erp')}
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-lg transition-all duration-150"
            >
              <div className="flex items-center">
                <FaWarehouse className="w-4 h-4 mr-3" />
                <span>ERP система</span>
              </div>
              <FaChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${expandedItems.erp ? 'transform rotate-180' : ''
                  }`}
              />
            </button>

            {expandedItems.erp && (
              <div className="pl-4 space-y-2">
                {sidebarLinks.erp.map(link => (
                  <SidebarLink
                    key={link.to}
                    to={link.to}
                    icon={link.icon}
                    label={link.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Настройки */}
          <div className="group">
            <div
              className={`flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ca181f]/10 hover:text-[#ca181f] rounded-xl cursor-pointer transition-all duration-150 ${expandedItems.settings ? 'bg-[#ca181f]/10 text-[#ca181f]' : ''}`}
              onClick={() => toggleExpand('settings')}
            >
              <div className="flex items-center">
                <FaCog className="w-5 h-5 mr-3" />
                <span className="font-medium">Настройки</span>
              </div>
              <FaChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedItems.settings ? 'transform rotate-180' : ''}`} />
            </div>

            {expandedItems.settings && (
              <div className="mt-2 ml-4 space-y-1">
                {sidebarLinks.settings.map(link => (
                  <SidebarLink
                    key={link.to}
                    to={link.to}
                    icon={link.icon}
                    label={link.label}
                  />
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
