import type { ParsedFile } from "../../types/anime";
import { Upload, X, FileVideo } from "lucide-react";

interface BulkUploadProps {
  files: File[];
  parsedData: ParsedFile[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export const BulkUpload = ({
  files,
  parsedData,
  onFileSelect,
  onRemoveFile,
}: BulkUploadProps) => {
  const episodesBySeason: { [season: number]: number[] } = {};
  parsedData.forEach((p) => {
    if (!episodesBySeason[p.season]) {
      episodesBySeason[p.season] = [];
    }
    episodesBySeason[p.season].push(p.episode);
  });

  const getNextEpisode = (season: number) => {
    const eps = episodesBySeason[season] || [];
    return eps.length > 0 ? Math.max(...eps) + 1 : 1;
  };

  return (
    <div>
      <label className="mb-2 block text-sm text-white/70">
        Video Files (multiple)
      </label>

      <div className="mb-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-8 transition-colors hover:border-orange-500/50 hover:bg-white/10">
          <Upload className="mb-3 h-10 w-10 text-white/40" />
          <p className="mb-1 text-sm text-white/80">
            Click to select files
          </p>
          <p className="text-xs text-white/50">
            Supports MP4, MKV, AVI, MOV
          </p>
          <input
            type="file"
            multiple
            accept="video/*"
            onChange={onFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">
              Files to Upload ({files.length})
            </h4>
            <div className="text-xs text-white/60">
              {Object.entries(episodesBySeason).map(([season, eps]) => (
                <span key={season} className="mr-2">
                  S{season}: {eps.sort((a, b) => a - b).join(", ")}
                </span>
              ))}
            </div>
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto">
            {parsedData.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg bg-[#111] p-3"
              >
                <FileVideo
                  size={20}
                  className="shrink-0 text-orange-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">
                    {file.originalName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">
                      S{file.season}E{file.episode}
                    </span>
                    {file.title && (
                      <span className="truncate text-xs text-white/50">
                        {file.title}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="shrink-0 rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {Object.keys(episodesBySeason).length > 0 && (
            <div className="mt-4 rounded-lg bg-orange-500/10 border border-orange-500/30 p-3">
              <p className="text-xs text-orange-400">
                <strong>Smart Sequencing:</strong> Episodes will be numbered
                continuously from S
                {Object.keys(episodesBySeason)[0]}:E
                {getNextEpisode(parseInt(Object.keys(episodesBySeason)[0]))}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
