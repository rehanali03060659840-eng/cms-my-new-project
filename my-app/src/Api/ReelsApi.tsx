 import axios from "axios";

export const reelsApi = axios.create({
  baseURL: "http://localhost:3000/reels",
});



reelsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});