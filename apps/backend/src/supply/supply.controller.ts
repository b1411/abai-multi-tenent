import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupplyService } from './supply.service';
import { CreatePurchaseRequestDto, CreateSupplierDto, CreateSupplierQuoteDto } from './dto/create-purchase-request.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';

@ApiTags('supply')
@Controller('supply')
@UseGuards(AuthGuard, PermissionGuard)
@ApiBearerAuth()
export class SupplyController {
  constructor(private readonly supplyService: SupplyService) {}

  // Purchase Requests
  @Post('requests')
  @RequirePermission('supply', 'create')
  @ApiOperation({ summary: 'Создать заявку на закупку' })
  @ApiResponse({ status: 201, description: 'Заявка создана' })
  async createPurchaseRequest(@Body() createDto: CreatePurchaseRequestDto) {
    return this.supplyService.createPurchaseRequest(createDto);
  }

  @Get('requests')
  @RequirePermission('supply', 'read')
  @ApiOperation({ summary: 'Получить список заявок на закупку' })
  @ApiResponse({ status: 200, description: 'Список заявок получен' })
  async findAllPurchaseRequests(@Query() filters?: any) {
    return this.supplyService.findAllPurchaseRequests(filters);
  }

  @Get('requests/:id')
  @RequirePermission('supply', 'read')
  @ApiOperation({ summary: 'Получить заявку по ID' })
  @ApiResponse({ status: 200, description: 'Заявка найдена' })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  async findOnePurchaseRequest(@Param('id') id: string) {
    return this.supplyService.findOnePurchaseRequest(parseInt(id));
  }

  @Patch('requests/:id/status')
  @RequirePermission('supply', 'update')
  @ApiOperation({ summary: 'Обновить статус заявки' })
  @ApiResponse({ status: 200, description: 'Статус заявки обновлен' })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  async updatePurchaseRequestStatus(
    @Param('id') id: string,
    @Body() updateDto: { status: string; approvedBy?: number; rejectionReason?: string }
  ) {
    return this.supplyService.updatePurchaseRequestStatus(
      parseInt(id),
      updateDto.status,
      updateDto.approvedBy,
      updateDto.rejectionReason
    );
  }

  // Suppliers
  @Post('suppliers')
  @RequirePermission('supply', 'create')
  @ApiOperation({ summary: 'Создать поставщика' })
  @ApiResponse({ status: 201, description: 'Поставщик создан' })
  async createSupplier(@Body() createDto: CreateSupplierDto) {
    return this.supplyService.createSupplier(createDto);
  }

  @Get('suppliers')
  @RequirePermission('supply', 'read')
  @ApiOperation({ summary: 'Получить список поставщиков' })
  @ApiResponse({ status: 200, description: 'Список поставщиков получен' })
  async findAllSuppliers(@Query() filters?: any) {
    return this.supplyService.findAllSuppliers(filters);
  }

  @Get('suppliers/:id')
  @RequirePermission('supply', 'read')
  @ApiOperation({ summary: 'Получить поставщика по ID' })
  @ApiResponse({ status: 200, description: 'Поставщик найден' })
  @ApiResponse({ status: 404, description: 'Поставщик не найден' })
  async findOneSupplier(@Param('id') id: string) {
    return this.supplyService.findOneSupplier(parseInt(id));
  }

  @Patch('suppliers/:id')
  @RequirePermission('supply', 'update')
  @ApiOperation({ summary: 'Обновить поставщика' })
  @ApiResponse({ status: 200, description: 'Поставщик обновлен' })
  @ApiResponse({ status: 404, description: 'Поставщик не найден' })
  async updateSupplier(@Param('id') id: string, @Body() updateDto: Partial<CreateSupplierDto>) {
    return this.supplyService.updateSupplier(parseInt(id), updateDto);
  }

  // Quotes
  @Post('quotes')
  @RequirePermission('supply', 'create')
  @ApiOperation({ summary: 'Создать предложение поставщика' })
  @ApiResponse({ status: 201, description: 'Предложение создано' })
  async createSupplierQuote(@Body() createDto: CreateSupplierQuoteDto) {
    return this.supplyService.createSupplierQuote(createDto);
  }

  @Patch('quotes/:id/select')
  @RequirePermission('supply', 'update')
  @ApiOperation({ summary: 'Выбрать предложение поставщика' })
  @ApiResponse({ status: 200, description: 'Предложение выбрано' })
  @ApiResponse({ status: 404, description: 'Предложение не найдено' })
  selectSupplierQuote(@Param('id') id: string) {
    return this.supplyService.selectSupplierQuote(parseInt(id));
  }

  // Analytics
  @Get('analytics')
  @RequirePermission('supply', 'read')
  @ApiOperation({ summary: 'Получить аналитику по снабжению' })
  @ApiResponse({ status: 200, description: 'Аналитика снабжения получена' })
  getSupplyAnalytics() {
    return this.supplyService.getSupplyAnalytics();
  }

  // Purchase Orders
  @Post('orders')
  @RequirePermission('supply', 'create')
  @ApiOperation({ summary: 'Создать заказ на закупку' })
  @ApiResponse({ status: 201, description: 'Заказ на закупку создан' })
  createPurchaseOrder(@Body() createDto: any) {
    return this.supplyService.createPurchaseOrder(createDto);
  }

  @Get('orders')
  @RequirePermission('supply', 'read')
  @ApiOperation({ summary: 'Получить список заказов' })
  @ApiResponse({ status: 200, description: 'Список заказов получен' })
  findAllPurchaseOrders(@Query() filters?: any) {
    return this.supplyService.findAllPurchaseOrders(filters);
  }
}
