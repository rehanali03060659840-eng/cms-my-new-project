import client from "../api/client";

export const liveMeetApi = {
  getHistory: () =>
    client
      .get("/live-meet/history")
      .then((r) => r.data),
  getAttendance: (meetingId: string) =>
    client
      .get(`/live-meet/history/${meetingId}/attendance`)
      .then((r) => r.data),
  getLobbyChat: () =>
    client
      .get("/live-meet/lobby-chat")
      .then((r) => r.data),
  getByCode: (code: string) =>
    client
      .get(`/live-meet/by-code/${code}`)
      .then((r) => r.data),
};
