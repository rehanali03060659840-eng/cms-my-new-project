import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../category/category.schema';
import { Index, IndexDocument } from '../blog/schemas/index.schema';
import { Reel, ReelDocument } from '../reels/Reel.schema';
@Injectable()
export class DashboardService {
    constructor( 
        
            @InjectModel(Category.name)private categoryModel:Model<Category>,
            @InjectModel(Index.name) private indexModel: Model<IndexDocument>,
            @InjectModel(Reel.name) private reelModel: Model<ReelDocument>,

    ){}

    async getStats() {
  const totalCategories = await this.categoryModel.countDocuments();
  console.log("totalCategories:", totalCategories);

  const totalBlogs = await this.indexModel.countDocuments();
  console.log("totalBlogs:", totalBlogs);

  const totalReels = await this.reelModel.countDocuments();
  console.log("totalReels:", totalReels);

  const result = { totalCategories, totalBlogs, totalReels };
  console.log("Final result:", result);

  return result;
}
}
