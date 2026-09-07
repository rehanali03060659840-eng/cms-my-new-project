import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

interface ThumbnailUploadProps {
  value: string; // current thumbnail URL (agar edit mode hai)
  onFileSelected: (file: File | null) => void;
}

export const ThumbnailUpload = ({ value, onFileSelected }: ThumbnailUploadProps) => {
  const [preview, setPreview] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelected(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleRemove = () => {
    onFileSelected(null);
    setPreview("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thumbnail</label>

      {preview ? (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 group">
          <img src={preview} alt="Thumbnail preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 rounded-full p-1 shadow-md cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-slate-400">
          <ImagePlus size={22} />
          <span className="text-xs mt-1.5">Click to upload thumbnail</span>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
        </label>
      )}
    </div>
  );
};