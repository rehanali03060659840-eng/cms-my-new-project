import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrivacyPolicy, PrivacyPolicySchema } from './schemas/privacy-policy.schema';
import { PrivacyPolicyService } from './privacy-policy.service';
import { PrivacyPolicyController } from './privacy-policy.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PrivacyPolicy.name, schema: PrivacyPolicySchema }]),
  ],
  controllers: [PrivacyPolicyController],
  providers: [PrivacyPolicyService, RolesGuard],
})
export class PrivacyPolicyModule {}
