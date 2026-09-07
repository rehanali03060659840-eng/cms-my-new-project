import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { ReelsService } from "./reels.service";
import { CreateReelDto } from "./dto/Create-reel.dto";
import { UpdateReelDto } from "./dto/Update-reel.dto";
import { RolesGuard } from "../auth/roles.guard";
import { Role } from "../auth/roles.enum";
import { Roles } from "../auth/roles.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

const thumbnailStorage = diskStorage({
  destination: "./uploads/reels",
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

@Controller("reels")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,)
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("thumbnail", { storage: thumbnailStorage }))
  create(
    @Body() dto: CreateReelDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const thumbnailPath = file ? `/uploads/reels/${file.filename}` : "";
    return this.reelsService.create(dto, thumbnailPath);
  }

  @Get()
  findAll() {
    return this.reelsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.reelsService.findOne(id);
  }

  @Put(":id")
  @UseInterceptors(FileInterceptor("thumbnail", { storage: thumbnailStorage }))
  update(
    @Param("id") id: string,
    @Body() dto: UpdateReelDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const thumbnailPath = file ? `/uploads/reels/${file.filename}` : undefined;
    return this.reelsService.update(id, dto, thumbnailPath);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.reelsService.remove(id);
  }
}