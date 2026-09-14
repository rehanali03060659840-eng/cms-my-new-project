import { supabase } from "../lib/supabase";
import { SUPABASE_STORAGE_BUCKETS } from "../lib/supabase";
export interface UploadResult {
  url: string;
  path: string;
  bucket: string;
}

export const uploadToBucket = async (
  file: File,
  bucket: "ANIME_COVERS" | "ANIME_VIDEOS",
  folder: string = "uploads"
): Promise<UploadResult> => {
  const bucketName = SUPABASE_STORAGE_BUCKETS[bucket];
  const fileExt = file.name.split(".").pop() || "bin";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    bucket: bucketName,
  };
};

export const getPublicUrl = (
  bucket: "ANIME_COVERS" | "ANIME_VIDEOS",
  path: string
): string => {
  const bucketName = SUPABASE_STORAGE_BUCKETS[bucket];
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFromBucket = async (
  bucket: "ANIME_COVERS" | "ANIME_VIDEOS",
  path: string
): Promise<void> => {
  const bucketName = SUPABASE_STORAGE_BUCKETS[bucket];
  const { error } = await supabase.storage.from(bucketName).remove([path]);
  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

export const parseFilename = (filename: string): {
  title: string;
  season: number;
  episode: number;
} => {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "").trim();
  let title = nameWithoutExt;
  let season = 1;
  let episode = 0;

  const seasonMatch = nameWithoutExt.match(/s(\d+)/i);
  if (seasonMatch) {
    season = parseInt(seasonMatch[1], 10);
  }

  const episodeMatch = nameWithoutExt.match(/ep?(\d+)/i);
  if (episodeMatch) {
    episode = parseInt(episodeMatch[1], 10);
  }

  title = nameWithoutExt
    .replace(/s\d+/gi, "")
    .replace(/ep?\d+/gi, "")
    .replace(/hindi|english|japanese|sub|dub|dual|audio/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return { title, season, episode };
};

export const calculateNextEpisodeNumbers = (
  existingEpisodes: { seasonNumber: number; episodeNumber: number }[],
  targetSeason: number,
  count: number
): number[] => {
  const seasonEpisodes = existingEpisodes
    .filter((ep) => ep.seasonNumber === targetSeason)
    .map((ep) => ep.episodeNumber)
    .sort((a, b) => a - b);

  const maxEpisode = seasonEpisodes.length > 0 ? Math.max(...seasonEpisodes) : 0;
  const start = maxEpisode > 0 ? maxEpisode + 1 : 1;
  return Array.from({ length: count }, (_, i) => start + i);
};