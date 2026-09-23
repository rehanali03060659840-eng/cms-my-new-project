import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "https://abasthan.app";

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

export default client;