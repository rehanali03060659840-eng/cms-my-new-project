import { PartialType } from '@nestjs/mapped-types';
import { CreateTermsConditionsDto } from './create-terms-conditions.dto';

export class UpdateTermsConditionsDto extends PartialType(CreateTermsConditionsDto) {}
