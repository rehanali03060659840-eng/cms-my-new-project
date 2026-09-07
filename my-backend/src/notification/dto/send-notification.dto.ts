import { IsArray, IsString, IsOptional, ArrayNotEmpty } from 'class-validator';

export class SendNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  tokens!: string[];

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  data?: Record<string, string>;
}