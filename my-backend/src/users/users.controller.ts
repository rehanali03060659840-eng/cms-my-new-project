import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import {
  FileInterceptor,
} from "@nestjs/platform-express";

import {
  diskStorage,
} from "multer";

import {
  extname,
} from "path";

import { mkdirSync } from "fs";

import { UsersService } from "./users.service";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../auth/roles.enum";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = "./uploads/users";

          mkdirSync(uploadPath, {
            recursive: true,
          });

          cb(null, uploadPath);
        },

        filename: (req, file, cb) => {
          const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;

          cb(null, uniqueName);
        },
      }),
    }),
  )
  create(
    @Body()
    body: {
      name: string;
      username: string;
      email: string;
      password: string;
      role: Role;
    },

    @UploadedFile()
    image?: Express.Multer.File,
  ) {
    return this.usersService.createUser({
      ...body,
      image: image
        ? `/uploads/users/${image.filename}`
        : undefined,
    });
  }

  @Patch(":id/role")
  updateRole(
    @Param("id") id: string,

    @Body("role")
    role: Role,
  ) {
    return this.usersService.updateRole(
      id,
      role,
    );
  }

  @Patch(":id/status")
  toggleStatus(
    @Param("id") id: string,
  ) {
    return this.usersService.toggleStatus(id);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
  ) {
    return this.usersService.removeUser(id);
  }
}