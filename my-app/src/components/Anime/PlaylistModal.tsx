import { useState, useEffect } from "react";
import { useAnime } from "../../context/AnimeContext";
import { playlistApi } from "../../Api/animeApi";
import type { Playlist } from "../../types/anime";
import { X, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface PlaylistModalProps {
  seriesId: string;
  onClose: () => void;
}

export const PlaylistModal = ({ seriesId, onClose }: PlaylistModalProps) => {
  const { fetchPlaylists } = useAnime();
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const res = await playlistApi.get();
      setAllPlaylists(res.data);
    } catch (error) {
      console.error("Failed to fetch playlists", error);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      toast.error("Playlist name is required");
      return;
    }
    try {
      await playlistApi.create({ name: newPlaylistName, description: newPlaylistDesc });
      toast.success("Playlist created!");
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      setShowCreateForm(false);
      loadPlaylists();
      fetchPlaylists();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create playlist");
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingTo(playlistId);
    try {
      await playlistApi.addItem(playlistId, seriesId);
      toast.success("Added to playlist");
      setAddingTo(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add to playlist");
      setAddingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Add to Playlist</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {allPlaylists.length === 0 && !showCreateForm ? (
            <p className="text-white/60 text-center py-4">No playlists yet. Create one below!</p>
          ) : (
            <div className="space-y-2 mb-4">
              {allPlaylists.map((playlist) => (
                <div
                  key={playlist._id}
                  className="flex items-center justify-between rounded-xl bg-white/5 p-3"
                >
                  <div>
                    <p className="font-medium text-white text-sm">{playlist.name}</p>
                    {playlist.description && (
                      <p className="text-xs text-white/60">{playlist.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToPlaylist(playlist._id)}
                    disabled={addingTo === playlist._id}
                    className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-orange-600 disabled:opacity-50"
                  >
                    {addingTo === playlist._id ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus size={14} />
                        Add
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {showCreateForm ? (
            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <input
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none"
              />
              <textarea
                placeholder="Description (optional)"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none resize-none h-20"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-xl bg-white/10 py-2.5 font-medium text-white transition-colors hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-orange-500 py-2.5 font-medium text-white transition-colors hover:bg-orange-600"
                >
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm font-medium text-white/70 transition-colors hover:border-orange-500/50 hover:text-orange-400"
            >
              <Plus size={16} />
              Create New Playlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
