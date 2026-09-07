import { PartialType } from "@nestjs/mapped-types";
import { CreateReelDto } from "./Create-reel.dto";

export class UpdateReelDto extends PartialType(CreateReelDto) {}