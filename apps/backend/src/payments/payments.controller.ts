import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
  @Roles('ADMIN', 'FINANCIST')
  getSummary() {
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

  @Get(':id/invoice')
  @Roles('ADMIN', 'FINANCIST', 'PARENT')
  generateInvoice(@Param('id') id: string, @Request() req) {
    return this.paymentsService.generateInvoice(+id, req.user);
  }
}
