# Система генерации квитанций об оплате и задолженности

## Обзор

Система позволяет генерировать профессиональные квитанции об оплате и задолженности в форматах PDF и HTML. Поддерживает как индивидуальные квитанции для конкретных платежей, так и сводные отчеты по всем платежам студента за период.

## Основные возможности

### 1. Типы квитанций
- **Квитанция об оплате** - документ для подтверждения необходимости оплаты
- **Уведомление о задолженности** - документ для информирования о просроченных платежах
- **Сводная квитанция** - общий отчет по всем платежам студента за период

### 2. Форматы документов
- **PDF** - готовый к печати документ с профессиональным оформлением
- **HTML** - веб-версия для быстрого просмотра и отправки по электронной почте

### 3. Дополнительные опции
- QR-код для быстрой оплаты
- Фильтрация по периоду (для сводных квитанций)
- Добавление примечаний
- Адаптивный дизайн для мобильных устройств

## Архитектура

### Backend компоненты

#### 1. DTO (Data Transfer Objects)
```typescript
// apps/backend/src/payments/dto/invoice-generation.dto.ts
export enum InvoiceType {
  PAYMENT = 'payment',
  DEBT = 'debt', 
  SUMMARY = 'summary'
}

export enum InvoiceFormat {
  PDF = 'pdf',
  HTML = 'html'
}

export class GenerateInvoiceDto {
  type?: InvoiceType = InvoiceType.PAYMENT;
  format?: InvoiceFormat = InvoiceFormat.PDF;
  startDate?: string;
  endDate?: string;
  notes?: string;
  includeQrCode?: boolean = true;
}
```

#### 2. Сервис генерации
```typescript
// apps/backend/src/payments/invoice-generator.service.ts
@Injectable()
export class InvoiceGeneratorService {
  // Генерация квитанции для конкретного платежа
  async generateInvoice(paymentId: number, generateDto: GenerateInvoiceDto, user?: any)
  
  // Генерация сводной квитанции для студента
  async generateSummaryInvoice(studentId: number, generateDto: GenerateInvoiceDto, user?: any)
  
  // Приватные методы для генерации HTML и PDF
  private generateHtmlContent(payment: any, generateDto: GenerateInvoiceDto): string
  private generateSummaryHtmlContent(payments: any[], generateDto: GenerateInvoiceDto): string
  private generatePdf(htmlContent: string): Promise<Buffer>
}
```

#### 3. Контроллер
```typescript
// apps/backend/src/payments/payments.controller.ts
@Post(':id/invoice')
@Roles('ADMIN', 'FINANCIST', 'PARENT')
async generateInvoice(@Param('id') id: string, @Body() generateDto: GenerateInvoiceDto, @Request() req, @Response() res)

@Post('student/:studentId/summary-invoice')  
@Roles('ADMIN', 'FINANCIST', 'PARENT')
async generateSummaryInvoice(@Param('studentId') studentId: string, @Body() generateDto: GenerateInvoiceDto, @Request() req, @Response() res)
```

### Frontend компоненты

#### 1. Сервис
```typescript
// apps/frontend/src/services/financeService.ts
async generateInvoice(id: string, options: {
  type?: 'payment' | 'debt' | 'summary';
  format?: 'pdf' | 'html';
  startDate?: string;
  endDate?: string;
  notes?: string;
  includeQrCode?: boolean;
}): Promise<Blob>

async generateSummaryInvoice(studentId: string, options: {...}): Promise<Blob>
```

#### 2. Компонент генератора
```typescript
// apps/frontend/src/components/InvoiceGenerator.tsx
interface InvoiceGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId?: string;
  studentId?: string;
  mode: 'single' | 'summary';
  studentName?: string;
}
```

## API Endpoints

### 1. Генерация квитанции для платежа
```
POST /api/payments/:id/invoice
```

**Body:**
```json
{
  "type": "payment",
  "format": "pdf",
  "notes": "Дополнительная информация",
  "includeQrCode": true
}
```

**Response:** Binary file (PDF/HTML)

### 2. Генерация сводной квитанции
```
POST /api/payments/student/:studentId/summary-invoice
```

**Body:**
```json
{
  "type": "summary", 
  "format": "pdf",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "notes": "Сводная квитанция за январь",
  "includeQrCode": true
}
```

## Безопасность и контроль доступа

### Роли и права доступа
- **ADMIN**: Полный доступ ко всем функциям
- **FINANCIST**: Полный доступ ко всем функциям
- **PARENT**: Доступ только к квитанциям своих детей

### Проверка прав доступа
```typescript
// Для родителей проверяется принадлежность студента
if (user && user.role === 'PARENT') {
  const parent = await this.prisma.parent.findUnique({
    where: { userId: user.id },
    include: { students: { select: { id: true } } }
  });
  
  if (!parent || !parent.students.some(s => s.id === studentId)) {
    throw new Error('Access denied');
  }
}
```

## Шаблоны квитанций

### 1. Структура HTML-шаблона
- **Заголовок** - название организации, тип квитанции, номер и дата
- **Информационные блоки** - данные студента и платежа
- **Сумма** - выделенная секция с суммой к оплате
- **QR-код** - опциональный блок для быстрой оплаты
- **Подвал** - дата генерации и информация об организации

### 2. Стилизация
- Профессиональное оформление с корпоративными цветами
- Адаптивный дизайн для различных экранов
- Подготовка к печати (@media print)
- Цветовое кодирование статусов платежей

## Зависимости

### Backend
```json
{
  "puppeteer": "^24.15.0"
}
```

### Технологии
- **Puppeteer** - генерация PDF из HTML
- **NestJS** - фреймворк backend
- **Prisma** - ORM для работы с БД
- **TypeScript** - типизированный JavaScript

## Использование

### 1. Из интерфейса платежей
```typescript
// В таблице платежей
<button onClick={() => handleGenerateInvoice(payment)}>
  Сформировать квитанцию
</button>

<button onClick={() => handleGenerateSummaryInvoice(payment)}>
  Сводная квитанция  
</button>
```

### 2. Из дашборда финансиста
```typescript
<button onClick={() => setShowInvoiceGenerator(true)}>
  Генерация отчетов
</button>
```

### 3. Программный вызов
```typescript
const invoice = await financeService.generateInvoice(paymentId, {
  type: 'payment',
  format: 'pdf',
  includeQrCode: true
});

// Скачивание файла
const url = window.URL.createObjectURL(invoice);
const link = document.createElement('a');
link.href = url;
link.download = `invoice_${paymentId}.pdf`;
link.click();
```

## Примеры квитанций

### 1. Квитанция об оплате
- Зеленые акценты
- Сумма к оплате
- QR-код для оплаты
- Статус платежа

### 2. Уведомление о задолженности  
- Красные акценты
- Сумма задолженности
- Срок просрочки
- Контактная информация

### 3. Сводная квитанция
- Таблица всех платежей за период
- Общие итоги (к оплате/оплачено/задолженность)
- Детализация по каждому платежу
- Статистика по периоду

## Обработка ошибок

### 1. Платеж не найден
```typescript
if (!payment) {
  throw new Error('Payment not found or access denied');
}
```

### 2. Нет платежей за период
```typescript
if (!payments || payments.length === 0) {
  throw new Error('No payments found for the specified period');
}
```

### 3. Ошибка генерации PDF
```typescript
try {
  const pdfBuffer = await this.generatePdf(htmlContent);
  return Buffer.from(pdfBuffer);
} finally {
  await browser.close();
}
```

## Производительность

### 1. Оптимизация Puppeteer
- Переиспользование браузера
- Минимальные аргументы запуска
- Закрытие браузера в finally блоке

### 2. Кеширование
- HTML-шаблоны компилируются один раз
- Статические стили встроены в шаблон

### 3. Асинхронная обработка
- Все операции с БД асинхронные
- Генерация PDF не блокирует основной поток

## Расширение функциональности

### 1. Новые типы квитанций
```typescript
export enum InvoiceType {
  PAYMENT = 'payment',
  DEBT = 'debt',
  SUMMARY = 'summary',
  RECEIPT = 'receipt'  // Новый тип
}
```

### 2. Дополнительные форматы
```typescript
export enum InvoiceFormat {
  PDF = 'pdf',
  HTML = 'html', 
  DOCX = 'docx'  // Новый формат
}
```

### 3. Настройка шаблонов
- Добавление логотипа организации
- Настройка цветовой схемы
- Персонализация содержимого
