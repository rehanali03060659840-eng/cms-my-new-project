import { useState, useEffect, useMemo } from "react";
import { useAnime } from "../../context/AnimeContext";
import { SeriesCard } from "../../components/Anime/SeriesCard";
import { SearchBar } from "../../components/Anime/SearchBar";
import { Loader2 } from "lucide-react";

export const AnimeHome = () => {
  const { series, loading, fetchSeries, fetchCategories } = useAnime();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchSeries();
    fetchCategories();
  }, [fetchSeries, fetchCategories]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    series.forEach((s) => s.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [series]);

  const filteredSeries = useMemo(() => {
    let filtered = series;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((s) =>
        s.categories.includes(selectedCategory)
      );
    }

    return filtered;
  }, [series, searchQuery, selectedCategory]);

  if (loading && series.length === 0) {
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
          Anime <span className="text-orange-500">Library</span>
        </h1>
        <p className="text-white/60">Discover and watch your favorite anime series</p>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search anime by title..."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            selectedCategory === null
              ? "bg-orange-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          All
        </button>
        {(selectedCategory ? allCategories : allCategories.slice(0, 12)).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-orange-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {filteredSeries.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <div className="mb-4 text-6xl">🎬</div>
          <h3 className="text-xl font-semibold text-white mb-2">No series found</h3>
          <p className="text-white/60">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "No anime series available yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSeries.map((s) => (
            <SeriesCard key={s._id} series={s} />
          ))}
        </div>
      )}
    </div>
  );
};