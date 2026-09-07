import { Body, Controller, Get, Param, Patch, Post, UseGuards} from '@nestjs/common';
import { PrivacyPolicyService } from './privacy-policy.service';
import { CreatePrivacyPolicyDto } from './dto/create-privacy-policy.dto';
import { UpdatePrivacyPolicyDto } from './dto/update-privacy-policy.dto';
import { Role } from "../auth/roles.enum";
import { Roles } from "../auth/roles.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@Controller('setting/privacy-policy')
@UseGuards(JwtAuthGuard, RolesGuard)

@Roles(
  Role.SUPER_ADMIN,)

export class PrivacyPolicyController {
  constructor(private readonly service: PrivacyPolicyService) {}

  @Post()
  create(@Body() dto: CreatePrivacyPolicyDto) {
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
  update(@Param('slug') slug: string, @Body() dto: UpdatePrivacyPolicyDto) {
    return this.service.update(slug, dto);
  }

}
