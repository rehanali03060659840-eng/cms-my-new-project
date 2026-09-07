import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateTermsConditionsDto {
  @IsString()
  @IsNotEmpty()
  termstitle!: string;

  @IsString()
  @IsNotEmpty()
  termsSlug!: string;

  @IsIn(['published', 'unPublished'])
  termsStatus!: string;

  @IsIn(['public', 'admin'])
  termsVisiblity!: string;

  @IsString()
  @IsNotEmpty()
  termsDate!: string;

  @IsString()
  @IsNotEmpty()
  termsContent!: string;
}
