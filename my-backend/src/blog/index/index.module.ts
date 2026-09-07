
import { Module } from '@nestjs/common';
import { IndexService } from './index.service';
import { IndexController } from './index.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Index, IndexSchema } from '../schemas/index.schema';
import { RolesGuard} from "../../auth/roles.guard"
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Index.name,
        schema: IndexSchema,
      },
    ]),
  ],
  controllers: [IndexController],
  providers: [IndexService,   RolesGuard],
})
export class IndexModule {}