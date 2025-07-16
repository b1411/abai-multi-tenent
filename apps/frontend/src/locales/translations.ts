export type Language = 'ru' | 'kz' | 'en';

export type MenuTextKey = 
  | 'menu.home'
  | 'menu.academic'
  | 'menu.academic.journal'
  | 'menu.academic.schedule'
  | 'menu.academic.classrooms'
  | 'menu.academic.study_plans'
  | 'menu.students'
  | 'menu.students.list'
  | 'menu.students.performance'
  | 'menu.students.emotional'
  | 'menu.hr'
  | 'menu.hr.staff'
  | 'menu.hr.workload'
  | 'menu.hr.kpi'
  | 'menu.hr.vacations'
  | 'menu.hr.fake_rates'
  | 'menu.finance'
  | 'menu.finance.payments'
  | 'menu.finance.reports'
  | 'menu.finance.budget'
  | 'menu.finance.salaries'
  | 'menu.finance.antifraud'
  | 'menu.ai_analytics'
  | 'menu.ai.dropout'
  | 'menu.ai.performance'
  | 'menu.ai.alerts'
  | 'menu.ai.recommendations'
  | 'menu.ai.comparison'
  | 'menu.settings'
  | 'menu.settings.users'
  | 'menu.settings.permissions'
  | 'menu.settings.integrations'
  | 'menu.settings.branding'
  | 'menu.settings.system'
  | 'menu.applications'
  | 'menu.applications.chat'
  | 'menu.applications.calendar'
  | 'menu.applications.email'
  | 'menu.applications.tasks'
  | 'menu.applications.notes'
  | 'menu.applications.files';

export const translations = {
  ru: {
    // Заголовки страниц
    dashboard: 'Панель управления',

    // Верхняя панель
    search: 'Поиск...',
    notifications: 'Уведомления',
    profile: 'Профиль',

    // Общие
    hours: 'ч',
    students: 'учеников',
    points: 'баллов',
    plan: 'План',
    fact: 'Факт',
    forecast: 'Прогноз',
    used: 'использовано',

    // Дни недели
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',

    // Месяцы
    sep: 'Сен',
    oct: 'Окт',
    nov: 'Ноя',
    dec: 'Дек',

    // Виджеты образования
    classPerformance: 'Успеваемость по классам',
    curriculumProgress: 'Прогресс по программе',
    topStudents: 'Топ студентов',
    teacherActivity: 'Активность преподавателей',
    attendanceTrends: 'Динамика посещаемости',

    // Предметы
    math: 'Математика',
    physics: 'Физика',
    chemistry: 'Химия',
    biology: 'Биология',

    // Виджеты финансов
    weeklyIncome: 'Доход за неделю',
    classDebts: 'Долги по классам',
    aiRevenue: 'AI-прогноз доходов',
    salaryFund: 'Фонд зарплат',
    expenseDeviations: 'Отклонения расходов',

    // Отделы
    teachers: 'Учителя',
    administration: 'Администрация',
    techStaff: 'Тех. персонал',
    psychologists: 'Психологи',

    // Категории расходов
    utilities: 'Коммунальные',
    materials: 'Материалы',
    equipment: 'Оборудование',
    food: 'Питание',

    // Главное меню
    'menu.home': 'Главная',
    'menu.academic': 'Учебный процесс',
    'menu.students': 'Студенты',
    'menu.hr': 'HR (Персонал)',
    'menu.finance': 'Финансы',
    'menu.ai_analytics': 'AI-аналитика',
    'menu.settings': 'Настройки',
    'menu.applications': 'Приложения',

    // Учебный процесс
    'menu.academic.journal': 'Учебный журнал',
    'menu.academic.schedule': 'Расписание',
    'menu.academic.classrooms': 'Аудитории и секции',
    'menu.academic.study_plans': 'Учебные планы',
    'menu.academic.program_control': 'Контроль программ',

    // Студенты
    'menu.students.list': 'Списки учащихся',
    'menu.students.performance': 'Успеваемость и посещаемость',
    'menu.students.emotional': 'Эмоциональный анализ',
    'menu.students.ai_profiles': 'AI-профили студентов',
    'menu.students.risk': 'Мониторинг рисков',

    // HR
    'menu.hr.staff': 'Сотрудники и преподаватели',
    'menu.hr.workload': 'Нагрузки и расписание ставок',
    'menu.hr.kpi': 'KPI и эффективность',
    'menu.hr.vacations': 'Отпуска и замены',
    'menu.hr.fake_rates': 'Контроль фиктивных ставок (AI)',

    // Финансы
    'menu.finance.payments': 'Оплаты и задолженности',
    'menu.finance.reports': 'Финансовые отчёты',
    'menu.finance.budget': 'Бюджет и прогноз',
    'menu.finance.salaries': 'Зарплаты и фонды',
    'menu.finance.antifraud': 'Антифрод-сигналы',

    // AI-аналитика
    'menu.ai.dropout': 'Прогноз отчислений',
    'menu.ai.performance': 'Снижение результатов',
    'menu.ai.alerts': 'Отклонения и тревоги',
    'menu.ai.recommendations': 'AI-рекомендации',
    'menu.ai.comparison': 'Сравнительный анализ',

    // Настройки
    'menu.settings.users': 'Пользователи и роли',
    'menu.settings.permissions': 'Доступы и права',
    'menu.settings.integrations': 'Интеграции',
    'menu.settings.branding': 'Брендинг',
    'menu.settings.system': 'Системные настройки',

    // Приложения
    'menu.applications.chat': 'Чат',
    'menu.applications.calendar': 'Календарь',
    'menu.applications.email': 'Почта',
    'menu.applications.tasks': 'Задачи',
    'menu.applications.notes': 'Заметки',
    'menu.applications.files': 'Файлы',

    // Фильтры учебного журнала
    selectSubject: 'Выберите предмет',
    selectClass: 'Выберите класс',
    selectGroup: 'Выберите группу',
    selectSemester: 'Выберите семестр',
    searchByName: 'Поиск по имени ...',
    semester1: '1 семестр',
    semester2: '2 семестр',
  },
  kz: {
    // Заголовки страниц
    dashboard: 'Басқару тақтасы',

    // Верхняя панель
    search: 'Іздеу...',
    notifications: 'Хабарландырулар',
    profile: 'Профиль',

    // Общие
    hours: 'сағ',
    students: 'оқушы',
    points: 'ұпай',
    plan: 'Жоспар',
    fact: 'Факт',
    forecast: 'Болжам',
    used: 'пайдаланылды',

    // Дни недели
    mon: 'Дс',
    tue: 'Сс',
    wed: 'Ср',
    thu: 'Бс',
    fri: 'Жм',

    // Месяцы
    sep: 'Қыр',
    oct: 'Қаз',
    nov: 'Қар',
    dec: 'Жел',

    // Виджеты образования
    classPerformance: 'Сыныптар үлгерімі',
    curriculumProgress: 'Бағдарлама бойынша үлгерім',
    topStudents: 'Үздік оқушылар',
    teacherActivity: 'Мұғалімдер белсенділігі',
    attendanceTrends: 'Сабаққа қатысу динамикасы',

    // Предметы
    math: 'Математика',
    physics: 'Физика',
    chemistry: 'Химия',
    biology: 'Биология',

    // Виджеты финансов
    weeklyIncome: 'Апталық кіріс',
    classDebts: 'Сыныптар бойынша қарыздар',
    aiRevenue: 'AI-кіріс болжамы',
    salaryFund: 'Жалақы қоры',
    expenseDeviations: 'Шығындардан ауытқу',

    // Отделы
    teachers: 'Мұғалімдер',
    administration: 'Әкімшілік',
    techStaff: 'Тех. қызметкерлер',
    psychologists: 'Психологтар',

    // Категории расходов
    utilities: 'Коммуналдық',
    materials: 'Материалдар',
    equipment: 'Жабдықтар',
    food: 'Тамақтану',

    // Главное меню
    'menu.home': 'Басты',
    'menu.academic': 'Оқу үрдісі',
    'menu.students': 'Студенттер',
    'menu.hr': 'HR (Қызметкерлер)',
    'menu.finance': 'Қаржы',
    'menu.ai_analytics': 'AI-талдау',
    'menu.settings': 'Параметрлер',
    'menu.applications': 'Қолданыстар',

    // Учебный процесс
    'menu.academic.journal': 'Оқу журналы',
    'menu.academic.schedule': 'Сабақ кестесі',
    'menu.academic.classrooms': 'Аудиториялар мен секциялар',
    'menu.academic.study_plans': 'Оқу жоспарлары',
    'menu.academic.program_control': 'Бағдарламаларды бақылау',

    // Студенты
    'menu.students.list': 'Оқушылар тізімі',
    'menu.students.performance': 'Үлгерім және сабаққа қатысу',
    'menu.students.emotional': 'Эмоционалды талдау',
    'menu.students.ai_profiles': 'Студенттердің AI-профильдері',
    'menu.students.risk': 'Тәуекелдерді бақылау',

    // HR
    'menu.hr.staff': 'Қызметкерлер мен оқытушылар',
    'menu.hr.workload': 'Жүктеме және мөлшерлемелер кестесі',
    'menu.hr.kpi': 'KPI және тиімділік',
    'menu.hr.vacations': 'Демалыстар мен ауыстырулар',
    'menu.hr.fake_rates': 'Жалған мөлшерлемелерді бақылау (AI)',

    // Финансы
    'menu.finance.payments': 'Төлемдер мен қарыздар',
    'menu.finance.reports': 'Қаржылық есептер',
    'menu.finance.budget': 'Бюджет және болжам',
    'menu.finance.salaries': 'Жалақылар мен қорлар',
    'menu.finance.antifraud': 'Алаяқтықты анықтау',

    // AI-аналитика
    'menu.ai.dropout': 'Шығару болжамы',
    'menu.ai.performance': 'Нәтижелердің төмендеуі',
    'menu.ai.alerts': 'Ауытқулар мен дабылдар',
    'menu.ai.recommendations': 'AI-ұсыныстары',
    'menu.ai.comparison': 'Салыстырмалы талдау',

    // Настройки
    'menu.settings.users': 'Пайдаланушылар мен рөлдер',
    'menu.settings.permissions': 'Қол жеткізу құқықтары',
    'menu.settings.integrations': 'Интеграциялар',
    'menu.settings.branding': 'Брендинг / Интерфейс тақырыптары',
    'menu.settings.system': 'Жүйелік логтар мен резервтік көшірмелер',

    // Приложения
    'menu.applications.chat': 'Чат',
    'menu.applications.calendar': 'Календарь',
    'menu.applications.email': 'Почта',
    'menu.applications.tasks': 'Задачи',
    'menu.applications.notes': 'Заметки',
    'menu.applications.files': 'Файлы',

    // Фильтры учебного журнала
    selectSubject: 'Пәнді таңдаңыз',
    selectClass: 'Сыныпты таңдаңыз',
    selectGroup: 'Топты таңдаңыз',
    selectSemester: 'Семестрді таңдаңыз',
    searchByName: 'Аты бойынша іздеу ...',
    semester1: '1 семестр',
    semester2: '2 семестр',
  },
  en: {
    // Page titles
    dashboard: 'Dashboard',

    // Верхняя панель
    search: 'Search...',
    notifications: 'Notifications',
    profile: 'Profile',

    // Common
    hours: 'h',
    students: 'students',
    points: 'points',
    plan: 'Plan',
    fact: 'Actual',
    forecast: 'Forecast',
    used: 'used',

    // Days of week
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',

    // Months
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dec: 'Dec',

    // Education widgets
    classPerformance: 'Class Performance',
    curriculumProgress: 'Curriculum Progress',
    topStudents: 'Top Students',
    teacherActivity: 'Teacher Activity',
    attendanceTrends: 'Attendance Trends',

    // Subjects
    math: 'Mathematics',
    physics: 'Physics',
    chemistry: 'Chemistry',
    biology: 'Biology',

    // Finance widgets
    weeklyIncome: 'Weekly Income',
    classDebts: 'Class Debts',
    aiRevenue: 'AI Revenue Projection',
    salaryFund: 'Salary Fund',
    expenseDeviations: 'Expense Deviations',

    // Departments
    teachers: 'Teachers',
    administration: 'Administration',
    techStaff: 'Tech Staff',
    psychologists: 'Psychologists',

    // Expense categories
    utilities: 'Utilities',
    materials: 'Materials',
    equipment: 'Equipment',
    food: 'Food',

    // Main menu
    'menu.home': 'Home',
    'menu.academic': 'Academic Process',
    'menu.students': 'Students',
    'menu.hr': 'HR (Personnel)',
    'menu.finance': 'Finance',
    'menu.ai_analytics': 'AI Analytics',
    'menu.settings': 'Settings',
    'menu.applications': 'Applications',

    // Academic Process
    'menu.academic.journal': 'Academic Journal',
    'menu.academic.schedule': 'Schedule',
    'menu.academic.classrooms': 'Classrooms & Sections',
    'menu.academic.study_plans': 'Study Plans',
    'menu.academic.program_control': 'Program Control',

    // Students
    'menu.students.list': 'Student Lists',
    'menu.students.performance': 'Performance & Attendance',
    'menu.students.emotional': 'Emotional Analytics',
    'menu.students.ai_profiles': 'Student AI Profiles',
    'menu.students.risk': 'Risk Monitoring',

    // HR
    'menu.hr.staff': 'Staff & Teachers',
    'menu.hr.workload': 'Workload & Rate Schedule',
    'menu.hr.kpi': 'KPI & Efficiency',
    'menu.hr.vacations': 'Vacations & Substitutions',
    'menu.hr.fake_rates': 'Fake Rates Control (AI)',

    // Finance
    'menu.finance.payments': 'Payments & Debts',
    'menu.finance.reports': 'Financial Reports',
    'menu.finance.budget': 'Budget & Forecast',
    'menu.finance.salaries': 'Salaries & Funds',
    'menu.finance.antifraud': 'Anti-fraud Signals',

    // AI Analytics
    'menu.ai.dropout': 'Dropout Forecast',
    'menu.ai.performance': 'Performance Decline',
    'menu.ai.alerts': 'Deviations & Alerts',
    'menu.ai.recommendations': 'AI Action Recommendations',
    'menu.ai.comparison': 'Comparative Analysis',

    // Settings
    'menu.settings.users': 'Users & Roles',
    'menu.settings.permissions': 'Access & Permissions',
    'menu.settings.integrations': 'Integrations',
    'menu.settings.branding': 'Branding / Interface Themes',
    'menu.settings.system': 'System Logs & Backups',

    // Academic Journal Filters
    selectSubject: 'Select subject',
    selectClass: 'Select class',
    selectGroup: 'Select group',
    selectSemester: 'Select semester',
    searchByName: 'Search by name ...',
    semester1: '1st semester',
    semester2: '2nd semester',

    // Приложения
    'menu.applications.chat': 'Chat',
    'menu.applications.calendar': 'Calendar',
    'menu.applications.email': 'Email',
    'menu.applications.tasks': 'Tasks',
    'menu.applications.notes': 'Notes',
    'menu.applications.files': 'Files',
  }
}; 