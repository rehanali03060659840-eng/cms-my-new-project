import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAnime } from "../../context/AnimeContext";
import { SeasonTabs } from "../../components/Anime/SeasonTabs";
import { FavoriteButton } from "../../components/Anime/FavoriteButton";
import { PlaylistModal } from "../../components/Anime/PlaylistModal";
import type { Episode, SeasonGroup } from "../../types/anime";
import { Play, Eye, Calendar, Loader2, ChevronLeft } from "lucide-react";

export const SeriesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentSeries,
    episodes,
    loading,
    fetchSeriesById,
    fetchEpisodesBySeries,
  } = useAnime();

  const [activeSeason, setActiveSeason] = useState(1);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSeriesById(id);
      fetchEpisodesBySeries(id);
    }
  }, [id, fetchSeriesById, fetchEpisodesBySeries]);

  const seasonGroups = useMemo<SeasonGroup[]>(() => {
    const groups: { [key: number]: Episode[] } = {};
    episodes.forEach((ep) => {
      if (!groups[ep.seasonNumber]) {
        groups[ep.seasonNumber] = [];
      }
      groups[ep.seasonNumber].push(ep);
    });
    return Object.entries(groups)
      .map(([season, eps]) => ({
        seasonNumber: parseInt(season),
        episodes: eps.sort((a, b) => a.episodeNumber - b.episodeNumber),
      }))
      .sort((a, b) => a.seasonNumber - b.seasonNumber);
  }, [episodes]);

  const totalViews = useMemo(
    () => episodes.reduce((sum, ep) => sum + ep.views, 0),
    [episodes]
  );

  const handleEpisodeClick = (episode: Episode) => {
    navigate(`/anime/watch/${episode._id}`);
  };

  if (loading || !currentSeries) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div
        className="relative h-[40vh] min-h-[300px] w-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${currentSeries.coverImageUrl})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f0f0f]" />

        <button
          onClick={() => navigate("/anime")}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-white/80 transition-colors hover:bg-black/70 hover:text-white"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">
              {currentSeries.title}
            </h1>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {currentSeries.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-400 border border-orange-500/30"
                >
                  {cat}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-1.5">
                <Play size={16} className="text-orange-500" />
                <span>{episodes.length} Episodes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={16} className="text-orange-500" />
                <span>{totalViews.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-orange-500" />
                <span>
                  {new Date(currentSeries.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <FavoriteButton seriesId={currentSeries._id} />
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Add to Playlist
          </button>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Description</h2>
          <p className="text-white/70 leading-relaxed">
            {currentSeries.description}
          </p>
        </div>

        {seasonGroups.length > 0 ? (
          <SeasonTabs
            seasons={seasonGroups}
            activeSeason={activeSeason}
            onSeasonChange={setActiveSeason}
            onEpisodeClick={handleEpisodeClick}
          />
        ) : (
          <div className="rounded-xl bg-white/5 p-8 text-center">
            <p className="text-white/60">No episodes available yet</p>
          </div>
        )}
      </div>

      {showPlaylistModal && currentSeries && (
        <PlaylistModal
          seriesId={currentSeries._id}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
};
