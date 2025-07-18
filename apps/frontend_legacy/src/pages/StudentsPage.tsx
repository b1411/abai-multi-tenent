import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserGraduate, FaPhone, FaEnvelope, FaIdCard } from 'react-icons/fa';

interface Student {
  id: string;
  name: string;
  class: string;
  performance: number;
  attendance: number;
  emotionalState: string;
  payments: string;
  image: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  parentName?: string;
  parentPhone?: string;
}

interface StudentModalProps {
  student: Student | null;
  onClose: () => void;
  onViewDetails: (studentId: string) => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, onClose, onViewDetails }) => {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mr-4">
                <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
                <p className="text-gray-600">Группа: {student.class}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Личная информация</h3>
              <div className="space-y-3">
                {student.birthDate && (
                  <div className="flex items-center">
                    <FaIdCard className="w-5 h-5 text-gray-500 mr-3" />
                    <span>Дата рождения: {student.birthDate}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center">
                    <FaPhone className="w-5 h-5 text-gray-500 mr-3" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.email && (
                  <div className="flex items-center">
                    <FaEnvelope className="w-5 h-5 text-gray-500 mr-3" />
                    <span>{student.email}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Контакты родителей</h3>
              <div className="space-y-3">
                {student.parentName && (
                  <div className="flex items-center">
                    <FaUserGraduate className="w-5 h-5 text-gray-500 mr-3" />
                    <span>{student.parentName}</span>
                  </div>
                )}
                {student.parentPhone && (
                  <div className="flex items-center">
                    <FaPhone className="w-5 h-5 text-gray-500 mr-3" />
                    <span>{student.parentPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => onViewDetails(student.id)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Обновляем классы на группы
  const classes = [
    'Все группы',
    'МК24-1М',
    'МК24-2М',
    'ПК24-1П',
    'ПК24-2П',
    'ПД24-1Д'
  ];
  
  // Обновляем студентов с группами колледжа
  const students = [
    {
      id: '1',
      name: 'Алихан Сатыбалды',
      class: 'МК24-1М',
      performance: 87,
      attendance: 95,
      emotionalState: 'Хорошее',
      payments: 'Оплачено',
      image: 'https://placekitten.com/200/200',
      phone: '+7 (701) 123-4567',
      email: 'alikhan@example.com',
      birthDate: '15.05.2006',
      parentName: 'Сатыбалды А.К.',
      parentPhone: '+7 (701) 765-4321'
    },
    {
      id: '2',
      name: 'Мария Иванова',
      class: 'МК24-1М',
      performance: 92,
      attendance: 98,
      emotionalState: 'Отличное',
      payments: 'Оплачено',
      image: 'https://placekitten.com/201/201',
      phone: '+7 (702) 234-5678',
      email: 'maria@example.com',
      birthDate: '23.03.2006',
      parentName: 'Иванова О.П.',
      parentPhone: '+7 (702) 876-5432'
    },
    {
      id: '3',
      name: 'Александр Петров',
      class: 'МК24-2М',
      performance: 75,
      attendance: 85,
      emotionalState: 'Удовлетворительное',
      payments: 'Задолженность',
      image: 'https://placekitten.com/202/202',
      phone: '+7 (703) 345-6789',
      email: 'alex@example.com',
      birthDate: '10.10.2005',
      parentName: 'Петров С.В.',
      parentPhone: '+7 (703) 987-6543'
    },
    {
      id: '4',
      name: 'Анна Сидорова',
      class: 'ПК24-1П',
      performance: 95,
      attendance: 99,
      emotionalState: 'Отличное',
      payments: 'Оплачено',
      image: 'https://placekitten.com/203/203',
      phone: '+7 (704) 456-7890',
      email: 'anna@example.com',
      birthDate: '07.12.2006',
      parentName: 'Сидорова Е.А.',
      parentPhone: '+7 (704) 098-7654'
    },
    {
      id: '5',
      name: 'Ерлан Ахметов',
      class: 'ПК24-2П',
      performance: 68,
      attendance: 78,
      emotionalState: 'Нейтральное',
      payments: 'Задолженность',
      image: 'https://placekitten.com/204/204',
      phone: '+7 (705) 567-8901',
      email: 'erlan@example.com',
      birthDate: '18.07.2005',
      parentName: 'Ахметов Н.Т.',
      parentPhone: '+7 (705) 109-8765'
    },
    {
      id: '6',
      name: 'Айгуль Нурланова',
      class: 'ПД24-1Д',
      performance: 88,
      attendance: 93,
      emotionalState: 'Хорошее',
      payments: 'Оплачено',
      image: 'https://placekitten.com/205/205',
      phone: '+7 (706) 678-9012',
      email: 'aigul@example.com',
      birthDate: '29.01.2006',
      parentName: 'Нурланова Г.М.',
      parentPhone: '+7 (706) 210-9876'
    }
  ];

  const filteredStudents = students.filter(student => {
    const matchesClass = !selectedClass || selectedClass === 'Все группы' || student.class === selectedClass;
    const matchesSearch = !searchQuery || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handleViewDetails = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Студенты</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все группы</option>
              {classes.slice(1).map(classItem => (
                <option key={classItem} value={classItem}>
                  {classItem}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="aspect-w-4 aspect-h-3">
                <img
                  src={student.image}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{student.name}</h3>
                <p className="text-sm text-gray-600">Группа: {student.class}</p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <FaPhone className="w-4 h-4 mr-2" />
                  <span>{student.phone}</span>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <FaEnvelope className="w-4 h-4 mr-2" />
                  <span>{student.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onViewDetails={handleViewDetails}
        />
      )}
    </div>
  );
};

export default StudentsPage; 