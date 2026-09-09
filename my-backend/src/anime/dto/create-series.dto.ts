import { IsArray, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  coverImageUrl!: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(3)
  categories!: string[];
}