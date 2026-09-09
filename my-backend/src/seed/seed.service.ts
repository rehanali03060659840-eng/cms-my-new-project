import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcryptjs";
import { User, UserDocument } from "../users/users.schema";
import { Role } from "../auth/roles.enum";

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      this.logger.warn(
        "SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD .env mein missing hai, seed skip",
      );
      return;
    }

    const existing = await this.userModel.findOne({ email });

    if (existing) {
      if (existing.role !== Role.SUPER_ADMIN) {
        existing.role = Role.SUPER_ADMIN;
        await existing.save();
        this.logger.log(`${email} ka role super_admin kar diya gaya`);
      } else {
        this.logger.log("Super admin already sahi role ke saath hai");
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.userModel.create({
      name: "Super Admin",
      username: "superadmin",
      email,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    });

    this.logger.log(`Naya super admin (${email}) create ho gaya`);
  }
}