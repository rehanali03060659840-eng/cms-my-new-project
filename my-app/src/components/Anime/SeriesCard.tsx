import { useNavigate } from "react-router-dom";
import type { Series } from "../../types/anime";
import { Eye } from "lucide-react";

interface SeriesCardProps {
  series: Series;
}

export const SeriesCard = ({ series }: SeriesCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/anime/series/${series._id}`)}
      className="group relative overflow-hidden rounded-xl bg-[#1a1a1a] transition-all hover:ring-2 hover:ring-orange-500/50"
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={series.coverImageUrl}
          alt={series.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%231a1a1a'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='24'%3ENo Image%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="mb-2 text-sm font-semibold text-white line-clamp-2 group-hover:text-orange-400 transition-colors">
          {series.title}
        </h3>

        <div className="mb-2 flex flex-wrap gap-1">
          {series.categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
        <Eye size={12} className="text-white/70" />
        <span className="text-[10px] text-white/70">
          {series.uploadedBy ? "Series" : "0"}
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="rounded-full bg-orange-500 p-4 shadow-lg shadow-orange-500/30">
          <svg
            className="h-8 w-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
};
