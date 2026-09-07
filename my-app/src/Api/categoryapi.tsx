import axios from "axios";

export const categoryApi = axios.create({
  baseURL: "http://localhost:3000/category",
});
categoryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // AuthContext jis key se save karta hai wahi use karo
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// har request ke sath token bhejna

categoryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
