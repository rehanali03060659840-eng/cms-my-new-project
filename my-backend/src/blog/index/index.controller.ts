
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IndexService } from './index.service';
import { CreateIndexDto } from '../DTO/create-index.dto';
import { Role } from "../../auth/roles.enum";
import { Roles } from "../../auth/roles.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
@Controller('index')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,)
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Post()
  create(@Body() createIndexDto: CreateIndexDto) {
    return this.indexService.create(createIndexDto);
  }

  @Get()
  findAll() {
    return this.indexService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.indexService.findOne(slug);
  }

  @Put(':slug')
  update(
    @Param('slug') slug: string,
    @Body() updateData: Partial<CreateIndexDto>,
  ) {
    return this.indexService.update(slug, updateData);
  }

  @Delete(':slug')
  delete(@Param('slug') slug: string) {
    return this.indexService.delete(slug);
  }
}