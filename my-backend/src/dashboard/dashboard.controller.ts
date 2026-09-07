import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from "../auth/roles.enum";
import { Roles } from "../auth/roles.decorator";
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MODERATOR,
)
export class DashboardController {
    constructor( private readonly dashboardService: DashboardService) {}

    @Get('stats')
    getStats(){
        console.log("stats endpoint hit");
       return this.dashboardService.getStats()
    }
}
