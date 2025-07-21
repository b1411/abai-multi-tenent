import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, PaymentStatus, PaymentMethod } from '../dto/create-payment.dto';

export class Payment {
  @ApiProperty({ description: 'ID платежа' })
  id: number;

  @ApiProperty({ description: 'ID студента' })
  studentId: number;

  @ApiProperty({ description: 'Сумма платежа', example: 150000.00 })
  amount: number;

  @ApiProperty({ description: 'Тип платежа', enum: PaymentType })
  type: PaymentType;

  @ApiProperty({ description: 'Метод оплаты', enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ description: 'Статус платежа', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Описание платежа', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Дата платежа' })
  paymentDate: Date;

  @ApiPropertyOptional({ description: 'Дата окончания срока платежа', nullable: true })
  dueDate: Date | null;

  @ApiPropertyOptional({ description: 'Номер счета или транзакции', nullable: true })
  invoiceNumber: string | null;

  @ApiPropertyOptional({ description: 'ID транзакции во внешней системе', nullable: true })
  externalTransactionId: string | null;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления записи' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления записи', nullable: true })
  deletedAt: Date | null;
}
