
export type BlogStatus = 'draft' | 'published';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  isThumbnail: boolean;
  alt?: string;
}

export interface BlogContent {
  html: string;
  text: string;
}

export interface SerpData {
  title: string;
  description: string;
}

export interface MetaData {
  metaTitle: string;
  shortDescription: string;
  longDescription: string;
  focusKeywords: string[];
  tags: string[];
}

export interface BlogItem {
  _id?: string;
  title: string;
  shortInfo: string;
  thumbnail?: string;
  media: MediaItem[];
  content: BlogContent;
  faq: FaqItem[];
  serp: SerpData;
  meta: MetaData;
  slug: string;
  schema?: Record<string, any>;
  status: BlogStatus;
  createdAt?: string;
  updatedAt?: string;
}