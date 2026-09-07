import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { Category, CategorySchema } from '../category/category.schema';
import { Index, IndexSchema } from '../blog/schemas/index.schema';
import { Reel } from '../reels/Reel.schema';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../auth/roles.guard';
@Module({
  imports: [
MongooseModule.forFeature([
  {name: Category.name, schema: CategorySchema},
  {name: Index.name, schema: IndexSchema},
  {name: Reel.name, schema: IndexSchema}
])
  ],
  providers: [DashboardService, RolesGuard],
  controllers: [DashboardController]
})
export class DashboardModule {}
