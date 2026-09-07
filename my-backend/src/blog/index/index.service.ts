
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Index, IndexDocument } from '../schemas/index.schema';
import { CreateIndexDto } from '../DTO/create-index.dto';

@Injectable()
export class IndexService {
  constructor(
    @InjectModel(Index.name) private indexModel: Model<IndexDocument>
  ) {}

  async create(createIndexDto: CreateIndexDto): Promise<Index> {
    const newIndex = new this.indexModel(createIndexDto);
    return newIndex.save();
  }

  async findAll(): Promise<Index[]> {
    return this.indexModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(slug: string): Promise<Index> {
    const doc = await this.indexModel.findOne({ slug }).exec();
    if (!doc) {
      throw new NotFoundException(`Blog with slug "${slug}" not found`);
    }
    return doc;
  }

  // ✅ NEW - pehle ye method hi missing tha
  async update(
    slug: string,
    updateData: Partial<CreateIndexDto>,
  ): Promise<Index> {
    const doc = await this.indexModel
      .findOneAndUpdate({ slug }, updateData, { new: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`Blog with slug "${slug}" not found`);
    }
    return doc;
  }

  async delete(slug: string): Promise<{ deleted: boolean }> {
    const result = await this.indexModel.deleteOne({ slug }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Blog with slug "${slug}" not found`);
    }
    return { deleted: true };
  }
}