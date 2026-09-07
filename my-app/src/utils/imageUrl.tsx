
const API_BASE_URL = "http://localhost:3000";


export const getImageUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}/uploads/${url.replace(/^\/?uploads\//, "")}`;
};