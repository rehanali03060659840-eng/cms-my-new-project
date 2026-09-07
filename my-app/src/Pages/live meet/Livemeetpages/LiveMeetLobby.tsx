import { useEffect, useRef, useState } from "react";
import { History, Search, ShieldCheck, Video, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useLiveMeetSocket } from "../../../context/LiveMeetSocketContext";
import { MeetingHistoryPanel } from "../components/MeetingHistoryPanel";
import type { LiveMeeting } from "../../../types/liveMeet";
import { useNavigate, useLocation } from "react-router-dom";

const extractCode = (raw: string) => {
  const v = raw.trim();
  if (!v) return "";
  if (v.includes("://") || v.startsWith("www.")) {
    try {
      const url = new URL(v.includes("://") ? v : `https://${v}`);
      const fromQuery =
        url.searchParams.get("code") || url.searchParams.get("join");
      if (fromQuery) return fromQuery.toUpperCase();
    } catch {

    }
  }
  return v.toUpperCase();
};

const PENDING_KEY = "liveMeetPendingJoin";

export const LiveMeetLobby = () => {
  const { socket, connected } = useLiveMeetSocket();
  const location = useLocation();
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const myId = String(
    user?.id ?? user?._id ?? user?.userId ?? user?.email ?? "",
  );

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [found, setFound] = useState<LiveMeeting | null>(null);
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const autoRequested = useRef(false);

  useEffect(() => {
    if (!socket) return;
    const approved = (e: any) => {
      sessionStorage.removeItem(PENDING_KEY);
      navigate(`/live-meet/room/${e.meeting._id}`);
    };
    const rejected = () => {
      sessionStorage.removeItem(PENDING_KEY);
      setWaiting(false);
      toast.error("Your request was rejected");
    };
    const started = (e: any) => {
      if (e.meeting.hostId === myId) navigate(`/live-meet/room/${e.meeting._id}`);
    };
    socket.on("meeting:approved", approved);
    socket.on("meeting:rejected", rejected);
    socket.on("meeting:started", started);
    return () => {
      socket.off("meeting:approved", approved);
      socket.off("meeting:rejected", rejected);
      socket.off("meeting:started", started);
    };
  }, [socket, navigate, myId]);

  const create = () => {
    if (!socket || !title.trim()) return toast.error("Enter meeting title");
    setCreating(true);
    socket.emit(
      "meeting:create",
      { title, requireApproval: true, maxParticipants: 12 },
      (r: any) => {
        if (!r?.meeting) {
          setCreating(false);
          return toast.error("Could not create meeting");
        }
        socket.emit("meeting:start", { meetingId: r.meeting._id }, () => {
          setCreating(false);
          navigate(`/live-meet/room/${r.meeting._id}`);
        });
      },
    );
  };

  const find = () => {
    if (!socket || !code.trim() || searching) return;
    setSearching(true);
    socket.emit("meeting:find-by-code", { code }, (r: any) => {
      setSearching(false);
      setFound(r.meeting);
      if (!r.meeting) toast.error("Meeting not found", { id: "meeting-not-found" });
    });
  };

  useEffect(() => {
    const joinCode = new URLSearchParams(location.search).get("join");
    if (!socket || !joinCode || autoRequested.current) return;
    socket.emit("meeting:find-by-code", { code: joinCode }, (r: any) => {
      if (r?.meeting) {
        setFound(r.meeting);
        setCode(joinCode);
        autoRequested.current = true;
      } else toast.error("Meeting not found", { id: "meeting-not-found" });
    });
  }, [socket, location.search]);

  useEffect(() => {
    if (
      !socket ||
      !found ||
      !new URLSearchParams(location.search).get("join") ||
      !autoRequested.current ||
      waiting
    )
      return;
    socket.emit("meeting:request-join", { meetingId: found._id });
    setWaiting(true);
  }, [socket, found, location.search, waiting]);

  const request = () => {
    if (!socket || !found) return;
    socket.emit("meeting:request-join", { meetingId: found._id });
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ meetingId: found._id, code: found.code }),
    );
    setWaiting(true);
    toast.success("Join request sent");
  };

  // Lets a guest back out of the waiting screen instead of being stuck there
  // with no way back when they landed via a direct "?join=" link in a new tab.
  const cancelWaiting = () => {
    sessionStorage.removeItem(PENDING_KEY);
    setWaiting(false);
    setFound(null);
    setCode("");
    autoRequested.current = false;
    navigate("/live-meet", { replace: true });
  };

  // Survives a refresh while waiting: if the tab is reloaded on the waiting
  // screen, re-show it instead of dumping the guest back on a blank lobby.
  useEffect(() => {
    if (waiting || found || !socket) return;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      socket.emit("meeting:find-by-code", { code: pending.code }, (r: any) => {
        if (r?.meeting) {
          setFound(r.meeting);
          setCode(pending.code);
          setWaiting(true);
        } else {
          sessionStorage.removeItem(PENDING_KEY);
        }
      });
    } catch {
      sessionStorage.removeItem(PENDING_KEY);
    }
  }, [socket]);

  useEffect(() => {
    if (!waiting || !socket || !found) return;
    const interval = setInterval(() => {
      socket.emit("meeting:join-room", { meetingId: found._id }, (r: any) => {
        if (r?.meeting) {
          sessionStorage.removeItem(PENDING_KEY);
          navigate(`/live-meet/room/${found._id}`);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [waiting, socket, found, navigate]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-5 lg:p-7">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Live Meet
            </p>
            <h1 className="text-2xl font-black text-zinc-900">
              Lobby & Meeting Control
            </h1>
            <p className="text-sm text-zinc-500">
              Create a room or join with a code — you'll be taken straight
              into the call.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "super_admin" && (
              <button
                onClick={() => setHistoryOpen(true)}
                title="Meeting history"
                className="rounded-full border bg-white p-2.5 text-zinc-600 shadow-sm hover:bg-zinc-50"
              >
                <History size={18} />
              </button>
            )}
            <div
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
            >
              {connected ? "Socket connected" : "Socket disconnected"}
            </div>
          </div>
        </div>

        {!waiting && (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl bg-gradient-to-br from-[#111936] to-[#27348b] p-6 text-white shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <Video />
                </div>
                <div>
                  <h2 className="font-bold">Start a new meeting</h2>
                  <p className="text-xs text-white/60">
                    You'll be taken straight into the live room.
                  </p>
                </div>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting title"
                className="mb-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/40"
              />
              <button
                onClick={create}
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
              >
                <Video size={17} />
                {creating ? "Starting..." : "Create meeting"}
              </button>
            </section>
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <Search />
                </div>
                <div>
                  <h2 className="font-bold">Join with code</h2>
                  <p className="text-xs text-zinc-500">
                    Paste a code or an invite link — either works.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(extractCode(e.target.value))}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    e.preventDefault();
                    setCode(extractCode(pasted));
                  }}
                  placeholder="ABC123 or paste invite link"
                  className="min-w-0 flex-1 rounded-xl border px-4 py-3 font-mono text-sm outline-none focus:border-indigo-500"
                />
                <button
                  onClick={find}
                  disabled={searching}
                  className="rounded-xl bg-zinc-900 px-4 text-white disabled:opacity-60"
                >
                  <Search size={18} />
                </button>
              </div>
              {found && (
                <div className="mt-4 rounded-2xl border bg-zinc-50 p-4">
                  <p className="font-semibold">{found.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Host: {found.hostName} · {found.status}
                  </p>
                  <button
                    disabled={waiting}
                    onClick={request}
                    className="mt-3 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
                  >
                    {waiting ? "Waiting for approval" : "Request to join"}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {waiting && (
          <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <ShieldCheck />
            </div>
            <h2 className="text-xl font-bold">Waiting for host approval</h2>
            <p className="mt-2 text-sm text-zinc-500">
              You'll be dropped straight into the call once the host accepts.
            </p>
            {found && (
              <p className="mt-4 font-mono text-sm text-zinc-400">
                {found.code}
              </p>
            )}
            <button
              onClick={cancelWaiting}
              className="mx-auto mt-6 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <X size={15} /> Cancel & go back
            </button>
          </div>
        )}
      </div>

      <MeetingHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
};