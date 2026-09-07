import { useEffect, useState, type FormEvent } from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Image,
  Video,
  ImagePlus,
} from "lucide-react";

import { RichTextEditor } from "./componentsblog/RichTextEditor";

import {
  createBlog,
  getBlogBySlug,
  updateBlog,
  uploadMultipleMedia,
} from "../../Api/BlogApi";

import type { BlogStatus, FaqItem, MediaItem } from "../../types/blog";

import { getImageUrl } from "../../utils/imageUrl";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const BlogFormPage = () => {
  const navigate = useNavigate();
  const { slug: slugParam } = useParams<{ slug: string }>();
  const isEditMode = Boolean(slugParam);
  const [title, setTitle] = useState("");
  const [shortInfo, setShortInfo] = useState("");
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [contentHtml, setContentHtml] = useState("");
  const [contentText, setContentText] = useState("");

  const [faqList, setFaqList] = useState<FaqItem[]>([
    { question: "", answer: "" },
  ]);

  const [serpTitle, setSerpTitle] = useState("");
  const [serpDescription, setSerpDescription] = useState("");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaShortDescription, setMetaShortDescription] = useState("");
  const [metaLongDescription, setMetaLongDescription] = useState("");
  const [focusKeywordsText, setFocusKeywordsText] = useState("");
  const [tagsText, setTagsText] = useState("");

  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [schemaText, setSchemaText] = useState("{}");
  const [schemaError, setSchemaError] = useState("");

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  useEffect(() => {
    if (!slugParam) return;

    const loadBlog = async () => {
      try {
        const blog = await getBlogBySlug(slugParam);
        setTitle(blog.title);
        setShortInfo(blog.shortInfo);
        setStatus(blog.status);
        setThumbnailUrl(blog.thumbnail || "");
        setMediaItems(blog.media || []);
        setContentHtml(blog.content?.html || "");
        setContentText(blog.content?.text || "");
        setFaqList(
          blog.faq?.length ? blog.faq : [{ question: "", answer: "" }],
        );
        setSerpTitle(blog.serp?.title || "");
        setSerpDescription(blog.serp?.description || "");
        setMetaTitle(blog.meta?.metaTitle || "");
        setMetaShortDescription(blog.meta?.shortDescription || "");
        setMetaLongDescription(blog.meta?.longDescription || "");
        setFocusKeywordsText((blog.meta?.focusKeywords || []).join(", "));
        setTagsText((blog.meta?.tags || []).join(", "));
        setSlug(blog.slug);
        setSlugTouched(true);
        setSchemaText(JSON.stringify(blog.schema || {}, null, 2));
      } catch (err) {
        setError("Blog cannot load.");
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [slugParam]);

  // MEDIA HANDLERS
  const handleMediaUpload = async (files: FileList) => {
    setUploadingMedia(true);
    try {
      const fileArray = Array.from(files);
      const uploadedUrls = await uploadMultipleMedia(fileArray);

      const uploadedItems: MediaItem[] = uploadedUrls.map(
        (url: string, index: number) => {
          const file = fileArray[index];
          const isImage = file.type.startsWith("image/");
          const isThumbnail = isImage && !thumbnailUrl;
          if (isThumbnail) {
            setThumbnailUrl(url);
          }
          return {
            url,
            type: isImage ? "image" : "video",
            isThumbnail,
            alt: "",
          };
        },
      );

      setMediaItems((prev) => [...prev, ...uploadedItems]);
    } catch (err: any) {
      setError(err.message || "Media cannot upload try again");
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) => {
      const wasThumbnail = prev[index].isThumbnail;
      const newItems = prev.filter((_, i) => i !== index);

      if (wasThumbnail && newItems.length > 0) {
        const nextImageIndex = newItems.findIndex(
          (item) => item.type === "image",
        );
        if (nextImageIndex !== -1) {
          newItems[nextImageIndex] = {
            ...newItems[nextImageIndex],
            isThumbnail: true,
          };
          setThumbnailUrl(newItems[nextImageIndex].url);
        } else {
          setThumbnailUrl("");
        }
      }
      return newItems;
    });
  };

  const setAsThumbnail = (index: number) => {
    setMediaItems((prev) =>
      prev.map((item, i) => ({
        ...item,
        isThumbnail: i === index && item.type === "image",
      })),
    );
    const item = mediaItems[index];
    if (item.type === "image") {
      setThumbnailUrl(item.url);
    }
  };
  const insertImageIntoContent = (item: MediaItem) => {
    if (item.type !== "image") return;
    const imgTag = `<img src="${getImageUrl(item.url)}" alt="${
      item.alt || ""
    }" />`;
    setContentHtml((prev) => (prev ? `${prev}\n${imgTag}` : imgTag));
  };

  // FAQ handlers
  const handleFaqChange = (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => {
    setFaqList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addFaqRow = () =>
    setFaqList((prev) => [...prev, { question: "", answer: "" }]);

  const removeFaqRow = (index: number) =>
    setFaqList((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSchemaError("");

    let parsedSchema: Record<string, any> = {};
    try {
      parsedSchema = schemaText.trim() ? JSON.parse(schemaText) : {};
    } catch {
      setSchemaError("Schema box me valid JSON likho.");
      return;
    }

    if (!title.trim()) {
      setError("Title alway requried");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        shortInfo: shortInfo.trim(),
        thumbnail: thumbnailUrl,
        media: mediaItems,
        content: {
          html: contentHtml,
          text: contentText || contentHtml.replace(/<[^>]*>/g, ""),
        },
        faq: faqList.filter((f) => f.question.trim() || f.answer.trim()),
        serp: {
          title: serpTitle.trim() || title.trim(),
          description: serpDescription.trim() || shortInfo.trim(),
        },
        meta: {
          metaTitle: metaTitle.trim() || title.trim(),
          shortDescription: metaShortDescription.trim() || shortInfo.trim(),
          longDescription: metaLongDescription.trim() || shortInfo.trim(),
          focusKeywords: focusKeywordsText
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          tags: tagsText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        slug: slug.trim(),
        schema: parsedSchema,
        status,
      };

      if (isEditMode && slugParam) {
        await updateBlog(slugParam, payload);
      } else {
        await createBlog(payload);
      }

      navigate("/blogs");
    } catch (err: any) {
      setError(err.message || "error cant't save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-500 text-sm">Loading...</div>;
  }

  const sectionClass =
    "p-5 border border-slate-200/60 bg-white rounded-xl flex flex-col gap-4 shadow-xs";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";
  const inputClass =
    "w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  return (
    <div className="max-w-6xl mx-auto p-6 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate("/blogs")}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isEditMode ? "Edit Blog" : "Add New Blog"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEditMode ? "update this Blog" : "Create new blog"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogStatus)}
                className={`${inputClass} bg-slate-50 cursor-pointer`}
              >
                <option value="draft">Draft (unpublished)</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Blog title"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Short Info *</label>
              <input
                type="text"
                value={shortInfo}
                onChange={(e) => setShortInfo(e.target.value)}
                placeholder="Write a 2 line summary..."
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>URL (slug) *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                placeholder="my-blog-title"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className={sectionClass}>
            <label className={labelClass}>Media (Images & Videos)</label>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleMediaUpload(e.target.files);
                  }
                }}
                className="hidden"
                id="media-upload"
                disabled={uploadingMedia}
              />
              <label
                htmlFor="media-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="flex gap-2">
                  <Image size={24} className="text-slate-400" />
                  <Video size={24} className="text-slate-400" />
                </div>
                <span className="text-sm text-slate-500">
                  {uploadingMedia
                    ? "Uploading..."
                    : "Click to upload images & videos"}
                </span>
                <span className="text-xs text-slate-400">
                  Multiple files allowed
                </span>
              </label>
            </div>

            {mediaItems.length > 0 && (
              <>
                <p className="text-xs text-slate-400">
                  Hover an image and click{" "}
                  <ImagePlus size={11} className="inline -mt-0.5" /> to insert
                  it into the content below.
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1 mt-1">
                  {mediaItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-40 flex flex-col gap-1"
                    >
                      <div className="relative group w-40 h-40 rounded-lg bg-slate-100">
                        {item.type === "image" ? (
                          <img
                            src={getImageUrl(item.url)}
                            alt={item.alt || `Media ${index}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={getImageUrl(item.url)}
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}

                        {item.isThumbnail && (
                          <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            Thumbnail
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {item.type === "image" && !item.isThumbnail && (
                            <button
                              type="button"
                              onClick={() => setAsThumbnail(index)}
                              className="bg-blue-500 text-white text-[10px] px-1.5 py-1 rounded hover:bg-blue-600"
                            >
                              Set Thumb
                            </button>
                          )}
                          {item.type === "image" && (
                            <button
                              type="button"
                              onClick={() => insertImageIntoContent(item)}
                              title="Insert into content"
                              className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600"
                            >
                              <ImagePlus size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        {item.isThumbnail && (
                          <div className="mt-6 w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Thumbnail Alt Text
                            </label>

                            <input
                              type="text"
                              value={item.alt || ""}
                              placeholder="enter about image"
                              onChange={(e) => {
                                const value = e.target.value;

                                setMediaItems((prev) =>
                                  prev.map((item, i) =>
                                    i === index
                                      ? {
                                          ...item,
                                          alt: value,
                                        }
                                      : item,
                                  ),
                                );
                              }}
                              className="w-full border rounded-lg p-1"
                            />
                          </div>
                        )}
                      </div>
                      <p
                        className="text-[11px] text-slate-500 truncate px-0.5"
                        title={item.alt}
                      >
                        {item.alt || "No alt text"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>Content (Rich Text Editor)</label>
          <div className="w-full">
            <RichTextEditor
              value={contentHtml}
              onChange={(html, text) => {
                setContentHtml(html);
                setContentText(text);
              }}
            />
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <label className={labelClass + " mb-0"}>FAQs</label>
            <button
              type="button"
              onClick={addFaqRow}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold cursor-pointer"
            >
              <Plus size={14} /> Add more
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {faqList.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2 relative"
              >
                {faqList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaqRow(index)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) =>
                    handleFaqChange(index, "question", e.target.value)
                  }
                  placeholder={`Question ${index + 1}`}
                  className={inputClass}
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) =>
                    handleFaqChange(index, "answer", e.target.value)
                  }
                  placeholder="Answer"
                  className={`${inputClass} min-h-[70px] resize-none`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={sectionClass}>
            <label className={labelClass + " mb-0"}>SERP Snippet</label>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Title
              </label>
              <input
                type="text"
                value={serpTitle}
                onChange={(e) => setSerpTitle(e.target.value)}
                placeholder="Search result title"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Description
              </label>
              <textarea
                value={serpDescription}
                onChange={(e) => setSerpDescription(e.target.value)}
                placeholder="Search result description"
                className={`${inputClass} min-h-[70px] resize-none`}
              />
            </div>
          </div>

          <div className={sectionClass}>
            <label className={labelClass + " mb-0"}>Meta Tags</label>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Short Description
              </label>
              <textarea
                value={metaShortDescription}
                onChange={(e) => setMetaShortDescription(e.target.value)}
                className={`${inputClass} min-h-[60px] resize-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Long Description
              </label>
              <textarea
                value={metaLongDescription}
                onChange={(e) => setMetaLongDescription(e.target.value)}
                className={`${inputClass} min-h-[90px] resize-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Focus Keywords (comma separated)
              </label>
              <input
                type="text"
                value={focusKeywordsText}
                onChange={(e) => setFocusKeywordsText(e.target.value)}
                placeholder="keyword one, keyword two"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="tag1, tag2"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <label className={labelClass + " mb-0"}>Schema (JSON-LD)</label>
          <textarea
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            placeholder='{ "@context": "https://schema.org", "@type": "Article" }'
            className={`${inputClass} min-h-[140px] font-mono text-xs resize-y`}
          />
          {schemaError && <p className="text-xs text-red-600">{schemaError}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/blogs")}
            className="text-slate-600 hover:text-slate-800 font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving..." : isEditMode ? "Update Blog" : "Save Blog"}
          </button>
        </div>
      </form>
    </div>
  );
};
