import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TermsConditions, TermsConditionsDocument } from './schemas/terms-conditions.schema';
import { CreateTermsConditionsDto } from './dto/create-terms-conditions.dto';
import { UpdateTermsConditionsDto } from './dto/update-terms-conditions.dto';

@Injectable()
export class TermsConditionsService {
  constructor(
    @InjectModel(TermsConditions.name)
    private readonly model: Model<TermsConditionsDocument>,
  ) {}

  create(dto: CreateTermsConditionsDto) {
    return this.model.create(dto);
  }

  findAll() {
    return this.model.find().sort({ createdAt: -1 });
  }

  async findOne(slug: string) {
    const doc = await this.model.findOne({ termsSlug: slug });
    if (!doc) throw new NotFoundException('Terms & conditions not found');
    return doc;
  }

  async update(slug: string, dto: UpdateTermsConditionsDto) {
    const doc = await this.model.findOneAndUpdate({ termsSlug: slug }, dto, { new: true });
    if (!doc) throw new NotFoundException('Terms & conditions not found');
    return doc;
  }
}
