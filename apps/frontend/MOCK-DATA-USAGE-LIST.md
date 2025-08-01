# Список использования моковых данных

## 📍 Frontend (apps/frontend/src/pages/EducationalReports.tsx)

### 1. **Массивы констант (моковые справочники)**
```typescript
const classes = [
  '8А', '8Б', '8В',
  '9А', '9Б', '9В', 
  '10А', '10Б', '10В',
  '11А', '11Б', '11В'
];

const teachers = [
  'Назарбаева А.Е.',
  'Қасымов Б.Н.',
  'Төлегенова Г.М.',
  'Сәтбаев Д.А.',
  'Жұмабекова Ж.С.',
  'Мұратов А.К.'
];
```

### 2. **Генерация моковых студентов**
```typescript
// Функция generateMockStudents()
const generateMockStudents = (className: string, count: number, period: string, subjectsList: string[]): Student[] => {
  const firstNames = ['Айдар', 'Асем', 'Данияр', 'Айгүл', 'Нұрлан', 'Алия', 'Ерлан', 'Жанар', 'Баuyржан', 'Динара'];
  const lastNames = ['Назарбаев', 'Қасымов', 'Төлеген', 'Сәтбаев', 'Жұмабек', 'Мұратов', 'Әбдіқадыр', 'Қабылбек', 'Серікбай', 'Дәулетов'];
  const middleNames = ['Ережанұлы', 'Болатұлы', 'Серікұлы', 'Мұратұлы', 'Асанұлы', 'Қайратұлы', 'Ержанқызы', 'Болатқызы', 'Серікқызы', 'Мұратқызы'];
}
```

### 3. **Генерация случайных оценок**
```typescript
// Функции для генерации оценок
const randomGrade = () => Math.floor(Math.random() * 3) + 3; // 3-5
const randomGrades = (count: number) => Array.from({ length: count }, () => randomGrade());
const generatePeriodGrade = (subject: string, period: string): number | null => {
  // Генерация случайных оценок в зависимости от периода
}
```

### 4. **Fallback данные при ошибке API**
```typescript
// В loadStudentsData() catch блок
catch (error) {
  console.error('Error loading students data:', error);
  
  // 🚨 FALLBACK К МОКОВЫМ ДАННЫМ
  const students: Student[] = [];
  classes.forEach(className => {
    students.push(...generateMockStudents(className, Math.floor(Math.random() * 10) + 20, filters.period, subjects));
  });
  setAllStudents(students);
}
```

### 5. **Fallback данные для отдельных студентов**
```typescript
// В Promise.all для студентов catch блок
catch (error) {
  console.error(`Error loading grades for student ${apiStudent.id}:`, error);
  
  // 🚨 FALLBACK К МОКОВЫМ ДАННЫМ ДЛЯ СТУДЕНТА
  return {
    id: apiStudent.id.toString(),
    fullName: educationalReportsApi.formatStudentName(apiStudent.user),
    grades: subjects.reduce((acc, subject) => ({ ...acc, [subject]: [] }), {}),
    averageGrade: 0,
    qualityPercentage: 0,
    absencesExcused: 0,
    absencesUnexcused: 0,
    className: apiStudent.group.name,
    subjects,
    homeworkCompletion: 0,
    disciplinaryNotes: 0
  };
}
```

### 6. **Моковые данные для полей, которых нет в API**
```typescript
// Данные, которые всегда моковые (пока нет API)
absencesExcused: Math.floor(Math.random() * 5), // TODO: получать из API посещаемости
absencesUnexcused: Math.floor(Math.random() * 3),
homeworkCompletion: Math.floor(Math.random() * 30) + 70, // TODO: получать из API
disciplinaryNotes: Math.floor(Math.random() * 3) // TODO: получать из API
```

### 7. **Моковые данные для графиков**
```typescript
// chartData в useMemo
const chartData: ChartDataPoint[] = useMemo(() => {
  const months = ['Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май'];
  return months.map(month => {
    const baseGrade = 3.5 + Math.random() * 1.5;
    const baseAbsences = Math.floor(Math.random() * 20) + 5;
    const baseQuality = Math.floor(Math.random() * 40) + 60;
    const baseHomework = Math.floor(Math.random() * 30) + 70;
    
    return {
      name: month,
      averageGrade: Math.round(baseGrade * 10) / 10,
      absences: baseAbsences,
      quality: baseQuality,
      homework: baseHomework
    };
  });
}, [filters.reportType, filters.class, filters.subject]);
```

### 8. **Моковые данные для деталей оценок**
```typescript
// В handleGradeClick() - детали оценок
const gradeDetails: GradeDetail[] = (student.grades[subject] || []).map((grade, index) => {
  return {
    grade,
    subject,
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
    teacher: teachers[Math.floor(Math.random() * teachers.length)], // 🚨 МОКОВЫЙ УЧИТЕЛЬ
    topic: periodTopic,
    type: periodType as GradeDetail['type']
  };
});
```

### 9. **Моковые журналы экспорта**
```typescript
// В useEffect для exportLogs
setExportLogs([
  {
    id: '1',
    user: 'Администратор',
    reportType: 'Успеваемость', 
    format: 'XLSX',
    exportedAt: new Date().toISOString()
  },
  // ... остальные моковые записи
]);
```

### 10. **Дефолтные предметы**
```typescript
// Дефолтный список предметов (fallback)
const [subjects, setSubjects] = useState<string[]>([
  'Математика', 'Физика', 'Химия', 'Биология', 'История', 
  'География', 'Литература', 'Русский язык', 'Английский язык', 'Информатика'
]);

// В loadSubjects() catch
catch (error) {
  console.error('Error loading subjects:', error);
  // 🚨 Keep default subjects as fallback
}
```

## 🎯 Где НЕТ моковых данных (идет с API):

### ✅ Реальные API вызовы:
- `educationalReportsApi.getStudents()` - список студентов
- `educationalReportsApi.getStudentGrades()` - оценки студентов  
- `educationalReportsApi.getQualityStatistics()` - статистика качества
- `educationalReportsApi.getSubjects()` - список предметов

## 🚨 Итого моковых данных:

### **Всегда моковые:**
1. Списки классов и учителей (константы)
2. Графики и диаграммы (случайные данные)
3. Журналы экспорта
4. Посещаемость (absences)
5. Домашние задания (homework completion)
6. Дисциплинарные записи (disciplinary notes)
7. Детали оценок (даты, темы уроков)

### **Моковые как fallback:**
1. Полные данные студентов (при ошибке API)
2. Оценки студентов (при ошибке API)
3. Список предметов (при ошибке API)

### **Полностью с API:**
1. Основной список студентов
2. Основные оценки
3. Статистика качества знаний
4. Список предметов из учебных планов

## 🔧 Что нужно подключить к API:

1. **Посещаемость** - создать API для attendance
2. **Домашние задания** - создать API для homework
3. **Дисциплина** - создать API для disciplinary notes  
4. **Исторические данные** - для графиков по месяцам
5. **Детали оценок** - расширить API с датами и темами уроков
6. **Журнал экспорта** - сохранять в БД факты экспорта
