import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TermsConditionsService } from './terms-conditions.service';
import { CreateTermsConditionsDto } from './dto/create-terms-conditions.dto';
import { UpdateTermsConditionsDto } from './dto/update-terms-conditions.dto';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
@Controller('setting/terms-conditions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,)
export class TermsConditionsController {
  constructor(private readonly service: TermsConditionsService) {}

  @Post()
  create(@Body() dto: CreateTermsConditionsDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateTermsConditionsDto) {
    return this.service.update(slug, dto);
  }
}
