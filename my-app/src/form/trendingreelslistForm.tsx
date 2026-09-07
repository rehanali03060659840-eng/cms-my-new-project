import React, { useEffect, useState } from "react";
import { categoryApi } from "../Api/categoryapi"; 
import { reelsApi } from "../Api/ReelsApi"; 

export interface Category {
  _id: string;
  name: string;
  status?: string;
}

export interface ReelData {
  _id?: string;
  title: string;
  videoUrl: string;
  playableUrl: string;
  thumbnail: string | null; 
  description: string;
  category: string | Category; 
  status?: string;
  createdAt?: string;
}

export interface TrendingReelsListFormProps {
  onSuccess: () => void; 
  onClose: () => void;
  editData?: ReelData | null; 
}

export const TrendingReelsListForm = ({
  onSuccess,
  onClose,
  editData,
}: TrendingReelsListFormProps) => {
  const isEditMode = !!editData;

  const [title, setTitle] = useState(editData?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(editData?.videoUrl ?? "");
  const [playableUrl, setPlayableUrl] = useState(editData?.playableUrl ?? "");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [description, setDescription] = useState(editData?.description ?? "");
  const [categoryId, setCategoryId] = useState(
    typeof editData?.category === "object" ? editData.category._id : editData?.category ?? "",
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.get("/");
        setCategories(res.data);
      } catch (err) {
        console.error("Category fetch failed:", err);
        setError("Category list could not loaded");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!videoUrl || !title || !playableUrl || !description || !categoryId) {
      setError("fPlease fil required fields");
      return;
    }
    if (!isEditMode && !thumbnail) {
      setError("Select thumbnail image");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("videoUrl", videoUrl);
    formData.append("playableUrl", playableUrl);
    formData.append("description", description);
    formData.append("category", categoryId);
    if (thumbnail) formData.append("thumbnail", thumbnail);

    try {
      setSubmitting(true);
      if (isEditMode && editData?._id) {
        await reelsApi.put(`/${editData._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await reelsApi.post("/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Reel save failed:", err);
      setError("Reel save failed. please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl p-8 bg-white shadow-xl rounded-xl relative">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Edit Reel" : "Add New Reels"}
          </h2>
          <p className="flex mt-1 text-sm text-gray-500">
            Fill in the information below to {isEditMode ? "update this" : "upload a new"} trending reel.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="absolute text-xl top-3 right-3"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-semibold text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter reel title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-semibold text-gray-700">
              Category
            </label>
            <select
              id="category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCategories}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all bg-white"
            >
              <option value="" disabled>
                {loadingCategories ? "Loading categories..." : "Select a category"}
              </option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Video URL Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="videoUrl" className="text-sm font-semibold text-gray-700">
              Video URL
            </label>
            <input
              id="videoUrl"
              type="url"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Playable URL Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="playableUrl" className="text-sm font-semibold text-gray-700">
              Playable URL
            </label>
            <input
              id="playableUrl"
              type="url"
              required
              value={playableUrl}
              onChange={(e) => setPlayableUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Thumbnail File Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="thumbnail" className="text-sm font-semibold text-gray-700">
              Thumbnail Image {isEditMode && "(optional - blank means keep existing)"}
            </label>
            <input
              id="thumbnail"
              type="file"
              accept="image/*"
              required={!isEditMode}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setThumbnail(e.target.files[0]);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer focus:ring-2 focus:ring-slate-400 transition-all"
            />
          </div>

          {/* Description Textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short description about this reel..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
            ></textarea>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow transition-colors duration-200 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Saving..." : isEditMode ? "Update Data" : "Post Data"}
          </button>
        </div>
      </form>
    </div>
  );
};