import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { AuthService } from "./auth.service";

import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post("login")
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: any) {
    return req.user;
  }

  @Post("register")
  register(@Body() body: { name: string; username: string; email: string; password: string }) {
    return this.authService.register(body);
  }
}