import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';
import { StoresService } from './stores.service';

@Controller('admin/stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SYSTEM_ADMIN)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  async create(@Body() dto: CreateStoreDto) {
    return { data: await this.storesService.create(dto) };
  }

  @Get()
  findAll(@Query() query: ListStoresDto) {
    return this.storesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return { data: await this.storesService.findOne(id) };
  }
}
