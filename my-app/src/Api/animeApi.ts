import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const animeApi = axios.create({
  baseURL: `${API_BASE}/anime`,
  headers: {
    "Content-Type": "application/json",
  },
});

animeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

animeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const seriesApi = {
  getAll: (params?: { search?: string; category?: string }) =>
    animeApi.get("/series", { params }),
  getById: (id: string) => animeApi.get(`/series/${id}`),
  create: (data: { title: string; description: string; coverImageUrl: string; categories: string[] }) =>
    animeApi.post("/series", data),
  update: (id: string, data: Partial<{ title: string; description: string; coverImageUrl: string; categories: string[] }>) =>
    animeApi.put(`/series/${id}`, data),
  delete: (id: string) => animeApi.delete(`/series/${id}`),
};

export const episodeApi = {
  getBySeries: (seriesId: string) => animeApi.get(`/episodes/series/${seriesId}`),
  getById: (id: string) => animeApi.get(`/episodes/${id}`),
  getBySeason: (seriesId: string, season: number) =>
    animeApi.get(`/episodes/series/${seriesId}/season/${season}`),
  create: (data: FormData) =>
    animeApi.post("/episodes", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: FormData) =>
    animeApi.put(`/episodes/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => animeApi.delete(`/episodes/${id}`),
  incrementViews: (id: string) => animeApi.post(`/episodes/${id}/views`),
};

export const watchHistoryApi = {
  get: () => animeApi.get("/watch-history"),
  create: (data: { episodeId: string; seriesId: string; progress: number }) =>
    animeApi.post("/watch-history", data),
  update: (id: string, data: { progress: number }) =>
    animeApi.put(`/watch-history/${id}`, data),
  delete: (id: string) => animeApi.delete(`/watch-history/${id}`),
};

export const favoriteApi = {
  get: () => animeApi.get("/favorites"),
  add: (seriesId: string) => animeApi.post("/favorites", { seriesId }),
  remove: (seriesId: string) => animeApi.delete(`/favorites/${seriesId}`),
  check: (seriesId: string) => animeApi.get(`/favorites/check/${seriesId}`),
};

export const playlistApi = {
  get: () => animeApi.get("/playlists"),
  getById: (id: string) => animeApi.get(`/playlists/${id}`),
  create: (data: { name: string; description?: string }) =>
    animeApi.post("/playlists", data),
  update: (id: string, data: { name?: string; description?: string }) =>
    animeApi.put(`/playlists/${id}`, data),
  delete: (id: string) => animeApi.delete(`/playlists/${id}`),
  addItem: (playlistId: string, seriesId: string) =>
    animeApi.post(`/playlists/${playlistId}/items`, { seriesId }),
  removeItem: (playlistId: string, seriesId: string) =>
    animeApi.delete(`/playlists/${playlistId}/items/${seriesId}`),
};

export const categoriesApi = {
  getAll: () => animeApi.get("/categories"),
};

export default animeApi;