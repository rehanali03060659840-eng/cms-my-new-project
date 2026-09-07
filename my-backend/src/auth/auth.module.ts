import { Module } from "@nestjs/common";

import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

import { jwtConstants } from "./constants";

import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    UsersModule,

    JwtModule.register({
      secret: jwtConstants.secret,

      signOptions: {
        expiresIn: "1d",
      },
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    JwtStrategy,
  ],

  exports: [
    JwtModule,
  ],
})
export class AuthModule {}