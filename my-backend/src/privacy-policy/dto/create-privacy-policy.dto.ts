import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreatePrivacyPolicyDto {
  @IsString()
  @IsNotEmpty()
  privacytitle!: string;

  @IsString()
  @IsNotEmpty()
  privacySlug!: string;

  @IsIn(['published', 'unPublished'])
  privacyStatus!: string;

  @IsIn(['public', 'admin'])
  privacyVisiblity!: string;

  @IsString()
  @IsNotEmpty()
  privacyDate!: string;

  @IsString()
  @IsNotEmpty()
  privacyContent!: string;
}
