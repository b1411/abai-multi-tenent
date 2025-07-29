import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateInvoiceDto, GenerateSummaryInvoiceDto, InvoiceType, InvoiceFormat } from './dto/invoice-generation.dto';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class InvoiceGeneratorService {
  constructor(private prisma: PrismaService) { }

  async generateInvoice(paymentId: number, generateDto: GenerateInvoiceDto, user?: any) {
    // Получаем данные о платеже
    const payment = await this.getPaymentData(paymentId, user);

    if (!payment) {
      throw new Error('Payment not found or access denied');
    }

    // Генерируем HTML контент
    const htmlContent = this.generateHtmlContent(payment, generateDto);

    if (generateDto.format === InvoiceFormat.HTML) {
      return {
        content: htmlContent,
        filename: `invoice_${paymentId}_${Date.now()}.html`,
        contentType: 'text/html'
      };
    }

    // Генерируем PDF
    const pdfBuffer = await this.generatePdf(htmlContent);

    return {
      content: pdfBuffer,
      filename: `invoice_${paymentId}_${Date.now()}.pdf`,
      contentType: 'application/pdf'
    };
  }

  async generateSummaryInvoice(studentId: number, generateDto: GenerateSummaryInvoiceDto, user?: any) {
    // Получаем все платежи студента за период
    const payments = await this.getStudentPayments(studentId, generateDto, user);

    if (!payments || payments.length === 0) {
      throw new Error('No payments found for the specified period');
    }

    // Генерируем HTML контент для сводной квитанции
    const htmlContent = this.generateSummaryHtmlContent(payments, generateDto);

    if (generateDto.format === InvoiceFormat.HTML) {
      return {
        content: htmlContent,
        filename: `summary_invoice_${studentId}_${Date.now()}.html`,
        contentType: 'text/html'
      };
    }

    // Генерируем PDF
    const pdfBuffer = await this.generatePdf(htmlContent);

    return {
      content: pdfBuffer,
      filename: `summary_invoice_${studentId}_${Date.now()}.pdf`,
      contentType: 'application/pdf'
    };
  }

  private async getPaymentData(paymentId: number, user?: any) {
    const whereClause: any = { id: paymentId };

    // Если пользователь родитель, проверяем доступ
    if (user && user.role === 'PARENT') {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: user.id },
        include: { students: { select: { id: true } } }
      });

      if (parent) {
        const studentIds = parent.students.map(s => s.id);
        whereClause.studentId = { in: studentIds };
      } else {
        return null;
      }
    }

    return await this.prisma.payment.findFirst({
      where: whereClause,
      include: {
        student: {
          include: {
            user: true,
            group: true,
            Parents: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });
  }

  private async getStudentPayments(studentId: number, generateDto: GenerateSummaryInvoiceDto, user?: any) {
    const whereClause: any = { studentId };

    // Если пользователь родитель, проверяем доступ
    if (user && user.role === 'PARENT') {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: user.id },
        include: { students: { select: { id: true } } }
      });

      if (!parent || !parent.students.some(s => s.id === studentId)) {
        return null;
      }
    }

    // Добавляем фильтры по датам если указаны
    if (generateDto.startDate || generateDto.endDate) {
      whereClause.dueDate = {};
      if (generateDto.startDate) {
        whereClause.dueDate.gte = new Date(generateDto.startDate);
      }
      if (generateDto.endDate) {
        whereClause.dueDate.lte = new Date(generateDto.endDate);
      }
    }

    return await this.prisma.payment.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: true,
            group: true,
            Parents: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    });
  }

  private generateHtmlContent(payment: any, generateDto: GenerateInvoiceDto): string {
    const isDebtInvoice = generateDto.type === InvoiceType.DEBT;
    const student = payment.student;
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const statusClass = this.getStatusClass(payment.status);
    const statusText = this.getStatusText(payment.status);

    const qrCodeSection = generateDto.includeQrCode ? `
      <div class="qr-section">
        <div class="qr-placeholder">
          <p>QR код для оплаты</p>
          <div class="qr-box">QR</div>
        </div>
      </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Квитанция ${isDebtInvoice ? 'о задолженности' : 'об оплате'}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .organization-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .invoice-title {
            font-size: 20px;
            color: #374151;
            margin-bottom: 5px;
        }
        .invoice-number {
            color: #6b7280;
            font-size: 14px;
        }
        .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-block h3 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        .info-label {
            font-weight: 600;
            color: #374151;
        }
        .info-value {
            color: #6b7280;
        }
        .payment-details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .amount-section {
            text-align: center;
            background: ${isDebtInvoice ? '#fee2e2' : '#ecfdf5'};
            border: 2px solid ${isDebtInvoice ? '#fca5a5' : '#86efac'};
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .amount-label {
            font-size: 16px;
            color: #374151;
            margin-bottom: 10px;
        }
        .amount-value {
            font-size: 32px;
            font-weight: bold;
            color: ${isDebtInvoice ? '#dc2626' : '#059669'};
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-unpaid { background: #fee2e2; color: #991b1b; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-overdue { background: #fecaca; color: #7f1d1d; }
        .qr-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px dashed #d1d5db;
        }
        .qr-box {
            width: 120px;
            height: 120px;
            border: 2px solid #d1d5db;
            margin: 10px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9fafb;
            font-weight: bold;
            color: #6b7280;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .notes {
            background: #fffbeb;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        @media print {
            body { background: white; }
            .invoice-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="organization-name">Центр "Абай"</div>
            <div class="invoice-title">Квитанция ${isDebtInvoice ? 'о задолженности' : 'об оплате'}</div>
            <div class="invoice-number">№ ${payment.id} от ${currentDate}</div>
        </div>

        <div class="info-section">
            <div class="info-block">
                <h3>Данные студента</h3>
                <div class="info-item">
                    <span class="info-label">ФИО:</span>
                    <span class="info-value">${student.user.surname} ${student.user.name} ${student.user.middlename || ''}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Группа:</span>
                    <span class="info-value">${student.group.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">ID студента:</span>
                    <span class="info-value">${student.id}</span>
                </div>
            </div>

            <div class="info-block">
                <h3>Данные об оплате</h3>
                <div class="info-item">
                    <span class="info-label">Услуга:</span>
                    <span class="info-value">${payment.serviceName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Срок оплаты:</span>
                    <span class="info-value">${new Date(payment.dueDate).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Статус:</span>
                    <span class="info-value">
                        <span class="status-badge status-${statusClass}">${statusText}</span>
                    </span>
                </div>
            </div>
        </div>

        <div class="amount-section">
            <div class="amount-label">${isDebtInvoice ? 'Сумма задолженности' : 'Сумма к оплате'}</div>
            <div class="amount-value">${payment.amount.toLocaleString('ru-RU')} ₸</div>
            ${payment.paidAmount > 0 ? `<div style="margin-top: 10px; color: #059669;">Оплачено: ${payment.paidAmount.toLocaleString('ru-RU')} ₸</div>` : ''}
        </div>

        ${generateDto.notes ? `
        <div class="notes">
            <strong>Примечания:</strong> ${generateDto.notes}
        </div>
        ` : ''}

        ${qrCodeSection}

        <div class="footer">
            <p>Документ сформирован автоматически ${currentDate}</p>
            <p>Центр "Абай" • Система управления образованием</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateSummaryHtmlContent(payments: any[], generateDto: GenerateSummaryInvoiceDto): string {
    if (payments.length === 0) return '';

    const student = payments[0].student;
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalDebt = totalAmount - totalPaid;

    const paymentRows = payments.map(payment => {
      const statusClass = this.getStatusClass(payment.status);
      const statusText = this.getStatusText(payment.status);
      return `
        <tr>
          <td>${new Date(payment.dueDate).toLocaleDateString('ru-RU')}</td>
          <td>${payment.serviceName}</td>
          <td style="text-align: right;">${payment.amount.toLocaleString('ru-RU')} ₸</td>
          <td style="text-align: right;">${(payment.paidAmount || 0).toLocaleString('ru-RU')} ₸</td>
          <td style="text-align: center;">
            <span class="status-badge status-${statusClass}">${statusText}</span>
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Сводная квитанция</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .invoice-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .organization-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .payments-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .payments-table th,
        .payments-table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
        }
        .payments-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
        }
        .summary-section {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .summary-total {
            font-size: 18px;
            font-weight: bold;
            color: #0c4a6e;
            border-top: 2px solid #0ea5e9;
            padding-top: 10px;
            margin-top: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-unpaid { background: #fee2e2; color: #991b1b; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-overdue { background: #fecaca; color: #7f1d1d; }
        .student-info {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="organization-name">Центр "Абай"</div>
            <div class="invoice-title">Сводная квитанция</div>
            <div class="invoice-number">Период: ${generateDto.startDate ? new Date(generateDto.startDate).toLocaleDateString('ru-RU') + ' - ' : ''}${generateDto.endDate ? new Date(generateDto.endDate).toLocaleDateString('ru-RU') : 'по настоящее время'}</div>
        </div>

        <div class="student-info">
            <h3>Данные студента</h3>
            <p><strong>ФИО:</strong> ${student.user.surname} ${student.user.name} ${student.user.middlename || ''}</p>
            <p><strong>Группа:</strong> ${student.group.name}</p>
            <p><strong>ID студента:</strong> ${student.id}</p>
        </div>

        <h3>Детализация платежей</h3>
        <table class="payments-table">
            <thead>
                <tr>
                    <th>Дата</th>
                    <th>Услуга</th>
                    <th>Сумма</th>
                    <th>Оплачено</th>
                    <th>Статус</th>
                </tr>
            </thead>
            <tbody>
                ${paymentRows}
            </tbody>
        </table>

        <div class="summary-section">
            <h3>Итоги</h3>
            <div class="summary-row">
                <span>Общая сумма к оплате:</span>
                <span>${totalAmount.toLocaleString('ru-RU')} ₸</span>
            </div>
            <div class="summary-row">
                <span>Оплачено:</span>
                <span style="color: #059669;">${totalPaid.toLocaleString('ru-RU')} ₸</span>
            </div>
            <div class="summary-row summary-total">
                <span>Задолженность:</span>
                <span style="color: ${totalDebt > 0 ? '#dc2626' : '#059669'};">${totalDebt.toLocaleString('ru-RU')} ₸</span>
            </div>
        </div>

        <div class="footer">
            <p>Документ сформирован автоматически ${currentDate}</p>
            <p>Центр "Абай" • Система управления образованием</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private async generatePdf(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private getStatusClass(status: string): string {
    const statusMap = {
      'PAID': 'paid',
      'PENDING': 'unpaid',
      'PARTIAL': 'partial',
      'OVERDUE': 'overdue'
    };
    return statusMap[status] || 'unpaid';
  }

  private getStatusText(status: string): string {
    const statusMap = {
      'PAID': 'Оплачено',
      'PENDING': 'Ожидает оплаты',
      'PARTIAL': 'Частично оплачено',
      'OVERDUE': 'Просрочено'
    };
    return statusMap[status] || 'Неизвестно';
  }
}
