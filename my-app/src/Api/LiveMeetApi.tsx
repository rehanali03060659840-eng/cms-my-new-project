import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const client = () =>
  axios.create({
    baseURL: `${API_URL}/live-meet`,
    headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
  });

export const liveMeetApi = {
  getHistory: () =>
    client()
      .get("/history")
      .then((r) => r.data),
  getAttendance: (meetingId: string) =>
    client()
      .get(`/history/${meetingId}/attendance`)
      .then((r) => r.data),
  getLobbyChat: () =>
    client()
      .get("/lobby-chat")
      .then((r) => r.data),
  getByCode: (code: string) =>
    client()
      .get(`/by-code/${code}`)
      .then((r) => r.data),
};
