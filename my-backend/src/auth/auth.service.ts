import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";

import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    private readonly usersService: UsersService,
  ) {}

  async login(body: {
    email: string;
    password: string;
  }) {
    const user =
      await this.usersService.findByEmail(
        body.email,
      );

    if (!user) {
      throw new UnauthorizedException(
        "Invalid email or password",
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        "Your account has been disabled",
      );
    }

    const passwordMatch =
      await bcrypt.compare(
        body.password,
        user.password,
      );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        "Invalid email or password",
      );
    }

    const token =
      await this.jwtService.signAsync({
        sub: user._id.toString(),
      });

    return {
      token,

      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}