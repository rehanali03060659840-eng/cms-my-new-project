import { useState } from "react";
import { Heart } from "lucide-react";
import { useAnime } from "../../context/AnimeContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface FavoriteButtonProps {
  seriesId: string;
}

export const FavoriteButton = ({ seriesId }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useAnime();
  const [isFav, setIsFav] = useState(isFavorite(seriesId));

  const handleClick = async () => {
    if (!user) {
      toast.error("Please login to add favorites");
      return;
    }
    try {
      await toggleFavorite(seriesId);
      setIsFav(!isFav);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update favorite");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
        isFav
          ? "bg-red-500/20 text-red-400 border border-red-500/30"
          : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20"
      }`}
    >
      <Heart size={18} fill={isFav ? "currentColor" : "none"} />
      {isFav ? "Favorited" : "Add to Favorites"}
    </button>
  );
};
