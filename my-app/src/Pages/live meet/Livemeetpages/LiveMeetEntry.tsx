import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLiveMeetSocket } from "../../../context/LiveMeetSocketContext";
import { LiveMeetLobby } from "./LiveMeetLobby";

export const LiveMeetEntry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useLiveMeetSocket();
  useEffect(() => {
    const code = new URLSearchParams(location.search).get("code");
    if (!code || !socket) return;
    socket.emit("meeting:find-by-code", { code }, (r: any) => {
      if (r?.meeting)
        navigate(`/live-meet?join=${r.meeting.code}`, { replace: true });
    });
  }, [location.search, socket, navigate]);
  return <LiveMeetLobby />;
};
