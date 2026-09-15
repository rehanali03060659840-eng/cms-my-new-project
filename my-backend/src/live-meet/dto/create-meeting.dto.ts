import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsBoolean()
  @IsOptional()
  requireApproval?: boolean;

  @IsInt()
  @Min(2)
  @Max(50)
  @IsOptional()
  maxParticipants?: number;
}
