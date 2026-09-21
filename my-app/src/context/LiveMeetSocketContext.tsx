import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SOCKET_URL = `${import.meta.env.VITE_API_URL ?? ""}/live-meet`;
interface LiveMeetSocketCtx {
  socket: Socket | null;
  connected: boolean;
}
const Ctx = createContext<LiveMeetSocketCtx>({
  socket: null,
  connected: false,
});

export const LiveMeetSocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { token } = useAuth() as any;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      withCredentials: true,
      secure: true,
      rejectUnauthorized: false,
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) =>
      console.error("LiveMeet socket connection error:", err),
    );
    socket.on("live-meet:error", (e) => console.error(e));
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);
  return (
    <Ctx.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </Ctx.Provider>
  );
};
export const useLiveMeetSocket = () => useContext(Ctx);
