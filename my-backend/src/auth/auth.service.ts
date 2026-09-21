import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { Role } from './roles.enum';

const DB_OPERATION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(body: { email: string; password: string }) {
    try {
      const user = await withTimeout(
        this.usersService.findByEmail(body.email),
        DB_OPERATION_TIMEOUT_MS,
        'User lookup',
      );

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Your account has been disabled');
      }

      const passwordMatch = await withTimeout(
        bcrypt.compare(body.password, user.password),
        DB_OPERATION_TIMEOUT_MS,
        'Password compare',
      );

      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const token = await withTimeout(
        this.jwtService.signAsync({
          sub: user._id.toString(),
        }),
        DB_OPERATION_TIMEOUT_MS,
        'JWT signing',
      );

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
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error('Login route failed structurally:', error);
      throw new InternalServerErrorException(
        'Database unreachable or connection timeout',
      );
    }
  }

  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) {
    try {
      const existingUser = await withTimeout(
        this.usersService.findByEmail(data.email),
        DB_OPERATION_TIMEOUT_MS,
        'Existing user check',
      );
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await withTimeout(
        bcrypt.hash(data.password, 10),
        DB_OPERATION_TIMEOUT_MS,
        'Password hash',
      );

      const user = await withTimeout(
        this.usersService.createUser({
          ...data,
          password: hashedPassword,
          role: Role.USER,
        }),
        DB_OPERATION_TIMEOUT_MS,
        'User creation',
      );

      return {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        role: user.role,
        isActive: user.isActive,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Register route failed structurally:', error);
      throw new InternalServerErrorException(
        'Database unreachable or connection timeout',
      );
    }
  }
}