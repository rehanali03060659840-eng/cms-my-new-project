import type { SeasonGroup, Episode } from "../../types/anime";
import { Play, Eye } from "lucide-react";

interface SeasonTabsProps {
  seasons: SeasonGroup[];
  activeSeason: number;
  onSeasonChange: (season: number) => void;
  onEpisodeClick: (episode: Episode) => void;
}

export const SeasonTabs = ({
  seasons,
  activeSeason,
  onSeasonChange,
  onEpisodeClick,
}: SeasonTabsProps) => {
  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {seasons.map((season) => (
          <button
            key={season.seasonNumber}
            onClick={() => onSeasonChange(season.seasonNumber)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeSeason === season.seasonNumber
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Season {season.seasonNumber}
            <span className="ml-2 text-xs opacity-60">
              ({season.episodes.length})
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4">
          {seasons
            .find((s) => s.seasonNumber === activeSeason)
            ?.episodes.map((episode) => (
              <button
                key={episode._id}
                onClick={() => onEpisodeClick(episode)}
                className="group relative h-[140px] w-[200px] shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] transition-all hover:ring-2 hover:ring-orange-500/50"
              >
                <img
                  src={episode.thumbnailUrl || ""}
                  alt={`Episode ${episode.episodeNumber}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-orange-500 p-3">
                    <Play className="h-6 w-6 text-white" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-semibold text-white">
                    Episode {episode.episodeNumber}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-white/60">
                    <Eye size={12} />
                    <span>{episode.views.toLocaleString()}</span>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
