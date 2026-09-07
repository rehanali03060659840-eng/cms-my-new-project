
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('media')
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  async uploadMedia(@UploadedFiles() files: Express.Multer.File[]) {
    

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles: any[] = [];

    for (const file of files) {
      const fileData = await this.uploadService.saveFile(file);
      uploadedFiles.push(fileData);
    }

    return {
      success: true,
      files: uploadedFiles,
      url: uploadedFiles.length === 1 ? uploadedFiles[0].url : undefined,
    };
  }
}