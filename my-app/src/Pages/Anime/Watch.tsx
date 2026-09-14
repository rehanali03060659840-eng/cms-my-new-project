import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAnime } from "../../context/AnimeContext";
import { VideoPlayer } from "../../components/Anime/VideoPlayer";
import type { Episode, Series } from "../../types/anime";
import { episodeApi, seriesApi } from "../../Api/animeApi";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../../components/Anime/Modal";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Loader2,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";

export const Watch = () => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateWatchProgress, fetchWatchHistory } = useAnime();

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [relatedEpisodes, setRelatedEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchEpisode = async () => {
      if (!episodeId) return;
      try {
        setLoading(true);
        const epRes = await episodeApi.getById(episodeId);
        setEpisode(epRes.data);

        const seriesRes = await seriesApi.getById(epRes.data.seriesId);
        setSeries(seriesRes.data);

        const allEpRes = await episodeApi.getBySeries(epRes.data.seriesId);
        const sorted = allEpRes.data.sort(
          (a: Episode, b: Episode) =>
            a.seasonNumber - b.seasonNumber ||
            a.episodeNumber - b.episodeNumber
        );
        setRelatedEpisodes(sorted);

        await episodeApi.incrementViews(episodeId);

        if (user) {
          await fetchWatchHistory();
        }
      } catch (error) {
        toast.error("Failed to load episode");
        navigate("/anime");
      } finally {
        setLoading(false);
      }
    };

    fetchEpisode();
  }, [episodeId, user, navigate, fetchWatchHistory]);

  const currentIndex = relatedEpisodes.findIndex(
    (ep) => ep._id === episodeId
  );
  const prevEpisode = currentIndex > 0 ? relatedEpisodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex < relatedEpisodes.length - 1
      ? relatedEpisodes[currentIndex + 1]
      : null;

  const handleTimeUpdate = async () => {
    if (!videoRef.current || !episode || !series || !user) return;
    const video = videoRef.current;
    const progress = (video.currentTime / video.duration) * 100;
    if (progress > 5) {
      await updateWatchProgress(episode._id, series._id, progress);
    }
  };

  const handleDownload = () => {
    if (!user) {
      setShowDownloadModal(true);
      return;
    }
    if (episode?.videoUrl) {
      window.open(episode.videoUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#0f0f0f]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!episode || !series) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#0f0f0f]">
        <p className="text-white/60">Episode not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <button
          onClick={() => navigate(`/anime/series/${series._id}`)}
          className="mb-4 flex items-center gap-2 text-white/60 transition-colors hover:text-white"
        >
          <ChevronLeft size={20} />
          <span>Back to {series.title}</span>
        </button>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {series.title}{" "}
              <span className="text-white/60">
                - S{episode.seasonNumber}E{episode.episodeNumber}
              </span>
            </h1>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-600"
          >
            <Download size={16} />
            Download
          </button>
        </div>

        <VideoPlayer
          ref={videoRef}
          src={episode.videoUrl}
          poster={episode.thumbnailUrl || series.coverImageUrl}
          onTimeUpdate={handleTimeUpdate}
        />

        <div className="mt-6 flex items-center justify-between rounded-xl bg-white/5 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => prevEpisode && navigate(`/anime/watch/${prevEpisode._id}`)}
              disabled={!prevEpisode}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition-all hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <button
              onClick={() => nextEpisode && navigate(`/anime/watch/${nextEpisode._id}`)}
              disabled={!nextEpisode}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-600 disabled:opacity-30"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <Eye size={16} />
            <span>{episode.views.toLocaleString()} views</span>
          </div>
        </div>

        {relatedEpisodes.length > 1 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white">Episodes</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {relatedEpisodes.map((ep) => (
                <button
                  key={ep._id}
                  onClick={() => navigate(`/anime/watch/${ep._id}`)}
                  className={`group relative aspect-video overflow-hidden rounded-lg transition-all ${
                    ep._id === episodeId
                      ? "ring-2 ring-orange-500"
                      : "hover:ring-2 hover:ring-white/30"
                  }`}
                >
                  <img
                    src={ep.thumbnailUrl || series.coverImageUrl}
                    alt={`Episode ${ep.episodeNumber}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-medium text-white">
                      E{ep.episodeNumber}
                    </p>
                  </div>
                  {ep._id === episodeId && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="h-6 w-6 text-white" fill="white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="Login Required"
      >
        <p className="mb-4 text-white/70">
          Please login to download episodes.
        </p>
        <button
          onClick={() => {
            setShowDownloadModal(false);
            navigate("/login");
          }}
          className="w-full rounded-lg bg-orange-500 py-2.5 font-medium text-white transition-all hover:bg-orange-600"
        >
          Go to Login
        </button>
      </Modal>
    </div>
  );
};
