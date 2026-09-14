import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnime } from "../../context/AnimeContext";
import { SeriesCard } from "../../components/Anime/SeriesCard";
import type { Series } from "../../types/anime";
import { seriesApi, playlistApi } from "../../Api/animeApi";
import toast from "react-hot-toast";
import { Loader2, Clock, Heart, List, Plus, Trash2 } from "lucide-react";

type TabType = "history" | "favorites" | "playlists";

export const UserRoom = () => {
  const navigate = useNavigate();
  const {
    watchHistory,
    favorites,
    playlists,
    fetchWatchHistory,
    fetchFavorites,
    fetchPlaylists,
    deletePlaylist,
  } = useAnime();

  const [activeTab, setActiveTab] = useState<TabType>("history");
  const [favoriteSeries, setFavoriteSeries] = useState<Series[]>([]);
  const [playlistItems, setPlaylistItems] = useState<{
    [key: string]: Series[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWatchHistory(),
        fetchFavorites(),
        fetchPlaylists(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchFavoriteSeries = async () => {
      const seriesData: Series[] = [];
      for (const fav of favorites) {
        try {
          const res = await seriesApi.getById(fav.seriesId);
          seriesData.push(res.data);
        } catch (e) {
          console.error(`Failed to fetch series ${fav.seriesId}`);
        }
      }
      setFavoriteSeries(seriesData);
    };
    if (favorites.length > 0) {
      fetchFavoriteSeries();
    } else {
      setFavoriteSeries([]);
    }
  }, [favorites]);

  const fetchPlaylistItems = async (playlistId: string) => {
    if (playlistItems[playlistId]) return;
    try {
      const res = await playlistApi.getById(playlistId);
      setPlaylistItems((prev) => ({ ...prev, [playlistId]: res.data.items || [] }));
    } catch (e) {
      console.error("Failed to fetch playlist items");
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error("Playlist name is required");
      return;
    }
    try {
      await playlistApi.create({ name: newPlaylistName, description: newPlaylistDesc });
      toast.success("Playlist created!");
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      setShowCreatePlaylist(false);
      fetchPlaylists();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create playlist");
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    await deletePlaylist(id);
    setPlaylistItems((prev) => {
      const newItems = { ...prev };
      delete newItems[id];
      return newItems;
    });
  };

  const tabs = [
    { id: "history" as TabType, label: "Watch History", icon: Clock },
    { id: "favorites" as TabType, label: "Favorites", icon: Heart },
    { id: "playlists" as TabType, label: "My Playlists", icon: List },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          My <span className="text-orange-500">Room</span>
        </h1>
        <p className="text-white/60">
          Manage your watch history, favorites, and playlists
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "history" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Watch History ({watchHistory.length})
          </h2>
          {watchHistory.length === 0 ? (
            <div className="rounded-xl bg-white/5 p-8 text-center">
              <Clock className="mx-auto mb-3 h-12 w-12 text-white/30" />
              <p className="text-white/60">No watch history yet</p>
              <button
                onClick={() => navigate("/anime")}
                className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-600"
              >
                Browse Anime
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {watchHistory.map((wh) => (
                <div
                  key={wh._id}
                  className="flex items-center gap-4 rounded-xl bg-[#1a1a1a] p-4"
                >
                  <div className="h-12 w-20 rounded-lg bg-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">Episode ID: {wh.episodeId.slice(-8)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${wh.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">
                        {Math.round(wh.progress)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/anime/watch/${wh.episodeId}`)}
                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-orange-600"
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "favorites" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            My Favorites ({favoriteSeries.length})
          </h2>
          {favoriteSeries.length === 0 ? (
            <div className="rounded-xl bg-white/5 p-8 text-center">
              <Heart className="mx-auto mb-3 h-12 w-12 text-white/30" />
              <p className="text-white/60">No favorites yet</p>
              <button
                onClick={() => navigate("/anime")}
                className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-600"
              >
                Browse Anime
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favoriteSeries.map((s) => (
                <SeriesCard key={s._id} series={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "playlists" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              My Playlists ({playlists.length})
            </h2>
            <button
              onClick={() => setShowCreatePlaylist(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-600"
            >
              <Plus size={16} />
              New Playlist
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="rounded-xl bg-white/5 p-8 text-center">
              <List className="mx-auto mb-3 h-12 w-12 text-white/30" />
              <p className="text-white/60">No playlists yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map((playlist) => (
                <div
                  key={playlist._id}
                  className="rounded-xl bg-[#1a1a1a] p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-white">{playlist.name}</h3>
                      {playlist.description && (
                        <p className="text-sm text-white/60">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeletePlaylist(playlist._id)}
                        className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchPlaylistItems(playlist._id)}
                    className="text-sm text-orange-500 hover:text-orange-400"
                  >
                    {playlistItems[playlist._id]
                      ? `${playlistItems[playlist._id].length} items`
                      : "Load items"}
                  </button>
                  {playlistItems[playlist._id] && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {playlistItems[playlist._id].map((s) => (
                        <button
                          key={s._id}
                          onClick={() => navigate(`/anime/series/${s._id}`)}
                          className="flex items-center gap-2 rounded-lg bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
                        >
                          <img
                            src={s.coverImageUrl}
                            alt={s.title}
                            className="h-10 w-16 rounded object-cover"
                          />
                          <span className="text-xs text-white/80 truncate">
                            {s.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreatePlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#1a1a1a] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Create New Playlist
            </h3>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none"
            />
            <textarea
              placeholder="Description (optional)"
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none resize-none h-20"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreatePlaylist(false)}
                className="flex-1 rounded-lg bg-white/10 py-2.5 font-medium text-white transition-colors hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="flex-1 rounded-lg bg-orange-500 py-2.5 font-medium text-white transition-colors hover:bg-orange-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
