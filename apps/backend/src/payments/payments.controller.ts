import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый платеж' })
  @ApiResponse({ status: 201, description: 'Платеж успешно создан' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @Roles('ADMIN', 'HR')
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все платежи' })
  @ApiResponse({ status: 200, description: 'Список всех платежей' })
  @Roles('ADMIN', 'HR')
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Получить платежи студента' })
  @ApiResponse({ status: 200, description: 'Платежи указанного студента' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @Roles('ADMIN', 'HR', 'STUDENT', 'PARENT')
  findByStudent(@Param('studentId') studentId: string) {
    return this.paymentsService.findByStudent(+studentId);
  }

  @Get('student/:studentId/summary')
  @ApiOperation({ summary: 'Получить сводку платежей студента' })
  @ApiResponse({ status: 200, description: 'Сводка платежей студента' })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @Roles('ADMIN', 'HR', 'STUDENT', 'PARENT')
  getStudentSummary(@Param('studentId') studentId: string) {
    return this.paymentsService.getStudentPaymentSummary(+studentId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Получить платежи по статусу' })
  @ApiResponse({ status: 200, description: 'Платежи с указанным статусом' })
  @ApiParam({ name: 'status', description: 'Статус платежей (PENDING, COMPLETED, etc.)' })
  @Roles('ADMIN', 'HR')
  findByStatus(@Param('status') status: string) {
    return this.paymentsService.findByStatus(status);
  }

  @Get('search')
  @ApiOperation({ summary: 'Поиск платежей' })
  @ApiResponse({ status: 200, description: 'Результаты поиска платежей' })
  @ApiQuery({ name: 'q', description: 'Поисковый запрос' })
  @Roles('ADMIN', 'HR')
  search(@Query('q') query: string) {
    return this.paymentsService.searchPayments(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику платежей' })
  @ApiResponse({ status: 200, description: 'Статистика платежей' })
  @Roles('ADMIN', 'HR')
  getStatistics() {
    return this.paymentsService.getPaymentStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить платеж по ID' })
  @ApiResponse({ status: 200, description: 'Информация о платеже' })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @Roles('ADMIN', 'HR', 'STUDENT', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить платеж' })
  @ApiResponse({ status: 200, description: 'Платеж успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @Roles('ADMIN', 'HR')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Patch(':id/process')
  @ApiOperation({ summary: 'Обработать платеж' })
  @ApiResponse({ status: 200, description: 'Платеж переведен в статус обработки' })
  @ApiResponse({ status: 400, description: 'Платеж не может быть обработан' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @Roles('ADMIN', 'HR')
  process(@Param('id') id: string) {
    return this.paymentsService.processPayment(+id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Завершить платеж' })
  @ApiResponse({ status: 200, description: 'Платеж успешно завершен' })
  @ApiResponse({ status: 400, description: 'Платеж не может быть завершен' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @Roles('ADMIN', 'HR')
  complete(@Param('id') id: string) {
    return this.paymentsService.completePayment(+id);
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: 'Отметить платеж как неуспешный' })
  @ApiResponse({ status: 200, description: 'Платеж отмечен как неуспешный' })
  @ApiResponse({ status: 400, description: 'Платеж не может быть отмечен как неуспешный' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @Roles('ADMIN', 'HR')
  fail(@Param('id') id: string) {
    return this.paymentsService.failPayment(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить платеж' })
  @ApiResponse({ status: 200, description: 'Платеж успешно удален' })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }

  // === МЕТОДЫ ДЛЯ РАБОТЫ С РОДИТЕЛЯМИ ===

  @Patch(':id/assign-parent/:parentId')
  @ApiOperation({ summary: 'Назначить платеж родителю' })
  @ApiResponse({ status: 200, description: 'Платеж успешно назначен родителю' })
  @ApiResponse({ status: 400, description: 'Родитель не связан с этим студентом' })
  @ApiResponse({ status: 404, description: 'Платеж или родитель не найден' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @ApiParam({ name: 'parentId', description: 'ID родителя' })
  @Roles('ADMIN', 'HR')
  assignToParent(@Param('id') id: string, @Param('parentId') parentId: string) {
    return this.paymentsService.assignPaymentToParent(+id, +parentId);
  }

  @Get('parent/:parentId')
  @ApiOperation({ summary: 'Получить все платежи родителя (за всех детей)' })
  @ApiResponse({ status: 200, description: 'Платежи родителя с детальной информацией' })
  @ApiResponse({ status: 404, description: 'Родитель не найден' })
  @ApiParam({ name: 'parentId', description: 'ID родителя' })
  @Roles('ADMIN', 'HR', 'PARENT')
  getParentPayments(@Param('parentId') parentId: string) {
    return this.paymentsService.getParentPayments(+parentId);
  }

  @Post('parent/:parentId/student/:studentId')
  @ApiOperation({ summary: 'Создать платеж родителем за своего ребенка' })
  @ApiResponse({ status: 201, description: 'Платеж успешно создан родителем' })
  @ApiResponse({ status: 400, description: 'Студент не связан с этим родителем' })
  @ApiResponse({ status: 404, description: 'Родитель или студент не найден' })
  @ApiParam({ name: 'parentId', description: 'ID родителя' })
  @ApiParam({ name: 'studentId', description: 'ID студента (ребенка)' })
  @Roles('ADMIN', 'HR', 'PARENT')
  createPaymentByParent(
    @Param('parentId') parentId: string,
    @Param('studentId') studentId: string,
    @Body() createPaymentDto: Omit<CreatePaymentDto, 'studentId'>
  ) {
    return this.paymentsService.createPaymentForParent(+parentId, +studentId, createPaymentDto);
  }

  @Patch(':id/pay-by-parent/:parentId')
  @ApiOperation({ summary: 'Оплатить платеж родителем' })
  @ApiResponse({ status: 200, description: 'Платеж успешно оплачен родителем' })
  @ApiResponse({ status: 400, description: 'Платеж не может быть оплачен или родитель не имеет прав' })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @ApiParam({ name: 'parentId', description: 'ID родителя' })
  @ApiQuery({ name: 'method', description: 'Метод оплаты', required: false })
  @Roles('ADMIN', 'HR', 'PARENT')
  payByParent(
    @Param('id') id: string, 
    @Param('parentId') parentId: string,
    @Query('method') method: string = 'CARD'
  ) {
    return this.paymentsService.payByParent(+id, +parentId, method);
  }
}
