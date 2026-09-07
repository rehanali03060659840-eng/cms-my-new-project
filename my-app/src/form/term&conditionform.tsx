import { useEffect, useState } from "react";
import { MdPrivacyTip } from "react-icons/md";
import { DateControlled } from "./dateinput";
import { TipTapRichTextEditor } from "../tiptapeditor/tiptapEditorContent";
import {
  createTermsConditions,
  updateTermsConditions,
  type TermsConditionsRecord,
} from "../Api/termsconditionsApi";

export interface TermsConditions {
  termstitle: string;
  termsSlug: string;
  termsStatus: string;
  termsVisiblity: string;
  termsContent: any;
}

export interface TermsConditionsFormProps {
  onSubmit: (data: TermsConditionsRecord) => void;
  onClose: () => void;
  initialData: TermsConditionsRecord | null;
}
export const TermsConditionsForm = ({
  onClose,
  onSubmit,
  initialData = null,
}: TermsConditionsFormProps) => {
  const [termstitle, setTermstitle] = useState("");
  const [termsSlug, setTermsSlug] = useState("");
  const [termsStatus, setTermsStatus] = useState<"published" | "unpublished">(
    "published",
  );
  const [termsVisiblity, setTermsVisibilty] = useState<"public" | "admin">(
    "public",
  );
  const [termsDate, setTermsDate] = useState("");
  const [termsContent, setTermsContent] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTermstitle(initialData.termstitle);
      setTermsSlug(initialData.termsSlug);
      setTermsStatus(initialData.termsStatus as "published" | "unpublished");
      setTermsVisibilty(initialData.termsVisiblity as "public" | "admin");
      setTermsDate(initialData.termsDate);
      setTermsContent(initialData.termsContent);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !termstitle ||
      !termsSlug ||
      !termsStatus ||
      !termsVisiblity ||
      !termsDate ||
      !termsContent
    )
      return;

    const payload = {
      termstitle,
      termsSlug,
      termsStatus,
      termsVisiblity,
      termsDate,
      termsContent,
    };

    try {
      setIsSubmitting(true);
      setError(null);

      const saved = initialData
        ? await updateTermsConditions(initialData.termsSlug, payload)
        : await createTermsConditions(payload);

      onSubmit(saved);
      onClose();
    } catch (err) {
      console.error(err);
      setError("collect some error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-8">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Heading */}
        <div className="flex justify-center items-center pb-2">
          <div>
            <MdPrivacyTip className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Terms & Conditions
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute text-xl top-3 right-3"
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={termstitle}
            onChange={(e) => setTermstitle(e.target.value)}
            placeholder="Enter title"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring focus:ring-slate-400"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Slug
          </label>
          <input
            type="text"
            value={termsSlug}
            onChange={(e) => setTermsSlug(e.target.value)}
            placeholder="terms-and-conditions"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring focus:ring-slate-400"
            required
          />
        </div>
        <div>
          <DateControlled value={termsDate} onChange={setTermsDate} />
        </div>
        {/* Status & Visibility */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Status
            </label>

            <select
              value={termsStatus}
              onChange={(e) =>
                setTermsStatus(e.target.value as "published" | "unpublished")
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring focus:ring-slate-400"
              required
            >
              <option value="published">Published</option>
              <option value="unPublished">UnPublished</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Visibility
            </label>

            <select
              value={termsVisiblity}
              onChange={(e) =>
                setTermsVisibilty(e.target.value as "public" | "admin")
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring focus:ring-slate-400"
              required
            >
              <option value="public">Public</option>
              <option value="admin">Admin Only</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          <TipTapRichTextEditor
            value={termsContent}
            onChange={setTermsContent}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Buttons */}
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