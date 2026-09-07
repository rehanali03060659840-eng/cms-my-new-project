import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

export const blogApi = axios.create({
  baseURL: API_BASE_URL,
});

// har request ke sath token bhejna
blogApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single media upload
export const uploadMedia = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("media", file);

  const res = await blogApi.post("/api/upload/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.url;
};

// Multiple media upload
export const uploadMultipleMedia = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("media", file);
  });

  const res = await blogApi.post("/api/upload/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.files.map((f: any) => f.url);
};

// Create blog
export const createBlog = async (data: any) => {
  const res = await blogApi.post("/index", data);
  return res.data;
};

// Get all blogs
export const getAllBlogs = async () => {
  const res = await blogApi.get("/index");
  return res.data;
};

// Get single blog by slug
export const getBlogBySlug = async (slug: string) => {
  const res = await blogApi.get(`/index/${slug}`);
  return res.data;
};

// Update blog
export const updateBlog = async (slug: string, data: any) => {
  const res = await blogApi.put(`/index/${slug}`, data);
  return res.data;
};

// Delete blog
export const deleteBlog = async (slug: string) => {
  const res = await blogApi.delete(`/index/${slug}`);
  return res.data;
};