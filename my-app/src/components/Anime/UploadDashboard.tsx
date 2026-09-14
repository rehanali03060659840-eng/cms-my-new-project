import { useState, useRef } from "react";
import type { ParsedFile, Series } from "../../types/anime";
import { Search, Upload, FileVideo, X } from "lucide-react";
import toast from "react-hot-toast";

interface UploadDashboardProps {
  series: Series[];
  onUpload: (data: {
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
  }) => Promise<void>;
  disabled: boolean;
}

type Mode = "existing" | "new";

const ALLOWED_CATEGORIES = [
  "Anime", "Romance", "Animation", "Action", "Adventure", "Fantasy", "Love", "Romantic", "Horror", "Mystery",
];

export const UploadDashboard = ({ series, onUpload, disabled }: UploadDashboardProps) => {
  const [mode, setMode] = useState<Mode>("existing");
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [seriesSearch, setSeriesSearch] = useState("");
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [newSeries, setNewSeries] = useState({
    title: "",
    description: "",
    coverImageUrl: "",
    categories: [] as string[],
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSeries = series.filter((s) =>
    s.title.toLowerCase().includes(seriesSearch.toLowerCase())
  );

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const validFiles = Array.from(newFiles).filter((f) =>
      f.type.startsWith("video/")
    );
    if (validFiles.length !== newFiles.length) {
      toast.error("Only video files are allowed");
    }
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (mode === "existing" && !selectedSeriesId) {
      toast.error("Please select a series");
      return;
    }
    if (mode === "new") {
      if (!newSeries.title || !newSeries.description || !newSeries.coverImageUrl) {
        toast.error("Please fill all series fields");
        return;
      }
      if (newSeries.categories.length < 3) {
        toast.error("Please select at least 3 categories");
        return;
      }
    }
    if (files.length === 0) {
      toast.error("Please select at least one video file");
      return;
    }

    const parsedData = files.map((file) => {
      const match = file.name.match(/^(.+?)\s*(?:s(\d+))?\s*(?:ep?(\d+))?/i);
      if (match) {
        return {
          originalName: file.name,
          title: match[1]?.trim() || "",
          season: match[2] ? parseInt(match[2]) : seasonNumber,
          episode: match[3] ? parseInt(match[3]) : 0,
        };
      }
      return {
        originalName: file.name,
        title: "",
        season: seasonNumber,
        episode: 0,
      };
    });

    await onUpload({
      mode,
      seriesId: mode === "existing" ? selectedSeriesId : undefined,
      newSeries: mode === "new" ? newSeries : undefined,
      seasonNumber,
      files,
      parsedData,
    });

    setFiles([]);
    setSelectedSeriesId("");
    setSeriesSearch("");
    setNewSeries({ title: "", description: "", coverImageUrl: "", categories: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl bg-white/5 p-1 w-fit">
        <button
          onClick={() => setMode("existing")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "existing"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          <Upload size={16} />
          Existing Series
        </button>
        <button
          onClick={() => setMode("new")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "new"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          <FileVideo size={16} />
          Create New Series
        </button>
      </div>

      {mode === "existing" ? (
        <div className="rounded-xl bg-white/5 p-6 border border-white/10">
          <label className="block text-sm font-medium text-white mb-2">Select Series</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search existing series..."
              value={seriesSearch}
              onChange={(e) => setSeriesSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111] py-3 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
            {filteredSeries.map((s) => (
              <button
                key={s._id}
                onClick={() => setSelectedSeriesId(s._id)}
                className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                  selectedSeriesId === s._id
                    ? "bg-orange-500/20 border border-orange-500/30"
                    : "bg-white/5 border border-white/5 hover:bg-white/10"
                }`}
              >
                <img src={s.coverImageUrl} alt={s.title} className="h-10 w-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.title}</p>
                  <div className="flex gap-1 mt-1">
                    {s.categories.slice(0, 2).map((cat) => (
                      <span key={cat} className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-medium text-white">New Series Details</h3>
          <input
            type="text"
            placeholder="Series Title"
            value={newSeries.title}
            onChange={(e) => setNewSeries({ ...newSeries, title: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none"
          />
          <textarea
            placeholder="Description"
            value={newSeries.description}
            onChange={(e) => setNewSeries({ ...newSeries, description: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none resize-none h-20"
          />
          <input
            type="text"
            placeholder="Cover Image URL"
            value={newSeries.coverImageUrl}
            onChange={(e) => setNewSeries({ ...newSeries, coverImageUrl: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none"
          />
          <div>
            <label className="block text-sm font-medium text-white mb-2">Categories (min 3)</label>
            <div className="flex flex-wrap gap-2">
              {ALLOWED_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    const cats = newSeries.categories.includes(cat)
                      ? newSeries.categories.filter((c) => c !== cat)
                      : [...newSeries.categories, cat];
                    setNewSeries({ ...newSeries, categories: cats });
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    newSeries.categories.includes(cat)
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white/5 p-6 border border-white/10">
        <label className="block text-sm font-medium text-white mb-2">Season Number</label>
        <input
          type="number"
          min={1}
          value={seasonNumber}
          onChange={(e) => setSeasonNumber(parseInt(e.target.value) || 1)}
          className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none"
        />
      </div>

      <div className="rounded-xl bg-white/5 p-6 border border-white/10">
        <label className="block text-sm font-medium text-white mb-2">Video Files</label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? "border-orange-500 bg-orange-500/10"
              : "border-white/20 hover:border-white/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <Upload className="mx-auto mb-3 text-white/40" size={32} />
          <p className="text-sm text-white/60">Drag & drop video files here, or click to browse</p>
          <p className="text-xs text-white/40 mt-1">Supports multiple files</p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-white/60">{files.length} file(s) selected</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileVideo size={14} className="text-orange-500 shrink-0" />
                    <span className="text-sm text-white/80 truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-white/40 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || files.length === 0}
        className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-500 hover:to-orange-400 disabled:opacity-50"
      >
        {disabled ? "Uploading..." : `Upload ${files.length} Episode(s)`}
      </button>
    </div>
  );
};
