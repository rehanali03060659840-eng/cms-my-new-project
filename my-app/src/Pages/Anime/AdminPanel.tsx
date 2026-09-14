import { useEffect, useState } from "react";
import { seriesApi, episodeApi } from "../../Api/animeApi";
import type { Series, Episode } from "../../types/anime";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../../components/Anime/Modal";
import toast from "react-hot-toast";
import { Loader2, Trash2, Search, ShieldAlert, Play, BookOpen } from "lucide-react";

export const AdminPanel = () => {
  const { user } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    type: "series" | "episode";
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seriesRes] = await Promise.all([
        seriesApi.getAll(),
        Promise.resolve({ data: [] } as any),
      ]);
      setSeries(seriesRes.data);
      const allEpisodes: Episode[] = [];
      for (const s of seriesRes.data) {
        try {
          const epRes = await episodeApi.getBySeries(s._id);
          allEpisodes.push(...epRes.data);
        } catch (e) {
          console.error(`Failed to fetch episodes for ${s._id}`);
        }
      }
      setEpisodes(allEpisodes);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      if (deleteModal.type === "series") {
        await seriesApi.delete(deleteModal.id);
        setSeries((prev) => prev.filter((s) => s._id !== deleteModal.id));
        toast.success("Series deleted");
      } else {
        await episodeApi.delete(deleteModal.id);
        setEpisodes((prev) => prev.filter((e) => e._id !== deleteModal.id));
        toast.success("Episode deleted");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
    setDeleteModal(null);
  };

  const filteredSeries = series.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categories.some((c) =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const filteredEpisodes = episodes.filter((e) =>
    searchQuery
      ? e._id.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  if (user?.role !== "super_admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-orange-500" />
        <h2 className="mb-2 text-xl font-bold text-white">Access Denied</h2>
        <p className="text-white/60">
          Only super admins can access this panel
        </p>
      </div>
    );
  }

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
          Anime <span className="text-orange-500">Admin Panel</span>
        </h1>
        <p className="text-white/60">Manage series and episodes</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            size={18}
          />
          <input
            type="text"
            placeholder="Search series or episodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <BookOpen className="text-orange-500" />
            Series ({filteredSeries.length})
          </h2>
          <div className="space-y-3">
            {filteredSeries.length === 0 ? (
              <p className="text-white/60">No series found</p>
            ) : (
              filteredSeries.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-4 rounded-xl bg-[#1a1a1a] p-4"
                >
                  <img
                    src={s.coverImageUrl}
                    alt={s.title}
                    className="h-16 w-24 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {s.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setDeleteModal({
                        type: "series",
                        id: s._id,
                        name: s.title,
                      })
                    }
                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Play className="text-orange-500" />
            Episodes ({filteredEpisodes.length})
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredEpisodes.length === 0 ? (
              <p className="text-white/60">No episodes found</p>
            ) : (
              filteredEpisodes.map((ep) => (
                <div
                  key={ep._id}
                  className="flex items-center gap-4 rounded-xl bg-[#1a1a1a] p-4"
                >
                  {ep.thumbnailUrl && (
                    <img
                      src={ep.thumbnailUrl}
                      alt={`Episode ${ep.episodeNumber}`}
                      className="h-12 w-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">
                      S{ep.seasonNumber}E{ep.episodeNumber}
                    </p>
                    <p className="text-sm text-white/60">
                      {ep.views.toLocaleString()} views
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setDeleteModal({
                        type: "episode",
                        id: ep._id,
                        name: `S${ep.seasonNumber}E${ep.episodeNumber}`,
                      })
                    }
                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Confirm Delete"
      >
        <p className="mb-4 text-white/70">
          Are you sure you want to delete "{deleteModal?.name}"? This action
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteModal(null)}
            className="flex-1 rounded-lg bg-white/10 py-2.5 font-medium text-white transition-colors hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 rounded-lg bg-red-500 py-2.5 font-medium text-white transition-colors hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};
