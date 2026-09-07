import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './users.schema';
import { Role } from '../auth/roles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string) {
    return this.userModel
      .findOne({
        email: email.toLowerCase(),
      })
      .select('+password');
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }

  async findAll() {
    return this.userModel.find().select('-password').sort({ createdAt: -1 });
  }

  async createUser(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: Role;
    image?: string;
  }) {
    const existingEmail = await this.userModel.findOne({
      email: data.email.toLowerCase(),
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUsername = await this.userModel.findOne({
      username: data.username.toLowerCase(),
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.userModel.create({
      name: data.name,
      username: data.username.toLowerCase(),
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role,
      image: data.image || undefined,
      isActive: true,
    });

    const { password: _pwd, ...result } = user.toObject();

    return result;
  }

  async updateRole(id: string, role: Role) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        role,
      },
      {
        new: true,
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async toggleStatus(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = !user.isActive;

    await user.save();

    return {
      message: user.isActive ? 'User activated' : 'User disabled',
      isActive: user.isActive,
    };
  }

  async removeUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User removed successfully',
    };
  }
}
