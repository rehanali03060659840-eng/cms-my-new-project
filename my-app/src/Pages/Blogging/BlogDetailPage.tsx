
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Tag, Hash, Rss, EyeOff } from "lucide-react";
import { getBlogBySlug, updateBlog } from "../../Api/BlogApi";
import type { BlogItem } from "../../types/blog";
import { getImageUrl } from "../../utils/imageUrl";

const decodeHtmlIfEscaped = (html: string): string => {
  if (!html) return html;
  if (html.includes("&lt;") || html.includes("&amp;")) {
    const textarea = document.createElement("textarea");
    let decoded = html;
    for (let i = 0; i < 2; i++) {
      textarea.innerHTML = decoded;
      const next = textarea.value;
      if (next === decoded) break;
      decoded = next;
    }
    return decoded;
  }
  return html;
};

export const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!slug) return;

    getBlogBySlug(slug)
      .then(setBlog)
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleTogglePublish = async () => {
    if (!blog) return;
    const newStatus = blog.status === "published" ? "draft" : "published";
    setToggling(true);
    try {
      await updateBlog(blog.slug, { status: newStatus });
      setBlog({ ...blog, status: newStatus });
    } catch (err) {
      alert("Status cannot update");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-9 w-2/3 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-48 w-full bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-slate-500">
        Blog not found
      </div>
    );
  }
const cardClass =
  "p-5 border border-slate-200/60 bg-white rounded-xl shadow-xs";
const isPublished = blog.status === "published";

const thumbnailItem =
  blog.media?.find((item) => item.isThumbnail) ||
  (blog.thumbnail
    ? { url: blog.thumbnail, type: "image" as const, isThumbnail: true, alt: "" }
    : null);
    const otherMedia = blog.media?.filter((item) => item !== thumbnailItem) ?? [];
  return (
    <div className="max-w-4xl mx-auto p-6 pb-16 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/blogs")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium w-fit cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Blogs
        </button>

        <button
          onClick={handleTogglePublish}
          disabled={toggling}
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
            isPublished
              ? "bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isPublished ? <EyeOff size={15} /> : <Rss size={15} />}
          {toggling ? "Updating..." : isPublished ? "Unpublish" : "Publish"}
        </button>
      </div>

      <div>
        <span
          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${
            isPublished
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {blog.status}
        </span>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">
          {blog.title}
        </h1>
        <p className="text-slate-500 mt-2 text-base">{blog.shortInfo}</p>
      </div>

      {thumbnailItem && (
        <figure>
          <img
            src={getImageUrl(thumbnailItem.url)}
            alt={thumbnailItem.alt || blog.title}
            className="w-full max-h-[420px] object-cover rounded-xl shadow-sm"
          />
          {thumbnailItem.alt && (
            <figcaption className="text-center text-xs text-slate-400 italic mt-2">
              {thumbnailItem.alt}
            </figcaption>
          )}
        </figure>
      )}

      {otherMedia.length > 0 && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Media Gallery
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {otherMedia.map((item, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden bg-slate-100"
              >
                {item.type === "image" ? (
                  <img
                    src={getImageUrl(item.url)}
                    alt={item.alt || `Media ${index}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={getImageUrl(item.url)}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div
          className="text-slate-700 leading-7 text-[15px]
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-2 [&_h1]:mb-4 [&_h1]:leading-tight
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
            [&_li]:leading-7
            [&_strong]:font-bold [&_strong]:text-slate-900
            [&_em]:italic
            [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2
            [&_img]:rounded-xl [&_img]:w-full [&_img]:my-1 [&_img]:shadow-sm
            [&_figure]:my-6
            [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-slate-400 [&_figcaption]:italic [&_figcaption]:mt-2
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:my-4
            [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-slate-700
            [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:text-sm
            [&_hr]:my-6 [&_hr]:border-slate-200
          "
          dangerouslySetInnerHTML={{ __html: decodeHtmlIfEscaped(blog.content?.html || "") }}
        />
      </div>

      {/* FAQ */}
      {blog.faq && blog.faq.length > 0 && (
        <div className={cardClass}>
          <h2 className="text-lg font-bold text-slate-900 mb-3">FAQs</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {blog.faq.map((item, index) => (
              <div key={index} className="py-3">
                <h3 className="font-semibold text-slate-800">
                  {item.question}
                </h3>
                <p className="text-slate-500 mt-1 text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERP Preview */}
      {blog.serp && (blog.serp.title || blog.serp.description) && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Search size={15} className="text-slate-400" /> Google Search Preview
          </h2>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-xs text-green-700">
              yoursite.com › blog › {blog.slug}
            </p>
            <p className="text-blue-700 text-lg leading-snug mt-0.5 hover:underline cursor-pointer">
              {blog.serp.title || blog.title}
            </p>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {blog.serp.description || blog.shortInfo}
            </p>
          </div>
        </div>
      )}

      {/* Meta info */}
      {blog.meta && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Meta Information
          </h2>
          <div className="flex flex-col gap-3 text-sm">
            {blog.meta.metaTitle && (
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">
                  Meta Title
                </span>
                <span className="text-slate-700">{blog.meta.metaTitle}</span>
              </div>
            )}
            {blog.meta.shortDescription && (
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">
                  Short Description
                </span>
                <span className="text-slate-700">
                  {blog.meta.shortDescription}
                </span>
              </div>
            )}
            {blog.meta.longDescription && (
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">
                  Long Description
                </span>
                <span className="text-slate-700">
                  {blog.meta.longDescription}
                </span>
              </div>
            )}

            {blog.meta.focusKeywords && blog.meta.focusKeywords.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-1.5">
                  <Hash size={12} /> Focus Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {blog.meta.focusKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {blog.meta.tags && blog.meta.tags.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-1.5">
                  <Tag size={12} /> Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {blog.meta.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};