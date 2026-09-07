
export class FaqItemDto {
  question!: string;
  answer!: string;
}

export class MediaItemDto {
  url!: string;
  type!: 'image' | 'video';
  isThumbnail!: boolean;
  alt?: string;
}

export class ContentDto {
  html!: string;
  text!: string;
}

export class SerpDto {
  title!: string;
  description!: string;
}

export class MetaDto {
  metaTitle!: string;
  shortDescription!: string;
  longDescription!: string;
  focusKeywords!: string[];
  tags!: string[];
}

export class CreateIndexDto {
  title!: string;
  shortInfo!: string;
  thumbnail?: string;
  media?: MediaItemDto[];

  content!: ContentDto;

  faq!: FaqItemDto[];

  serp!: SerpDto;
  meta!: MetaDto;

  slug!: string;
  schema!: Record<string, any>;
  status!: 'draft' | 'published';
}