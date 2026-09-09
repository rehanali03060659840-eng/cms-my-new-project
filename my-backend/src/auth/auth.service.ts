import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";

import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { Role } from "./roles.enum";

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

  async register(data: { name: string; username: string; email: string; password: string }) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.createUser({
      ...data,
      password: hashedPassword,
      role: Role.USER,
    });

    return {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      role: user.role,
      isActive: user.isActive,
    };
  }
}