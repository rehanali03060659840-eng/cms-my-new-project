import { IsArray, IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateEpisodeDto {
  @IsString()
  seriesId!: string;

  @IsInt()
  @Min(1)
  seasonNumber!: number;

  @IsInt()
  @Min(1)
  episodeNumber!: number;

  @IsString()
  @IsUrl()
  videoUrl!: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}