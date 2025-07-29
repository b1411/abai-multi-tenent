import { Salary } from '../types/salary';
import { formatTenge } from '../utils/formatters';

// Динамический импорт для обхода проблем с сетью
let jsPDF: any = null;

// Асинхронная загрузка jsPDF
const loadPDFLibraries = async () => {
  try {
    if (!jsPDF) {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.default;
      
      // Загружаем автотаблицу
      await import('jspdf-autotable');
    }
    return jsPDF;
  } catch (error) {
    console.error('Ошибка загрузки PDF библиотек:', error);
    throw new Error('Не удалось загрузить библиотеки для создания PDF');
  }
};

export class SalaryPDFGenerator {
  private doc: any;

  constructor(PDFClass: any) {
    this.doc = new PDFClass();
  }

  private setupFonts() {
    // Устанавливаем поддержку кириллицы
    this.doc.setFont('helvetica');
  }

  private addHeader(employeeName: string, period: string, position: string) {
    // Логотип и заголовок компании
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AB.AI', 105, 20, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.text('РАСЧЕТНЫЙ ЛИСТ', 105, 30, { align: 'center' });
    
    // Линия под заголовком
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 35, 190, 35);
    
    // Информация о сотруднике
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    const employeeInfo = [
      { label: 'Сотрудник:', value: employeeName },
      { label: 'Период:', value: period },
      { label: 'Должность:', value: position || 'Преподаватель' }
    ];
    
    let yPos = 45;
    employeeInfo.forEach(info => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(info.label, 20, yPos);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(info.value, 60, yPos);
      yPos += 7;
    });
    
    return yPos + 5;
  }

  private addCalculationTable(salary: Salary, startY: number) {
    const tableData = [];
    
    // Базовая зарплата
    tableData.push([
      'Базовая ставка',
      `${salary.hourlyRate.toLocaleString('ru-RU')}₸/час`,
      ''
    ]);
    
    tableData.push([
      'Отработано часов',
      `${salary.hoursWorked} часов`,
      ''
    ]);
    
    tableData.push([
      'Базовая зарплата',
      '',
      formatTenge(salary.baseSalary)
    ]);
    
    // Пустая строка
    tableData.push(['', '', '']);
    
    // Надбавки
    if (salary.allowances && salary.allowances.length > 0) {
      tableData.push([
        { content: 'НАДБАВКИ:', styles: { fontStyle: 'bold' } },
        '',
        ''
      ]);
      
      salary.allowances.forEach(allowance => {
        const description = allowance.isPercentage 
          ? `${allowance.amount}%`
          : 'фиксированная';
        
        const calculatedAmount = allowance.isPercentage
          ? (salary.baseSalary * allowance.amount) / 100
          : allowance.amount;
          
        tableData.push([
          `• ${allowance.name}`,
          `(${description})`,
          `+${formatTenge(calculatedAmount)}`
        ]);
      });
      
      // Пустая строка
      tableData.push(['', '', '']);
    }
    
    // Премии
    if (salary.bonuses && salary.bonuses.length > 0) {
      tableData.push([
        { content: 'ПРЕМИИ:', styles: { fontStyle: 'bold' } },
        '',
        ''
      ]);
      
      salary.bonuses.forEach(bonus => {
        const description = bonus.isPercentage 
          ? `${bonus.amount}%`
          : 'фиксированная';
        
        const calculatedAmount = bonus.isPercentage
          ? (salary.baseSalary * bonus.amount) / 100
          : bonus.amount;
          
        tableData.push([
          `• ${bonus.name}`,
          `(${description})`,
          `+${formatTenge(calculatedAmount)}`
        ]);
      });
      
      // Пустая строка
      tableData.push(['', '', '']);
    }
    
    // Удержания
    if (salary.deductions && salary.deductions.length > 0) {
      tableData.push([
        { content: 'УДЕРЖАНИЯ:', styles: { fontStyle: 'bold' } },
        '',
        ''
      ]);
      
      salary.deductions.forEach(deduction => {
        const description = deduction.isPercentage 
          ? `${deduction.amount}%`
          : 'фиксированная';
        
        const calculatedAmount = deduction.isPercentage
          ? (salary.baseSalary * deduction.amount) / 100
          : deduction.amount;
          
        tableData.push([
          `• ${deduction.name}`,
          `(${description})`,
          `-${formatTenge(calculatedAmount)}`
        ]);
      });
      
      // Пустая строка
      tableData.push(['', '', '']);
    }
    
    // Итого
    tableData.push([
      { content: 'К ВЫПЛАТЕ:', styles: { fontStyle: 'bold', fontSize: 14 } },
      '',
      { content: formatTenge(salary.totalNet), styles: { fontStyle: 'bold', fontSize: 14 } }
    ]);

    this.doc.autoTable({
      startY: startY,
      head: [['Наименование', 'Описание', 'Сумма']],
      body: tableData,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [202, 24, 31],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });
    
    return (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addFooter(yPos: number) {
    // Линия над подписью
    this.doc.setLineWidth(0.3);
    this.doc.line(20, yPos, 190, yPos);
    
    // Дата формирования
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    this.doc.text(`Дата формирования: ${currentDate}`, 20, yPos + 10);
    
    // Подпись
    this.doc.text('Подготовлено системой AB.AI', 20, yPos + 20);
  }

  public generateSalarySlip(salary: Salary): void {
    this.setupFonts();
    
    // Формируем данные
    const employeeName = `${salary.teacher.user.surname} ${salary.teacher.user.name} ${salary.teacher.user.middlename || ''}`.trim();
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const period = `${monthNames[salary.month - 1]} ${salary.year}`;
    
    // Добавляем заголовок
    const tableStartY = this.addHeader(employeeName, period, 'Преподаватель');
    
    // Добавляем таблицу расчетов
    const footerY = this.addCalculationTable(salary, tableStartY);
    
    // Добавляем подвал
    this.addFooter(footerY);
    
    // Сохраняем файл
    const fileName = `Расчетный_лист_${salary.teacher.user.surname}_${monthNames[salary.month - 1]}_${salary.year}.pdf`;
    this.doc.save(fileName);
  }
}

export const salaryPDFService = {
  generateSalarySlip: async (salary: Salary): Promise<void> => {
    try {
      console.log('PDF Service: Начинаем генерацию PDF для:', salary.teacher.user.surname);
      
      // Загружаем библиотеки
      const PDFClass = await loadPDFLibraries();
      const generator = new SalaryPDFGenerator(PDFClass);
      generator.generateSalarySlip(salary);
      
      console.log('PDF Service: Генерация завершена успешно');
    } catch (error) {
      console.error('PDF Service: Ошибка при генерации PDF:', error);
      alert('Ошибка при создании PDF файла. Проверьте консоль для подробностей.');
    }
  },

  // Тестовая функция для проверки работы PDF
  testPDF: async (): Promise<void> => {
    try {
      console.log('Тестируем PDF генерацию...');
      
      // Создаем тестовые данные
      const testSalary: Salary = {
        id: 1,
        teacherId: 1,
        teacher: {
          id: 1,
          user: {
            id: 1,
            email: 'test@test.com',
            name: 'Тест',
            surname: 'Тестов',
            middlename: 'Тестович'
          }
        },
        hourlyRate: 15000,
        hoursWorked: 120,
        baseSalary: 1800000,
        allowances: [{
          id: 1,
          type: 'OTHER' as any,
          name: 'Тестовая надбавка',
          amount: 100000,
          isPercentage: false,
          comment: 'Тест',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],
        bonuses: [],
        deductions: [],
        totalGross: 1900000,
        totalNet: 1900000,
        month: 12,
        year: 2024,
        status: 'DRAFT' as any,
        comment: 'Тестовый расчет',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Загружаем библиотеки и создаем PDF
      const PDFClass = await loadPDFLibraries();
      const generator = new SalaryPDFGenerator(PDFClass);
      generator.generateSalarySlip(testSalary);
      
      console.log('Тест PDF завершен успешно');
      
    } catch (error) {
      console.error('Ошибка в тесте PDF:', error);
    }
  }
};

// Добавляем тестовую функцию в глобальную область для отладки
(window as any).testPDF = salaryPDFService.testPDF;
