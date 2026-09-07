
import { Injectable } from '@nestjs/common';
import * as path from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class UploadService {
  async saveFile(file: MulterFile) {
    const fileUrl = `http://localhost:3000/uploads/${file.filename}`;
    
    return {
      filename: file.filename,
      originalName: file.originalname,
      url: fileUrl,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}