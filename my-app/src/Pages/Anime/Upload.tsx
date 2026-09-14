import { useState, useEffect } from "react";
import { UploadDashboard } from "../../components/Anime/UploadDashboard";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { seriesApi } from "../../Api/animeApi";
import { uploadToBucket, parseFilename, calculateNextEpisodeNumbers } from "../../utils/supabaseStorage";
import type { Series, ParsedFile } from "../../types/anime";
import toast from "react-hot-toast";
import { Loader2, ShieldAlert } from "lucide-react";
 
export const Upload = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<Series[]>([]);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const res = await seriesApi.getAll();
        setSeries(res.data);
      } catch (error) {
        console.error("Failed to fetch series", error);
      }
    };
    fetchSeries();
  }, []);

  const handleUpload = async (data: {
    mode: "existing" | "new";
    seriesId?: string;
    newSeries?: {
      title: string;
      description: string;
      coverImageUrl: string;
      categories: string[];
    };
    seasonNumber: number;
    files: File[];
    parsedData: ParsedFile[];
  }) => {
    const { mode } = data;
    if (!user) {
      toast.error("You must be logged in to upload");
      return;
    }

    setLoading(true);

    try {
      let targetSeriesId = data.seriesId;

      if (mode === "new" && data.newSeries) {
        const seriesRes = await seriesApi.create(data.newSeries);
        targetSeriesId = seriesRes.data._id;
        toast.success("Series created successfully");
      }

      if (!targetSeriesId) {
        throw new Error("Series ID not found");
      }

      const seasonNumber = data.seasonNumber;
      const episodeNumbers = calculateNextEpisodeNumbers(
        [],
        seasonNumber,
        data.files.length
      );

      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        const parsed = data.parsedData[i];
        const episodeNumber = episodeNumbers[i];

        const videoUpload = await uploadToBucket(file, "ANIME_VIDEOS", "videos");
        const videoUrl = videoUpload.url;

        await fetch("http://localhost:3000/anime/episodes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            seriesId: targetSeriesId,
            seasonNumber,
            episodeNumber,
            videoUrl,
            thumbnailUrl: "",
          }),
        });
      }

      toast.success(`${data.files.length} episode(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (user?.email !== "admin@aniverse.com" && user?.role !== "super_admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-orange-500" />
        <h2 className="mb-2 text-xl font-bold text-white">Access Denied</h2>
        <p className="text-white/60">
          Only administrators can access this panel
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Upload <span className="text-orange-500">Episodes</span>
        </h1>
        <p className="text-white/60">
          Upload video files to Supabase storage and save URLs to database
        </p>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-[#1a1a1a] p-8">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="text-white">Uploading to Supabase storage...</p>
          </div>
        </div>
      )}

      <UploadDashboard
        series={series}
        onUpload={handleUpload}
        disabled={loading}
      />
    </div>
  );
};