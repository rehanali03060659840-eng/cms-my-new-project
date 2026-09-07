import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { LiveMeetService } from './live-meet.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Controller('live-meet')
export class LiveMeetController {
  constructor(
    private readonly service: LiveMeetService,
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
  ) {}

  @Get('history')
  async history(@Req() req: any, @Query('limit') limit = '50') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();
    const payload = await this.jwt.verifyAsync<any>(token);
    const currentUser = await this.userService.findById(payload.sub);

    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Super admin only');
    }

    return this.service.listHistory(Math.min(Number(limit) || 50, 100));
  }

  @Get('history/:meetingId')
  getOne(@Param('meetingId') meetingId: string) {
    return this.service.getHistory(meetingId);
  }
}
