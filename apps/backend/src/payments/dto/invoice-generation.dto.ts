import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ 
    enum: InvoiceType, 
    default: InvoiceType.PAYMENT,
    description: 'Тип квитанции'
  })
  @IsEnum(InvoiceType)
  @IsOptional()
  type?: InvoiceType = InvoiceType.PAYMENT;

  @ApiProperty({ 
    enum: InvoiceFormat, 
    default: InvoiceFormat.PDF,
    description: 'Формат файла'
  })
  @IsEnum(InvoiceFormat)
  @IsOptional()
  format?: InvoiceFormat = InvoiceFormat.PDF;

  @ApiProperty({ 
    required: false,
    description: 'Дополнительные комментарии'
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ 
    required: false,
    description: 'Включить QR код для оплаты'
  })
  @IsOptional()
  includeQrCode?: boolean = true;
}

export class GenerateSummaryInvoiceDto extends GenerateInvoiceDto {
  @ApiProperty({ 
    required: false,
    description: 'Дата начала периода (для сводных квитанций)'
  })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ 
    required: false,
    description: 'Дата окончания периода (для сводных квитанций)'
  })
  @IsOptional()
  endDate?: string;
}
