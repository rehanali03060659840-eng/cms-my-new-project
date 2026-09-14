import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Series, Episode, WatchHistory, Favorite, Playlist } from "../types/anime";

import { seriesApi, episodeApi, watchHistoryApi, favoriteApi, playlistApi, categoriesApi } from "../Api/animeApi";
import toast from "react-hot-toast";

interface AnimeContextType {
  series: Series[];
  currentSeries: Series | null;
  episodes: Episode[];
  watchHistory: WatchHistory[];
  favorites: Favorite[];
  playlists: Playlist[];
  categories: string[];
  loading: boolean;
  error: string | null;
  fetchSeries: () => Promise<void>;
  fetchSeriesById: (id: string) => Promise<void>;
  fetchEpisodesBySeries: (seriesId: string) => Promise<void>;
  fetchWatchHistory: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  toggleFavorite: (seriesId: string) => Promise<void>;
  isFavorite: (seriesId: string) => boolean;
  addToPlaylist: (playlistId: string, seriesId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, seriesId: string) => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist | null>;
  deletePlaylist: (id: string) => Promise<void>;
  updateWatchProgress: (episodeId: string, seriesId: string, progress: number) => Promise<void>;
}

const AnimeContext = createContext<AnimeContextType | null>(null);

export const AnimeProvider = ({ children }: { children: ReactNode }) => {
  const [series, setSeries] = useState<Series[]>([]);
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await seriesApi.getAll();
      setSeries(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch series");
      toast.error("Failed to fetch series");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeriesById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await seriesApi.getById(id);
      setCurrentSeries(res.data);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch series");
      toast.error("Failed to fetch series");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEpisodesBySeries = useCallback(async (seriesId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await episodeApi.getBySeries(seriesId);
      setEpisodes(res.data);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch episodes");
      toast.error("Failed to fetch episodes");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWatchHistory = useCallback(async () => {
    try {
      const res = await watchHistoryApi.get();
      setWatchHistory(res.data);
    } catch (err: any) {
      console.error("Failed to fetch watch history", err);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await favoriteApi.get();
      setFavorites(res.data);
    } catch (err: any) {
      console.error("Failed to fetch favorites", err);
    }
  }, []);

  const fetchPlaylists = useCallback(async () => {
    try {
      const res = await playlistApi.get();
      setPlaylists(res.data);
    } catch (err: any) {
      console.error("Failed to fetch playlists", err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data);
    } catch (err: any) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

  const toggleFavorite = useCallback(async (seriesId: string) => {
    try {
      const isFav = favorites.some((f) => f.seriesId === seriesId);
      if (isFav) {
        await favoriteApi.remove(seriesId);
        setFavorites((prev) => prev.filter((f) => f.seriesId !== seriesId));
        toast.success("Removed from favorites");
      } else {
        const res = await favoriteApi.add(seriesId);
        setFavorites((prev) => [...prev, res.data]);
        toast.success("Added to favorites");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update favorite");
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (seriesId: string) => favorites.some((f) => f.seriesId === seriesId),
    [favorites]
  );

  const addToPlaylist = useCallback(async (playlistId: string, seriesId: string) => {
    try {
      await playlistApi.addItem(playlistId, seriesId);
      toast.success("Added to playlist");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to playlist");
    }
  }, []);

  const removeFromPlaylist = useCallback(async (playlistId: string, seriesId: string) => {
    try {
      await playlistApi.removeItem(playlistId, seriesId);
      toast.success("Removed from playlist");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove from playlist");
    }
  }, []);

  const createPlaylist = useCallback(async (name: string, description?: string): Promise<Playlist | null> => {
    try {
      const res = await playlistApi.create({ name, description });
      setPlaylists((prev) => [...prev, res.data]);
      toast.success("Playlist created");
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create playlist");
      return null;
    }
  }, []);

  const deletePlaylist = useCallback(async (id: string) => {
    try {
      await playlistApi.delete(id);
      setPlaylists((prev) => prev.filter((p) => p._id !== id));
      toast.success("Playlist deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete playlist");
    }
  }, []);

  const updateWatchProgress = useCallback(
    async (episodeId: string, seriesId: string, progress: number) => {
      try {
        const existing = watchHistory.find(
          (wh) => wh.episodeId === episodeId
        );
        if (existing) {
          await watchHistoryApi.update(existing._id, { progress });
          setWatchHistory((prev) =>
            prev.map((wh) =>
              wh.episodeId === episodeId ? { ...wh, progress } : wh
            )
          );
        } else {
          const res = await watchHistoryApi.create({
            episodeId,
            seriesId,
            progress,
          });
          setWatchHistory((prev) => [...prev, res.data]);
        }
      } catch (err: any) {
        console.error("Failed to update watch progress", err);
      }
    },
    [watchHistory]
  );

  return (
    <AnimeContext.Provider
      value={{
        series,
        currentSeries,
        episodes,
        watchHistory,
        favorites,
        playlists,
        categories,
        loading,
        error,
        fetchSeries,
        fetchSeriesById,
        fetchEpisodesBySeries,
        fetchWatchHistory,
        fetchFavorites,
        fetchPlaylists,
        fetchCategories,
        toggleFavorite,
        isFavorite,
        addToPlaylist,
        removeFromPlaylist,
        createPlaylist,
        deletePlaylist,
        updateWatchProgress,
      }}
    >
      {children}
    </AnimeContext.Provider>
  );
};

export const useAnime = () => {
  const context = useContext(AnimeContext);
  if (!context) {
    throw new Error("useAnime must be used within an AnimeProvider");
  }
  return context;
};