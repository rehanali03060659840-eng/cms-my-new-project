import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Reel, ReelSchema } from "./Reel.schema";
import { ReelsController } from "./reels.controller";
import { ReelsService } from "./reels.service";
import { RolesGuard } from "../auth/roles.guard";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reel.name, schema: ReelSchema }]),
  ],
  controllers: [ReelsController],
  providers: [ReelsService, RolesGuard],
})
export class ReelsModule {}  