import { useEffect, useState } from "react";
import { reelsApi } from "../Api/ReelsApi";
import {
  TrendingReelsListForm,
  type ReelData,
} from "../form/trendingreelslistForm";
import { FiEdit } from "react-icons/fi";
import { FaRegTrashAlt } from "react-icons/fa";
import toast from "react-hot-toast";

const THUMBNAIL_BASE_URL = "http://localhost:3000";

export const TrendingReelsList = () => {
  const [reelsOpenForm, setReelsOpenForm] = useState(false);
  const [reelsList, setReelsList] = useState<ReelData[]>([]);
  const [editingReel, setEditingReel] = useState<ReelData | null>(null);
  const [previewReel, setPreviewReel] = useState<ReelData | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await reelsApi.get("/");
      setReelsList(res.data);

    } catch (error) {
      return error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const handleAddClick = () => {
    setEditingReel(null);
    setReelsOpenForm(true);
  };

  const handleEditClick = (reel: ReelData) => {
    setEditingReel(reel);
    setReelsOpenForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const confirmed = window.confirm("Are you sure to delete this video");
    if (!confirmed) return;

    try {
      await reelsApi.delete(`/${id}`);
      setReelsList((prev) => prev.filter((reel) => reel._id !== id));
      toast.success("Successfully deleted")
    } catch (error) {
      toast.error("Deleted Failed")

    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryName = (reel: ReelData) => {
    if (typeof reel.category === "object" && reel.category !== null) {
      return reel.category.name;
    }
    return "-";
  };

  const getUrlType = (url?: string): { label: string; color: string } => {
    if (!url)
      return {
        label: "Unknown",
        color: "bg-gray-50 text-gray-600 border-gray-200",
      };

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      return {
        label: "YouTube",
        color: "bg-red-50 text-red-700 border-red-200",
      };
    }
    if (lowerUrl.includes("instagram.com")) {
      return {
        label: "Instagram",
        color: "bg-pink-50 text-pink-700 border-pink-200",
      };
    }
    if (lowerUrl.includes("tiktok.com")) {
      return {
        label: "TikTok",
        color: "bg-slate-200 text-slate-700 border-slate-200",
      };
    }
    if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.watch")) {
      return {
        label: "Facebook",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }
    if (/\.(mp4|webm|mov|ogg)(\?.*)?$/.test(lowerUrl)) {
      return {
        label: "Direct Video",
        color: "bg-green-50 text-green-700 border-green-200",
      };
    }
    if (lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://")) {
      return {
        label: "Other Link",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      };
    }
    return {
      label: "Invalid",
      color: "bg-gray-50 text-gray-500 border-gray-200",
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center rounded-xl shadow-sm p-2 ">
        <div className="pl-2">
          <h1 className="text-3xl mb-1 font-bold">Reels</h1>
          <p className="text-sm text-zinc-800">
            Manage all your reel from here
          </p>
        </div>
        <div className="pr-2">
          <button
            onClick={handleAddClick}
            className="bg-blue-400 p-2 text-white rounded-[5px] cursor-pointer font-semibold hover:bg-blue-300"
          >
            + Add reel
          </button>
        </div>
      </div>

      {reelsOpenForm && (
        <div className="fixed inset-0 bg-black-50 z-50 flex justify-center item-center">
          <div className="shadow-lg overflow-y-auto bg-white max-w-2xl relative">
            <TrendingReelsListForm
              editData={editingReel}
              onClose={() => setReelsOpenForm(false)}
              onSuccess={fetchReels}
            />
          </div>
        </div>
      )}

      <div className="w-full bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">
            Reels List ({reelsList.length})
          </h2>
          <button
            onClick={fetchReels}
            className="text-blue-500 text-sm font-semibold hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 p-1 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 w-28">Thumbnail</th>
                <th className="p-4">Title & Description</th>
                <th className="p-4 w-28">Watch</th>
                <th className="p-4 w-28">URL Type</th>
                <th className="p-4 w-40">Category</th>
                <th className="p-4 w-32">Date</th>
                <th className="p-4 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-400 text-sm"
                  >
                    Loading reels...
                  </td>
                </tr>
              ) : reelsList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-400 text-sm"
                  >
                    No reels added yet. Click "+ Add reel" to upload.
                  </td>
                </tr>
              ) : (
                reelsList.map((reel) => (
                  <tr
                    key={reel._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewReel(reel);
                          setVideoError(false);
                        }}
                        className="relative group w-14 h-14 block"
                        title="Play video"
                      >
                        {reel.thumbnail ? (
                          <img
                            src={`${THUMBNAIL_BASE_URL}${reel.thumbnail}`}
                            alt="thumbnail"
                            className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                            No Img
                          </div>
                        )}
                        {/* Play icon overlay */}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-lg transition-opacity">
                            ▶
                          </span>
                        </span>
                      </button>
                    </td>

                    {/* Title and Description */}
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 text-sm">
                        {reel.title}
                      </div>
                      <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {reel.description}
                      </div>
                    </td>

                    {/* Watch Mode Column */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewReel(reel);
                          setVideoError(false);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                      >
                        ▶ Watch
                      </button>
                    </td>

                    {/* URL Type Column */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getUrlType(reel.playableUrl).color}`}
                      >
                        {getUrlType(reel.playableUrl).label}
                      </span>
                    </td>

                    {/* Category Column (replaces Status/Publish) */}
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {getCategoryName(reel)}
                      </span>
                    </td>

                    {/* Date Column */}
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(reel.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEditClick(reel)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-semibold border border-blue-400 rounded bg-blue-100 p-1"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(reel._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold border border-red-400 p-1 rounded bg-red-100"
                          title="Delete"
                        >
                          <FaRegTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewReel && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4"
          onClick={() => setPreviewReel(null)}
        >
          <div
            className="bg-black rounded-xl overflow-hidden max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewReel(null)}
              className="absolute top-2 right-2 z-10 text-white text-xl bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
            >
              ✕
            </button>
            {videoError ? (
              <div className="w-full h-64 flex flex-col items-center justify-center gap-3 text-white px-6 text-center">
                <span className="text-3xl">⚠</span>
                <p className="text-sm text-gray-300">
                  This video could not be played in this player. It is possible
                  that the URL is not for a direct video file (.mp4), or the
                  link is invalid
                </p>
                <a
                  href={previewReel.playableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm font-medium"
                >
                  Playable URL open in new tab ↗
                </a>
              </div>
            ) : (
              <video
                key={previewReel._id}
                src={previewReel.playableUrl}
                controls
                autoPlay
                onError={() => setVideoError(true)}
                className="w-full max-h-[80vh] bg-black"
              >
                Your browser does not support video playback.
              </video>
            )}
            <div className="p-3 bg-white">
              <div className="font-semibold text-sm text-gray-900">
                {previewReel.title}
              </div>
              <a
                href={previewReel.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline"
              >
                Open original URL ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
