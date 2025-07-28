import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequirePermission } from '../common/guards/permission.guard';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { CreateMovementDto, UpdateStatusDto, CreateMaintenanceDto } from './dto/create-movement.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Post()
  @RequirePermission('inventory', 'create')
  @ApiOperation({ summary: 'Создать новый элемент инвентаря' })
  @ApiResponse({ status: 201, description: 'Элемент успешно создан' })
  create(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryService.create(createInventoryItemDto);
  }

  @Get()
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Получить список инвентаря' })
  @ApiResponse({ status: 200, description: 'Список инвентаря получен' })
  findAll(@Query() filters: InventoryFilterDto) {
    return this.inventoryService.findAll(filters);
  }

  @Get('scan/:code')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Получить информацию по QR/штрих-коду' })
  @ApiResponse({ status: 200, description: 'Элемент найден' })
  @ApiResponse({ status: 404, description: 'Элемент не найден' })
  findByCode(@Param('code') code: string) {
    return this.inventoryService.findByCode(code);
  }

  @Get('export')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Экспорт данных инвентаря' })
  @ApiResponse({ status: 200, description: 'Данные экспортированы' })
  export(@Query() filters: InventoryFilterDto, @Query('format') format: string = 'xlsx') {
    return this.inventoryService.export(filters, format);
  }

  @Get(':id')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Получить элемент инвентаря по ID' })
  @ApiResponse({ status: 200, description: 'Элемент найден' })
  @ApiResponse({ status: 404, description: 'Элемент не найден' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('inventory', 'update')
  @ApiOperation({ summary: 'Обновить элемент инвентаря' })
  @ApiResponse({ status: 200, description: 'Элемент обновлен' })
  update(@Param('id') id: string, @Body() updateInventoryItemDto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, updateInventoryItemDto);
  }

  @Delete(':id')
  @RequirePermission('inventory', 'delete')
  @ApiOperation({ summary: 'Удалить элемент инвентаря' })
  @ApiResponse({ status: 200, description: 'Элемент удален' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Post(':id/movement')
  @RequirePermission('inventory', 'update')
  @ApiOperation({ summary: 'Зарегистрировать перемещение' })
  @ApiResponse({ status: 201, description: 'Перемещение зарегистрировано' })
  createMovement(@Param('id') id: string, @Body() createMovementDto: CreateMovementDto) {
    return this.inventoryService.createMovement(id, createMovementDto);
  }

  @Patch(':id/status')
  @RequirePermission('inventory', 'update')
  @ApiOperation({ summary: 'Обновить статус элемента' })
  @ApiResponse({ status: 200, description: 'Статус обновлен' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.inventoryService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/maintenance')
  @RequirePermission('inventory', 'create')
  @ApiOperation({ summary: 'Зарегистрировать техническое обслуживание' })
  @ApiResponse({ status: 201, description: 'ТО зарегистрировано' })
  createMaintenance(@Param('id') id: string, @Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.inventoryService.createMaintenance(id, createMaintenanceDto);
  }
}
