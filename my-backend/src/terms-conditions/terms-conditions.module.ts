import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TermsConditions, TermsConditionsSchema } from './schemas/terms-conditions.schema';
import { TermsConditionsService } from './terms-conditions.service';
import { TermsConditionsController } from './terms-conditions.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TermsConditions.name, schema: TermsConditionsSchema }]),
  ],
  controllers: [TermsConditionsController],
  providers: [TermsConditionsService, RolesGuard],
})
export class TermsConditionsModule {}
