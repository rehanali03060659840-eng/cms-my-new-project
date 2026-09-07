import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiX, FiUpload } from "react-icons/fi";
import type { User, UserRole } from "../types/auth";

const assignableRoles: UserRole[] = ["admin", "moderator", "user"];

type AddUserModalProps = {
  isOpen: boolean;
  token: string | null;
  onClose: () => void;
  onCreated: (newUser: User) => void;
};

export const AddUserModal = ({
  isOpen,
  token,
  onClose,
  onCreated,
}: AddUserModalProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setImage(null);
    setImagePreview(null);
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("user");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageChange = (file: File | null) => {
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    if (!name || !username || !email || !password || !role) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      if (image) formData.append("image", image);

      const res = await axios.post<User>(
        "http://localhost:3000/users",
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("User created successfully");
      onCreated(res.data);
      handleClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to create user");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Add Person</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* IMAGE UPLOAD */}
          <div className="flex items-center gap-4">
            <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition hover:border-indigo-400 hover:text-indigo-500">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FiUpload className="text-lg" />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) =>
                  handleImageChange(e.target.files?.[0] || null)
                }
              />
            </label>
            <div className="text-xs text-zinc-500">
              <p className="font-medium text-zinc-700">Profile photo</p>
              <p>PNG, JPG or WEBP</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">
                Name
              </label>
              <input
                className="h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Rehan Ali"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">
                Username
              </label>
              <input
                className="h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="rehanali"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600">
                Email
              </label>
              <input
                type="email"
                className="h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="user@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">
                Password
              </label>
              <input
                type="password"
                className="h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">
                Role
              </label>
              <select
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm capitalize outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {assignableRoles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
};