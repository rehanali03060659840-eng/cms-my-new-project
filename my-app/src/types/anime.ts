export interface Series {
  _id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  categories: string[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  _id: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  videoUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface WatchHistory {
  _id: string;
  userId: string;
  episodeId: string;
  seriesId: string;
  watchedAt: string;
  progress: number;
}

export interface Favorite {
  _id: string;
  userId: string;
  seriesId: string;
  createdAt: string;
}

export interface Playlist {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  _id: string;
  playlistId: string;
  seriesId: string;
  addedAt: string;
}

export interface SeasonGroup {
  seasonNumber: number;
  episodes: Episode[];
}

export interface ParsedFile {
  originalName: string;
  title: string;
  season: number;
  episode: number;
}

export interface UploadPayload {
  seriesId?: string;
  newSeries?: {
    title: string;
    description: string;
    coverImageUrl: string;
    categories: string[];
  };
  seasonNumber: number;
  files: File[];
  parsedData: ParsedFile[];
}

export interface BulkUploadItem {
  file: File;
  parsed: ParsedFile;
  targetSeriesId: string;
  targetSeason: number;
  targetEpisode: number;
  coverFile?: File | null;
}