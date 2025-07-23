import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupplyService } from './supply.service';
import { CreatePurchaseRequestDto, CreateSupplierDto, CreateSupplierQuoteDto } from './dto/create-purchase-request.dto';

@ApiTags('supply')
@Controller('supply')
export class SupplyController {
  constructor(private readonly supplyService: SupplyService) {}

  // Purchase Requests
  @Post('requests')
  @ApiOperation({ summary: 'Создать заявку на закупку' })
  @ApiResponse({ status: 201, description: 'Заявка создана' })
  async createPurchaseRequest(@Body() createDto: CreatePurchaseRequestDto) {
    return this.supplyService.createPurchaseRequest(createDto);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Получить список заявок на закупку' })
  async findAllPurchaseRequests(@Query() filters?: any) {
    return this.supplyService.findAllPurchaseRequests(filters);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Получить заявку по ID' })
  async findOnePurchaseRequest(@Param('id') id: string) {
    return this.supplyService.findOnePurchaseRequest(parseInt(id));
  }

  @Patch('requests/:id/status')
  @ApiOperation({ summary: 'Обновить статус заявки' })
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
  @ApiOperation({ summary: 'Создать поставщика' })
  async createSupplier(@Body() createDto: CreateSupplierDto) {
    return this.supplyService.createSupplier(createDto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Получить список поставщиков' })
  async findAllSuppliers(@Query() filters?: any) {
    return this.supplyService.findAllSuppliers(filters);
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Получить поставщика по ID' })
  async findOneSupplier(@Param('id') id: string) {
    return this.supplyService.findOneSupplier(parseInt(id));
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Обновить поставщика' })
  async updateSupplier(@Param('id') id: string, @Body() updateDto: Partial<CreateSupplierDto>) {
    return this.supplyService.updateSupplier(parseInt(id), updateDto);
  }

  // Quotes
  @Post('quotes')
  @ApiOperation({ summary: 'Создать предложение поставщика' })
  async createSupplierQuote(@Body() createDto: CreateSupplierQuoteDto) {
    return this.supplyService.createSupplierQuote(createDto);
  }

  @Patch('quotes/:id/select')
  @ApiOperation({ summary: 'Выбрать предложение поставщика' })
  selectSupplierQuote(@Param('id') id: string) {
    return this.supplyService.selectSupplierQuote(parseInt(id));
  }

  // Analytics
  @Get('analytics')
  @ApiOperation({ summary: 'Получить аналитику по снабжению' })
  getSupplyAnalytics() {
    return this.supplyService.getSupplyAnalytics();
  }

  // Purchase Orders
  @Post('orders')
  @ApiOperation({ summary: 'Создать заказ на закупку' })
  createPurchaseOrder(@Body() createDto: any) {
    return this.supplyService.createPurchaseOrder(createDto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Получить список заказов' })
  findAllPurchaseOrders(@Query() filters?: any) {
    return this.supplyService.findAllPurchaseOrders(filters);
  }
}
