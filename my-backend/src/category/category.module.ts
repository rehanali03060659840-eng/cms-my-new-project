import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category, CategorySchema } from './category.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesGuard } from '../auth/roles.guard';
@Module({
  imports:[
    MongooseModule.forFeature([{
      name:Category.name,
      schema:CategorySchema
    }])
  ],
  controllers: [CategoryController],
  providers: [CategoryService,   RolesGuard]
})
export class CategoryModule {}
