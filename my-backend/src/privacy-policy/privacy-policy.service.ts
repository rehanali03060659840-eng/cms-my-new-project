import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrivacyPolicy, PrivacyPolicyDocument } from './schemas/privacy-policy.schema';
import { CreatePrivacyPolicyDto } from './dto/create-privacy-policy.dto';
import { UpdatePrivacyPolicyDto } from './dto/update-privacy-policy.dto';

@Injectable()
export class PrivacyPolicyService {
  constructor(
    @InjectModel(PrivacyPolicy.name)
    private readonly model: Model<PrivacyPolicyDocument>,
  ) {}

  // CREATE
  create(dto: CreatePrivacyPolicyDto) {
    return this.model.create(dto);
  }

  // READ - all (no filter/search params, sirf sari records)
  findAll() {
    return this.model.find().sort({ createdAt: -1 });
  }

  // READ - single, by slug (id ki jagah slug se dhoondte hain, kyunke sirf 1 hi record hota hai)
  async findOne(slug: string) {
    const doc = await this.model.findOne({ privacySlug: slug });
    if (!doc) throw new NotFoundException('Privacy policy not found');
    return doc;
  }

  // UPDATE - by slug (naya record kabhi nahi banega, hamesha isi record ko update kiya jayega)
  async update(slug: string, dto: UpdatePrivacyPolicyDto) {
    const doc = await this.model.findOneAndUpdate({ privacySlug: slug }, dto, { new: true });
    if (!doc) throw new NotFoundException('Privacy policy not found');
    return doc;
  }

  // ⚠️ Iradan koi remove()/delete() method nahi rakha - requirement ke mutabiq
}
