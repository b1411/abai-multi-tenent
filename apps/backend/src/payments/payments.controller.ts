import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, Response } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { GenerateInvoiceDto, GenerateSummaryInvoiceDto } from './dto/invoice-generation.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Response as ExpressResponse } from 'express';

@Controller('payments')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('ADMIN', 'FINANCIST')
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @Roles('ADMIN', 'FINANCIST', 'PARENT')
  findAll(@Query() filters: PaymentFilterDto, @Request() req) {
    return this.paymentsService.findAll(filters, req.user);
  }

  @Get('summary')
  @Roles('ADMIN', 'FINANCIST', 'PARENT')
  getSummary(@Request() req) {
    // Для родителей возвращаем summary только по их детям
    if (req.user.role === 'PARENT') {
      return this.paymentsService.getParentSummary(req.user.id);
    }
    return this.paymentsService.getSummary();
  }

  @Get(':id')
  @Roles('ADMIN', 'FINANCIST', 'PARENT')
  findOne(@Param('id') id: string, @Request() req) {
    return this.paymentsService.findOne(+id, req.user);
  }

  @Patch(':id')
  @Roles('ADMIN', 'FINANCIST')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'FINANCIST')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }

  @Post(':id/remind')
  @Roles('ADMIN', 'FINANCIST')
  sendReminder(@Param('id') id: string, @Body() reminderData: any) {
    return this.paymentsService.sendReminder(+id, reminderData);
  }

  @Post(':id/invoice')
  @Roles('ADMIN', 'FINANCIST', 'PARENT')
  @ApiOperation({ summary: 'Сгенерировать квитанцию для платежа' })
  @ApiResponse({ status: 200, description: 'Квитанция успешно сгенерирована' })
  async generateInvoice(
    @Param('id') id: string, 
    @Body() generateDto: GenerateInvoiceDto,
    @Request() req,
    @Response() res: ExpressResponse
  ) {
    const invoice = await this.paymentsService.generateInvoice(+id, generateDto, req.user);
    
    res.setHeader('Content-Type', invoice.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.filename}"`);
    
    if (invoice.contentType === 'application/pdf') {
      res.send(invoice.content);
    } else {
      res.send(invoice.content);
    }
  }

  @Post('student/:studentId/summary-invoice')
  @Roles('ADMIN', 'FINANCIST', 'PARENT')
  @ApiOperation({ summary: 'Сгенерировать сводную квитанцию для студента' })
  @ApiResponse({ status: 200, description: 'Сводная квитанция успешно сгенерирована' })
  async generateSummaryInvoice(
    @Param('studentId') studentId: string,
    @Body() generateDto: GenerateSummaryInvoiceDto,
    @Request() req,
    @Response() res: ExpressResponse
  ) {
    const invoice = await this.paymentsService.generateSummaryInvoice(+studentId, generateDto, req.user);
    
    res.setHeader('Content-Type', invoice.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.filename}"`);
    
    if (invoice.contentType === 'application/pdf') {
      res.send(invoice.content);
    } else {
      res.send(invoice.content);
    }
  }
}
