import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reel, ReelDocument } from './Reel.schema';
import { CreateReelDto } from './dto/Create-reel.dto';
import { UpdateReelDto } from './dto/Update-reel.dto';

@Injectable()
export class ReelsService {
  constructor(@InjectModel(Reel.name) private reelModel: Model<ReelDocument>) {}

  async create(dto: CreateReelDto, thumbnailPath: string) {
    const reel = new this.reelModel({ ...dto, thumbnail: thumbnailPath });
    const saved = await reel.save();
    return saved.populate('category', 'name');
  }

  async findAll() {
    // populate("category", "name") -> sirf category ka "name" field lekar aayega, poora document nahi
    return this.reelModel
      .find()
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const reel = await this.reelModel
      .findById(id)
      .populate('category', 'name')
      .exec();
    if (!reel) throw new NotFoundException('Reel not found');
    return reel;
  }

  async update(id: string, dto: UpdateReelDto, thumbnailPath?: string) {
    const updateData: Partial<Reel> & { thumbnail?: string } = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.videoUrl !== undefined) updateData.videoUrl = dto.videoUrl;
    if (dto.playableUrl !== undefined) updateData.playableUrl = dto.playableUrl;
    if (dto.description !== undefined) updateData.description = dto.description;

    // String -> ObjectId
    if (dto.category !== undefined) {
      updateData.category = new Types.ObjectId(dto.category);
    }

    if (thumbnailPath) {
      updateData.thumbnail = thumbnailPath;
    }

    const reel = await this.reelModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name')
      .exec();

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    return reel;
  }

  async remove(id: string) {
    const reel = await this.reelModel.findByIdAndDelete(id).exec();
    if (!reel) throw new NotFoundException('Reel not found');
    return { message: 'Reel deleted successfully' };
  }
}
