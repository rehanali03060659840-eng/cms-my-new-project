
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  ChevronDown,
  Pencil,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { IoSearchOutline } from "react-icons/io5";
import { getAllBlogs, deleteBlog, updateBlog } from "../../Api/BlogApi";
import type { BlogItem } from "../../types/blog";
import { getImageUrl } from "../../utils/imageUrl";

type Toast = { type: "success" | "error"; message: string } | null;

export const BlogPage = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [error, setError] = useState("");
  const [openMenuSlug, setOpenMenuSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuSlug(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllBlogs();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      await deleteBlog(slug);
      setBlogs((prev) => prev.filter((blog) => blog.slug !== slug));
      showToast("success", "Blog deleted successfully");
    } catch (err) {
      showToast("error", "Failed to delete blog");
    } finally {
      setOpenMenuSlug(null);
    }
  };

 const toggleStatus = async (blog: BlogItem) => {
    const newStatus = blog.status === "published" ? "draft" : "published";
    setUpdatingSlug(blog.slug);
    try {
      await updateBlog(blog.slug, { status: newStatus });
      setBlogs((prev) =>
        prev.map((b) => (b.slug === blog.slug ? { ...b, status: newStatus } : b)),
      );
      showToast(
        "success",
        newStatus === "published"
          ? "Blog published successfully"
          : "Blog moved to draft",
      );
    } catch (err) {
      showToast("error", "Failed to update blog status");
    } finally {
      setUpdatingSlug(null);
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.shortInfo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "All" || blog.status === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blogging Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage all your blogging from here
          </p>
        </div>
        <button
          onClick={() => navigate("/blogs/new")}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          + Add Blog
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl ring-1 ring-slate-200 p-4 mb-6 flex justify-between items-center mt-5">
        <div className="relative w-64">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-slate-200 w-full rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative inline-block">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer font-medium text-sm"
          >
            <option value="All">All</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl ring-1 ring-slate-200">
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">
            Blogs List ({filteredBlogs.length})
          </h2>
          <button
            onClick={loadBlogs}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400 italic text-sm p-6">Loading blogs...</p>
        ) : error ? (
          <div className="bg-red-50 border-t border-red-200 text-red-600 p-4 text-sm">
            <p>{error}</p>
            <button onClick={loadBlogs} className="mt-2 text-red-700 underline">
              Try Again
            </button>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <p className="text-slate-400 italic text-sm p-6">
            {blogs.length === 0
              ? "No blogs added yet. Click '+ Add Blog' to create one."
              : "No blogs match your search/filter."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3 w-20">Thumbnail</th>
                <th className="text-left font-semibold px-5 py-3">Title</th>
                <th className="text-left font-semibold px-5 py-3 w-40">Status</th>
                <th className="text-right font-semibold px-5 py-3 w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBlogs.map((blog) => (
                <tr key={blog._id || blog.slug} className="hover:bg-slate-50/70 transition-colors bg-white-50/30">
                  <td className="px-5 py-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                      {blog.thumbnail ? (
                        <img
                          src={getImageUrl(blog.thumbnail)}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<span class="text-[10px] text-slate-400">No Image</span>';
                            }
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">No Image</span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <button
                      onClick={() => navigate(`/blogs/${blog.slug}`)}
                      className="text-left font-semibold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                    >
                      {blog.title || "Untitled"}
                    </button>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {blog.shortInfo || "No description"}
                    </p>
                  </td>

                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleStatus(blog)}
                      disabled={updatingSlug === blog.slug}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                        blog.status === "published"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      {blog.status === "published" ? (
                        <>
                          <RotateCcw size={12} /> Unpublish
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} /> Publish
                        </>
                      )}
                    </button>
                  </td>

                  <td className="px-5 py-3 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() =>
                          setOpenMenuSlug(openMenuSlug === blog.slug ? null : blog.slug)
                        }
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuSlug === blog.slug && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 z-20 w-36 bg-white rounded-lg shadow-lg ring-1 ring-slate-200 py-1 text-left"
                        >
                          <button
                            onClick={() => {
                              navigate(`/blogs/${blog.slug}`);
                              setOpenMenuSlug(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => {
                              navigate(`/blogs/edit/${blog.slug}`);
                              setOpenMenuSlug(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(blog.slug)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};