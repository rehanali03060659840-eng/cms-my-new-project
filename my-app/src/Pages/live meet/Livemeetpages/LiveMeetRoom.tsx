import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Ban,
  Camera,
  CameraOff,
  Copy,
  Lock,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  PhoneOff,
  Shield,
  Unlock,
  UserMinus,
  UserPlus, 
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useLiveMeetSocket } from "../../../context/LiveMeetSocketContext";
import { useMeshCall } from "../Hooks/useMeshCall";
import { VideoTile } from "../components/VideoTile";
import { ChatPanel } from "../components/ChatPanel";
import type {
  JoinRequest,
  LiveMeeting,
  RoomParticipant,
} from "../../../types/liveMeet";

// Picks a grid layout to match how many tiles are on screen right now:
// 1 -> single full tile, 2 -> side-by-side halves, 3/4 -> 2x2, and it keeps
// opening up columns/rows as more people join so nobody is left tiny/cramped.
const gridClassFor = (count: number) => {
  if (count <= 1) return "grid-cols-1 grid-rows-1";
  if (count === 2) return "grid-cols-2 grid-rows-1";
  if (count <= 4) return "grid-cols-2 grid-rows-2";
  if (count <= 6) return "grid-cols-3 grid-rows-2";
  if (count <= 9) return "grid-cols-3 grid-rows-3";
  return "grid-cols-4 grid-rows-4";
};

export const LiveMeetRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { socket } = useLiveMeetSocket();
  const { user } = useAuth() as any;
  const myId = String(
    user?.id ?? user?._id ?? user?.userId ?? user?.email ?? "",
  );
  const [meeting, setMeeting] = useState<LiveMeeting | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [volume, setVolume] = useState(1);
  const [ended, setEnded] = useState(false);
  const [tab, setTab] = useState<"chat" | "people">("chat");
  const [muteMenuFor, setMuteMenuFor] = useState<string | null>(null);
  const [removeMenuFor, setRemoveMenuFor] = useState<string | null>(null);
  const [presenterId, setPresenterId] = useState<string | null>(null);

  const {
    localStream,
    remoteStreams,
    micOn,
    cameraOn,
    micLocked,
    screenSharing,
    screenStream,
    permissionError,
    requestingMedia,
    requestMedia,
    connectToParticipant,
    disconnectParticipant,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    forceMuteSelf,
    forceUnmuteSelf,
    unlockMic,
    cleanupAll,
  } = useMeshCall(socket, meetingId ?? "", myId);

  const me = participants.find((p) => p.userId === myId);
  const isHost = me?.isHost || meeting?.hostId === myId;
  const isHostRef = useRef(isHost);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);
  const isPresenting = !!presenterId;

  useEffect(() => {
    if (!socket || !meetingId) return;
    socket.emit("meeting:join-room", { meetingId }, (r: any) => {
      if (r?.meeting) {
        setMeeting(r.meeting);
        setParticipants(r.participants ?? []);
      }
    });
    const onParts = (p: RoomParticipant[]) => setParticipants(p);
    const onStarted = (e: any) => {
      setMeeting(e.meeting);
      setParticipants(e.participants ?? []);
    };
    const onApproved = (e: any) => {
      setMeeting(e.meeting);
      setParticipants(e.participants ?? []);
    };
    const onReq = (r: JoinRequest) => {
      setRequests((p) =>
        p.some((x) => x.userId === r.userId) ? p : [...p, r],
      );
      if (isHostRef.current) toast(`${r.userName} wants to join`);
    };
    const onMuted = (e: any) => {
      const isPermanent = e.permanent === true || e.permanent === "true";
      if (e.userId === myId) {
        forceMuteSelf(isPermanent);
        toast(
          isPermanent
            ? "Host permanently muted your microphone"
            : "Host muted your microphone",
        );
      }
      setParticipants((p) =>
        p.map((x) =>
          x.userId === e.userId
            ? { ...x, muted: true, micLocked: isPermanent }
            : x,
        ),
      );
    };
    const onUnmuted = (e: any) => {
      if (e.userId === myId) {
        forceUnmuteSelf();

        toast.success("Host unmuted your microphone");
      }

      setParticipants((p) =>
        p.map((x) =>
          x.userId === e.userId
            ? {
                ...x,
                muted: false,
                micLocked: false,
              }
            : x,
        ),
      );
    };
    const onMuteAll = () => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.isHost) return p;

          return {
            ...p,
            muted: true,
          };
        }),
      );

      if (!isHostRef.current) {
        forceMuteSelf(false);
        toast("Host muted everyone");
      }
    };
    const onUnlocked = (e: any) => {
      if (e.userId === myId) {
        unlockMic();
        toast("Host allowed you to unmute yourself");
      }
      setParticipants((p) =>
        p.map((x) => (x.userId === e.userId ? { ...x, micLocked: false } : x)),
      );
    };
    const onScreenShare = (e: { userId: string; sharing: boolean }) => {
      setPresenterId((prev) => {
        if (e.sharing) return e.userId;
        return prev === e.userId ? null : prev;
      });
    };
    const onRemoved = (e: any) => {
      if (e.meetingId === meetingId) {
        cleanupAll();
        toast.error(
          e.blocked
            ? "You were removed and blocked from this meeting"
            : "You were removed from the meeting",
        );
        navigate("/live-meet");
      }
    };
    const onEnded = () => {
      setEnded(true);
      cleanupAll();
      setTimeout(() => navigate("/live-meet"), 1500);
    };
    const onLeft = (e: any) => disconnectParticipant(e.userId);
    socket.on("meeting:participants", onParts);
    socket.on("meeting:started", onStarted);
    socket.on("meeting:approved", onApproved);
    socket.on("meeting:join-request", onReq);
    socket.on("meeting:participant-muted", onMuted);
    socket.on("meeting:muted-all", onMuteAll);
    socket.on("meeting:mic-unlocked", onUnlocked);
    socket.on("meeting:screen-share", onScreenShare);
    socket.on("meeting:removed", onRemoved);
    socket.on("meeting:ended", onEnded);
    socket.on("meeting:participant-left", onLeft);
    socket.on("meeting:participant-unmuted", onUnmuted);
    return () => {
      socket.off("meeting:participants", onParts);
      socket.off("meeting:started", onStarted);
      socket.off("meeting:approved", onApproved);
      socket.off("meeting:join-request", onReq);
      socket.off("meeting:participant-muted", onMuted);
      socket.off("meeting:muted-all", onMuteAll);
      socket.off("meeting:mic-unlocked", onUnlocked);
      socket.off("meeting:screen-share", onScreenShare);
      socket.off("meeting:removed", onRemoved);
      socket.off("meeting:ended", onEnded);
      socket.off("meeting:participant-left", onLeft);
      socket.off("meeting:participant-unmuted", onUnmuted);
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, meetingId]);

  // Reflect our own screen-share state as the presenter too, in case the
  // server doesn't echo "meeting:screen-share" back to the sender.
  useEffect(() => {
    setPresenterId((prev) => {
      if (screenSharing) return myId;
      return prev === myId ? null : prev;
    });
  }, [screenSharing, myId]);

  useEffect(() => {
    participants.forEach((p) => {
      if (p.userId !== myId && myId < p.userId) connectToParticipant(p.userId);
    });
  }, [participants, myId, connectToParticipant]);

  const allTiles = useMemo(
    () => [
      {
        id: myId,
        name: user?.name || "You",
        stream: localStream,
        isHost: !!isHost,
        muted: !micOn,
        cameraOff: !cameraOn,
        micLocked,
        local: true,
      },
      ...participants
        .filter((p) => p.userId !== myId)
        .map((p) => ({
          id: p.userId,
          name: p.userName,
          stream: remoteStreams[p.userId] ?? null,
          isHost: p.isHost,
          muted: p.muted,
          cameraOff: p.cameraOff,
          micLocked: p.micLocked,
          local: false,
        })),
    ],
    [
      participants,
      remoteStreams,
      localStream,
      micOn,
      cameraOn,
      micLocked,
      myId,
      isHost,
      user,
    ],
  );

  const presenterTile = presenterId
    ? allTiles.find((t) => t.id === presenterId)
    : null;
  const presenterStream =
    presenterId === myId
      ? (screenStream ?? localStream)
      : (presenterTile?.stream ?? null);
  const otherTiles = presenterId
    ? allTiles.filter((t) => t.id !== presenterId)
    : allTiles;

  const leave = () => {
    socket?.emit("meeting:leave", { meetingId });
    cleanupAll();
    navigate("/live-meet");
  };
  const end = () => {
    if (!isHost) return;
    socket?.emit("meeting:end", { meetingId }, () => {});
  };

  const muteTemporary = (id: string) => {
    socket?.emit("meeting:mute", { meetingId, userId: id, permanent: false });
    setMuteMenuFor(null);
  };
  const mutePermanent = (id: string) => {
    socket?.emit("meeting:mute", { meetingId, userId: id, permanent: true });
    setMuteMenuFor(null);
  };
  const unlockMicFor = (id: string) => {
    socket?.emit("meeting:unlock-mic", { meetingId, userId: id });
    setMuteMenuFor(null);
  };
  const unmuteParticipant = (id: string) => {
    socket?.emit(
      "meeting:unmute",
      { meetingId, userId: id },
      (response: any) => {
        if (!response?.ok) {
          toast.error(response?.message || "Unable to unmute participant");
        }
      },
    ); 

    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === id
          ? {
              ...p,
              muted: false,
              micLocked: false,
            }
          : p,
      ),
    );

    setMuteMenuFor(null);
  };
  const muteAll = () => {
    socket?.emit("meeting:mute-all", { meetingId });
    toast.success("Muted everyone");
  };

  // Kicked out, but they're free to send a new join request later.
  const remove = (id: string) => {
    socket?.emit("meeting:remove", { meetingId, userId: id, block: false });
    setParticipants((p) => p.filter((x) => x.userId !== id));
    setRemoveMenuFor(null);
  };
  // Kicked out AND can't send another join request for this meeting.
  const block = (id: string) => {
    socket?.emit("meeting:remove", { meetingId, userId: id, block: true });
    setParticipants((p) => p.filter((x) => x.userId !== id));
    setRemoveMenuFor(null);
  };
  // Reject a pending request and also block them from requesting again.
  const blockRequest = (r: JoinRequest) => {
    socket?.emit("meeting:reject-request", {
      meetingId,
      userId: r.userId,
      block: true,
    });
    setRequests((p) => p.filter((x) => x.userId !== r.userId));
  };

  const approve = (r: JoinRequest) => {
    socket?.emit("meeting:approve-request", { meetingId, userId: r.userId });
    setRequests((p) => p.filter((x) => x.userId !== r.userId));
    setParticipants((p) =>
      p.some((x) => x.userId === r.userId)
        ? p
        : [
            ...p,
            {
              userId: r.userId,
              userName: r.userName,
              isHost: false,
              muted: false,
              cameraOff: false,
            },
          ],
    );
  };
  const reject = (r: JoinRequest) => {
    socket?.emit("meeting:reject-request", { meetingId, userId: r.userId });
    setRequests((p) => p.filter((x) => x.userId !== r.userId));
  };

  if (ended)
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="text-4xl font-black">Meeting ended</div>
          <p className="mt-2 text-white/50">Returning to lobby...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#090b12] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d1019] px-5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-500 px-2 py-1 text-[9px] font-bold">
              LIVE
            </span>
            <h1 className="font-bold">{meeting?.title ?? "Live Meeting"}</h1>
          </div>
          <p className="text-[11px] text-white/40">
            Code: {meeting?.code} · Host: {meeting?.hostName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/live-meet?code=${meeting?.code}`,
              );
              toast.success("Invite link copied");
            }}
            className="rounded-lg border border-white/10 p-2 hover:bg-white/5"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={leave}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold"
          >
            <LogOut size={15} />
            Leave
          </button>
          {isHost && (
            <button
              onClick={end}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold"
            >
              <PhoneOff size={15} />
              End meeting
            </button>
          )}
        </div>
      </header>

      {permissionError && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-xs text-amber-200">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} /> {permissionError}
          </span>
          <button
            onClick={requestMedia}
            disabled={requestingMedia}
            className="rounded-lg bg-amber-500/20 px-3 py-1.5 font-semibold hover:bg-amber-500/30 disabled:opacity-60"
          >
            {requestingMedia ? "Requesting..." : "Enable camera & mic"}
          </button>
        </div>
      )}

      <div className="grid min-h-[calc(100vh-68px)] lg:grid-cols-[1fr_360px]">
        <main className="flex min-w-0 flex-col">
          <section className="flex flex-1 flex-col p-4">
            {presenterId && presenterTile ? (
              // --- presenter layout: big tile fills the area, everyone else
              // in a scrollable row underneath ---
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="relative min-h-0 flex-1">
                  <VideoTile
                    stream={presenterStream}
                    name={presenterTile.name}
                    isHost={presenterTile.isHost}
                    muted={presenterTile.muted}
                    cameraOff={false}
                    local={presenterTile.local}
                    volume={volume}
                    fill
                  />
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold">
                    <MonitorUp size={13} className="text-indigo-400" />
                    {presenterTile.local
                      ? "You are presenting"
                      : `${presenterTile.name} is presenting`}
                  </span>
                  {presenterTile.local && (
                    <button
                      onClick={toggleScreenShare}
                      className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-bold hover:bg-red-700"
                    >
                      <MonitorX size={13} /> Stop sharing
                    </button>
                  )}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {otherTiles.map((t) => (
                    <div key={t.id} className="aspect-video w-40 shrink-0">
                      <VideoTile
                        stream={t.stream}
                        name={t.name}
                        isHost={t.isHost}
                        muted={t.muted}
                        cameraOff={t.cameraOff}
                        micLocked={t.micLocked}
                        local={t.local}
                        volume={volume}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // --- normal layout: grid shape adapts to how many people are
              // on the call (1 = full screen, 2 = half/half, 4 = 2x2, ...) ---
              <div
                className={`grid h-full min-h-0 flex-1 gap-3 ${gridClassFor(allTiles.length)}`}
              >
                {allTiles.map((t) => (
                  <div key={t.id} className="relative min-h-0">
                    <VideoTile
                      stream={t.stream}
                      name={t.name}
                      isHost={t.isHost}
                      muted={t.muted}
                      cameraOff={t.cameraOff}
                      micLocked={t.micLocked}
                      local={t.local}
                      volume={volume}
                      fill
                    />
                    {isHost && !t.isHost && (
                      <div className="absolute right-2 top-2 flex gap-1">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMuteMenuFor((v) => (v === t.id ? null : t.id))
                            }
                            title="Mute options"
                            className="rounded-lg bg-black/60 p-2"
                          >
                            <MicOff size={14} />
                          </button>
                          {muteMenuFor === t.id && (
                            <div className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-lg border border-white/10 bg-[#151824] shadow-xl">
                              {t.muted ? (
                                <>
                                  {t.micLocked && (
                                    <button
                                      onClick={() => unlockMicFor(t.id)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-white/10"
                                    >
                                      <Unlock size={12} />
                                      Unlock microphone
                                    </button>
                                  )}

                                  <button
                                    onClick={() => unmuteParticipant(t.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-emerald-300 hover:bg-white/10"
                                  >
                                    <Mic size={12} />
                                    Allow unmute
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => muteTemporary(t.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-white/10"
                                  >
                                    <MicOff size={12} />
                                    Mute
                                  </button>

                                  <button
                                    onClick={() => mutePermanent(t.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-white/10"
                                  >
                                    <Lock size={12} />
                                    Mute & lock
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setRemoveMenuFor((v) =>
                                v === t.id ? null : t.id,
                              )
                            }
                            title="Remove options"
                            className="rounded-lg bg-red-600/80 p-2"
                          >
                            <UserMinus size={14} />
                          </button>
                          {removeMenuFor === t.id && (
                            <div className="absolute right-0 top-9 z-10 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#151824] shadow-xl">
                              <button
                                onClick={() => remove(t.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-white/10"
                              >
                                <UserMinus size={12} /> Remove (can rejoin)
                              </button>
                              <button
                                onClick={() => block(t.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-red-300 hover:bg-white/10"
                              >
                                <Ban size={12} /> Block (can't rejoin)
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <div className="border-t border-white/10 bg-[#0d1019] p-4">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
              <button
                onClick={toggleMic}
                disabled={micLocked}
                title={micLocked ? "Host has locked your mic" : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-3 text-xs font-bold ${
                  micLocked
                    ? "cursor-not-allowed bg-white/5 opacity-50"
                    : micOn
                      ? "bg-white/10 hover:bg-white/20"
                      : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {micLocked ? (
                  <>
                    <Lock size={19} /> Locked
                  </>
                ) : micOn ? (
                  <>
                    <Mic size={19} /> Mute
                  </>
                ) : (
                  <>
                    <MicOff size={19} /> Unmute
                  </>
                )}
              </button>
              <button
                onClick={toggleCamera}
                className={`rounded-full p-3 ${cameraOn ? "bg-white/10" : "bg-red-600"}`}
              >
                {cameraOn ? <Camera size={19} /> : <CameraOff size={19} />}
              </button>
              <button
                onClick={toggleScreenShare}
                title={screenSharing ? "Stop sharing" : "Share your screen"}
                className={`rounded-full p-3 ${screenSharing ? "bg-red-600" : "bg-white/10"}`}
              >
                {screenSharing ? (
                  <MonitorX size={19} />
                ) : (
                  <MonitorUp size={19} />
                )}
              </button>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <VolumeX size={15} />
                <input
                  aria-label="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-24"
                />
                <Volume2 size={15} />
              </div>
              {isHost && (
                <button
                  onClick={muteAll}
                  title="Mute everyone (except you)"
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2.5 text-[11px] font-semibold hover:bg-white/20"
                >
                  <MicOff size={15} /> Mute all
                </button>
              )}
              <span className="rounded-full bg-white/5 px-3 py-2 text-[10px] text-white/50">
                {participants.length} participants
              </span>
            </div>
          </div>

          {/* While someone is screen-sharing, chat moves down here under the
              meeting instead of living in the right sidebar. As soon as
              sharing stops this block disappears and chat goes back to its
              normal spot on the right. */}
          {isPresenting && (
            <div className="border-t border-white/10 bg-[#10131d] p-3">
              <div className="mx-auto h-72 max-w-3xl">
                <ChatPanel
                  socket={socket}
                  meetingId={meetingId ?? ""}
                  scope="room"
                  myUserId={myId}
                  title="Live Chat & Q&A"
                />
              </div>
            </div>
          )}
        </main>

        <aside className="flex min-h-[500px] flex-col border-l border-white/10 bg-[#10131d]">
          {!isPresenting && (
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setTab("chat")}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold ${
                  tab === "chat" ? "bg-white/5 text-white" : "text-white/40"
                }`}
              >
                <MessageSquare size={14} /> Chat
              </button>
              <button
                onClick={() => setTab("people")}
                className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold ${
                  tab === "people" ? "bg-white/5 text-white" : "text-white/40"
                }`}
              >
                <Users size={14} /> People
                {requests.length > 0 && (
                  <span className="absolute right-4 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold">
                    {requests.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Chat panel here is only shown when nobody is presenting - once
              screen-share starts it's rendered under the video instead (see
              above), so we never mount two ChatPanel instances at once. */}
          {!isPresenting && tab === "chat" ? (
            <div className="flex-1 overflow-hidden p-3">
              <ChatPanel
                socket={socket}
                meetingId={meetingId ?? ""}
                scope="room"
                myUserId={myId}
                title="Live Chat & Q&A"
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3">
              {isHost && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/70">
                    <span className="flex items-center gap-2">
                      <UserPlus size={14} className="text-indigo-400" /> Join
                      Requests
                    </span>
                  </div>
                  {requests.length ? (
                    <div className="space-y-2">
                      {requests.map((r) => (
                        <div
                          key={r.userId}
                          className="rounded-lg bg-white/5 p-2.5"
                        >
                          <p className="text-xs font-semibold">{r.userName}</p>
                          <div className="mt-2 flex gap-1">
                            <button
                              onClick={() => approve(r)}
                              className="flex-1 rounded bg-emerald-600 py-1.5 text-[10px] font-bold"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => reject(r)}
                              className="flex-1 rounded bg-white/10 py-1.5 text-[10px]"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => blockRequest(r)}
                              title="Reject and block from requesting again"
                              className="rounded bg-red-600/30 px-2 py-1.5 text-[10px] text-red-300"
                            >
                              <Ban size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-white/5 p-3 text-center text-[11px] text-white/40">
                      No pending requests.
                    </p>
                  )}
                </div>
              )}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/70">
                  <span className="flex items-center gap-2">
                    <Shield size={14} className="text-indigo-400" />{" "}
                    Participants ({participants.length})
                  </span>
                  {isHost && (
                    <button
                      onClick={muteAll}
                      className="text-[10px] font-semibold text-indigo-300 hover:underline"
                    >
                      Mute all
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {participants.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-semibold">{p.userName}</span>
                        {p.isHost && (
                          <span className="ml-2 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] text-indigo-300">
                            HOST
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-white/40">
                        {p.muted && p.micLocked ? (
                          isHost ? (
                            <button
                              onClick={() => unlockMicFor(p.userId)}
                              className="flex items-center gap-1 text-[10px] text-amber-300 hover:underline"
                            >
                              <Lock size={11} /> Locked · Unlock
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-amber-300">
                              <Lock size={11} /> Locked
                            </span>
                          )
                        ) : p.muted ? (
                          "Muted"
                        ) : (
                          ""
                        )}
                        {isHost && !p.isHost && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setRemoveMenuFor((v) =>
                                  v === p.userId ? null : p.userId,
                                )
                              }
                              className="rounded p-1 hover:bg-white/10"
                            >
                              <UserMinus size={13} />
                            </button>
                            {removeMenuFor === p.userId && (
                              <div className="absolute right-0 top-7 z-10 w-44 overflow-hidden rounded-lg border border-white/10 bg-[#151824] text-left shadow-xl">
                                <button
                                  onClick={() => remove(p.userId)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-[11px] hover:bg-white/10"
                                >
                                  <UserMinus size={12} /> Remove
                                </button>
                                <button
                                  onClick={() => block(p.userId)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-red-300 hover:bg-white/10"
                                >
                                  <Ban size={12} /> Block
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};