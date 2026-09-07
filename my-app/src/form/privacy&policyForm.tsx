import { useEffect, useState } from "react";
import { DateControlled } from "./dateinput";
import { TipTapRichTextEditor } from "../tiptapeditor/tiptapEditorContent";
import {
  createPrivacyPolicy,
  updatePrivacyPolicy,
  type PrivacyPolicyRecord,
} from "../Api/privacypolicyApi";

export interface PrivacyPlicyData {
  privacytitle: string;
  privacySlug: string;
  privacyStatus: string;
  privacyVisiblity: string;
  privacyContent: any;
}
export interface PrivacyPolicyFormProps {
  onSubmit: (data: PrivacyPolicyRecord) => void;
  onClose: () => void;
  initialData?: PrivacyPolicyRecord | null; 
}
export const PrivacyPolicyForm = ({
  onClose,
  onSubmit,
  initialData = null,
}: PrivacyPolicyFormProps) => {
  const [privacytitle, setPrivacytitle] = useState("");
  const [privacySlug, setPrivacySlug] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState< "published" | "unPublished">("published");
  const [privacyVisiblity, setPrivacyVisibilty] = useState< "public" | "admin">("public");
  const [privacyDate, setPrivacyDate] = useState(new Date().toISOString().split("T")[0]);
  const [privacyContent, setPrivacyContent] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setPrivacytitle(initialData.privacytitle);
      setPrivacySlug(initialData.privacySlug);
      setPrivacyStatus(initialData.privacyStatus as "published" | "unPublished");
      setPrivacyVisibilty(initialData.privacyVisiblity as "public" | "admin");
      setPrivacyDate(initialData.privacyDate);
      setPrivacyContent(initialData.privacyContent);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !privacytitle.trim() ||
      !privacySlug.trim() ||
      !privacyStatus ||
      !privacyVisiblity ||
      // !privacyDate ||
      !privacyContent.trim()
    ){
  console.log({
    privacytitle,
    privacySlug,
    privacyStatus,
    privacyVisiblity,
    privacyContent,
  });

  alert("Validation Failed");
      return;
    }
    const payload = {
      privacytitle,
      privacySlug,
      privacyStatus,
      privacyVisiblity,
      privacyDate,
      privacyContent,
    };

    try {
      setIsSubmitting(true);
      setError(null);

      // Agar initialData hai matlab pehle se record maujood hai -> PATCH (slug se), warna POST
      const saved = initialData
        ? await updatePrivacyPolicy(initialData.privacySlug, payload)
        : await createPrivacyPolicy(payload);

      onSubmit(saved); // parent ko backend se aaya hua saved record milega (_id, timestamps sahit)
      onClose();
    } catch (err) {
      console.error(err);
      setError("collect some eeror");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-9">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex justify-center items-center pb-2">
          <h2 className="text-2xl font-bold text-gray-800">Privacy & Policy</h2>

          <button
            type="button"
            onClick={onClose}
            className="absolute text-xl top-3 right-3"
          >
            ✕
          </button>
        </div>
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={privacytitle}
            onChange={(e) => setPrivacytitle(e.target.value)}
            placeholder="Enter title"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring focus:ring-slate-400"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Slug
          </label>
          <input
            type="text"
            value={privacySlug}
            onChange={(e) => setPrivacySlug(e.target.value)}
            placeholder="enterSlug"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring focus:ring-slate-400"
            required
          />
        </div>
        <div>
          <DateControlled value={privacyDate} onChange={setPrivacyDate} />
        </div>
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Status
          </label>
          <select
            value={privacyStatus}
            onChange={(e) => setPrivacyStatus(e.target.value as "published" | "unPublished")}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring focus:ring-slate-400"
            required
          >
            <option value="published">Published</option>
            <option value="unPublished">UnPublished</option>
          </select>
        </div>
        <div>
          <label>Visibility</label>
          <select
            value={privacyVisiblity}
            onChange={(e) => setPrivacyVisibilty(e.target.value as "public" | "admin")}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring focus:ring-slate-400"
            required
          >
            <option value="public">Public</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <TipTapRichTextEditor value={privacyContent} onChange={setPrivacyContent} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : initialData ? "Update" : "+Add"}
          </button>
        </div>
      </form>
    </div>
  );
};