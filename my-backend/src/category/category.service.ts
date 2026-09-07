import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './category.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CategoryService {
    constructor(
    @InjectModel(Category.name)
    private categoryModel:Model<Category>
  ){}

// create
  async create(data: CreateCategoryDto){
    return this.categoryModel.create(data);
  }

  //
  async findAll() {
    return this.categoryModel.find();
  }

  //
  async findOne(id: string){
    return this.categoryModel.findOne();
  }

  //
  async update(
    id: string,
    data: any
  ){
    return this.categoryModel.findByIdAndUpdate(
      id,
      data,
      {
        new:true
      }
    );
  }


  //
  async remove(id: string){
    return this.categoryModel.findByIdAndDelete(id);
  }
}
