import { IsMongoId, IsNotEmpty, IsString } from "class-validator";

export class CreateReelDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  videoUrl!: string;

  @IsNotEmpty()
  @IsString()
  playableUrl!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsMongoId()
  category!: string;
}