import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type RemoteStreams = Record<string, MediaStream>;

interface PeerConnectionState {
  pc: RTCPeerConnection;
  offerInFlight: boolean;
  negotiationNeeded: boolean;
}

export function useMeshCall(
  socket: Socket | null,
  meetingId: string,
  myUserId: string,
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreams>({});
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [micLocked, setMicLocked] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requestingMedia, setRequestingMedia] = useState(false);

  const peers = useRef<Map<string, PeerConnectionState>>(new Map());
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const isCleaningUp = useRef(false);

  const requestMedia = useCallback(async () => {
    setRequestingMedia(true);
    setPermissionError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (!isCleaningUp.current) {
        setLocalStream(s);
        setMicOn(true);
        setCameraOn(true);
        cacheLocalTracks(s);
      } else {
        s.getTracks().forEach((t) => t.stop());
      }
    } catch (e: any) {
      if (!isCleaningUp.current) {
        setLocalStream(null);
        setPermissionError(
          e?.name === "NotAllowedError"
            ? "Camera & microphone access was blocked. Allow access from your browser's site settings and try again."
            : "Couldn't access camera or microphone.",
        );
      }
    } finally {
      if (!isCleaningUp.current) setRequestingMedia(false);
    }
  }, []);

  const cacheLocalTracks = useCallback((stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0] ?? null;
    const audioTrack = stream.getAudioTracks()[0] ?? null;
    localVideoTrackRef.current = videoTrack;
    localAudioTrackRef.current = audioTrack;
  }, []);

  useEffect(() => {
    isCleaningUp.current = false;
    let alive = true;
    (async () => {
      setRequestingMedia(true);
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (alive && !isCleaningUp.current) {
          setLocalStream(s);
          setPermissionError(null);
          cacheLocalTracks(s);
        } else {
          s.getTracks().forEach((t) => t.stop());
        }
      } catch (e: any) {
        if (alive && !isCleaningUp.current) {
          setPermissionError(
            e?.name === "NotAllowedError"
              ? "Camera & microphone access was blocked. Allow access from your browser's site settings and try again."
              : "Couldn't access camera or microphone.",
          );
        }
      } finally {
        if (alive && !isCleaningUp.current) setRequestingMedia(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cacheLocalTracks]);

  useEffect(() => {
    if (!localStream) return;
    peers.current.forEach(({ pc }) => {
      const existingTrackIds = new Set(
        pc.getSenders().map((s) => s.track?.id).filter(Boolean),
      );
      localStream.getTracks().forEach((track) => {
        if (!existingTrackIds.has(track.id)) {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  const safeSetLocalDescription = useCallback(
    async (pc: RTCPeerConnection, description: RTCSessionDescriptionInit) => {
      if (pc.signalingState === "closed") return false;
      try {
        await pc.setLocalDescription(description);
        return true;
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === "InvalidAccessError" ||
            err.name === "InvalidStateError" ||
            err.name === "InvalidModificationError")
        ) {
          console.warn(
            "setLocalDescription failed safely (signalingState:",
            pc.signalingState,
            "):",
            err.message,
          );
          return false;
        }
        throw err;
      }
    },
    [],
  );

  const createPeer = useCallback(
    (targetUserId: string, isInitiator: boolean): RTCPeerConnection | null => {
      if (!socket || targetUserId === myUserId) return null;

      const existing = peers.current.get(targetUserId);
      if (existing) {
        existing.pc.close();
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const peerState: PeerConnectionState = {
        pc,
        offerInFlight: false,
        negotiationNeeded: false,
      };
      peers.current.set(targetUserId, peerState);

      if (localStream) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc:signal", {
            meetingId,
            toUserId: targetUserId,
            data: { candidate: e.candidate },
          });
        }
      };

      pc.ontrack = (e) => {
        if (e.streams[0]) {
          setRemoteStreams((prev) => ({ ...prev, [targetUserId]: e.streams[0] }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          pc.close();
          peers.current.delete(targetUserId);
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[targetUserId];
            return next;
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        const state = peers.current.get(targetUserId);
        if (!state) return;

        if (pc.signalingState !== "stable" || state.offerInFlight) {
          state.negotiationNeeded = true;
          return;
        }

        state.offerInFlight = true;
        state.negotiationNeeded = false;

        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          const success = await safeSetLocalDescription(pc, offer);
          if (success) {
            socket.emit("webrtc:signal", {
              meetingId,
              toUserId: targetUserId,
              data: { sdp: offer },
            });
          }
        } catch (err) {
          console.error("Negotiation error ignored safely:", err);
        } finally {
          const updatedState = peers.current.get(targetUserId);
          if (updatedState) {
            updatedState.offerInFlight = false;
            if (updatedState.negotiationNeeded && pc.signalingState === "stable") {
              updatedState.negotiationNeeded = false;
              pc.dispatchEvent(new Event("negotiationneeded"));
            }
          }
        }
      };

      if (isInitiator) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then(async (offer) => {
            if (pc.signalingState !== "stable") return;
            const success = await safeSetLocalDescription(pc, offer);
            if (success) {
              socket.emit("webrtc:signal", {
                meetingId,
                toUserId: targetUserId,
                data: { sdp: offer },
              });
            }
          })
          .catch((err) => {
            console.error("Initial offer creation failed:", err);
          });
      }

      return pc;
    },
    [socket, meetingId, myUserId, localStream, safeSetLocalDescription],
  );

  const connectToParticipant = useCallback(
    (userId: string) => {
      if (userId !== myUserId && !peers.current.has(userId)) {
        createPeer(userId, true);
      }
    },
    [createPeer, myUserId],
  );

  const disconnectParticipant = useCallback((userId: string) => {
    const state = peers.current.get(userId);
    if (state) {
      state.pc.close();
      peers.current.delete(userId);
    }
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onSignal = async ({
      fromUserId,
      toUserId,
      data,
    }: {
      fromUserId: string;
      toUserId: string;
      data: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
    }) => {
      if (toUserId !== myUserId || fromUserId === myUserId) return;

      let state = peers.current.get(fromUserId);
      if (!state) {
        const pc = createPeer(fromUserId, false);
        if (!pc) return;
        state = peers.current.get(fromUserId);
        if (!state) return;
      }

      const { pc } = state;

      try {
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === "offer") {
            state.offerInFlight = false;
            const answer = await pc.createAnswer();
            const success = await safeSetLocalDescription(pc, answer);
            if (success) {
              socket.emit("webrtc:signal", {
                meetingId,
                toUserId: fromUserId,
                data: { sdp: answer },
              });
            }
          } else if (data.sdp.type === "answer") {
            state.offerInFlight = false;
            if (state.negotiationNeeded && pc.signalingState === "stable") {
              state.negotiationNeeded = false;
              pc.dispatchEvent(new Event("negotiationneeded"));
            }
          }
        } else if (data.candidate && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn("ICE candidate add failed:", err);
          }
        }
      } catch (err) {
        console.warn("WebRTC signal error:", err);
      }
    };

    socket.on("webrtc:signal", onSignal);
    return () => {
      socket.off("webrtc:signal", onSignal);
    };
  }, [socket, myUserId, meetingId, createPeer, safeSetLocalDescription]);

  const toggleMic = useCallback(() => {
    if (micLocked) return;
    setMicOn((prev) => {
      const next = !prev;
      localStream?.getAudioTracks().forEach((t) => (t.enabled = next));
      socket?.emit("meeting:mic-state", { meetingId, muted: !next });
      return next;
    });
  }, [localStream, socket, meetingId, micLocked]);

  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => {
      const next = !prev;
      localStream?.getVideoTracks().forEach((t) => (t.enabled = next));
      socket?.emit("meeting:camera-state", { meetingId, cameraOff: !next });
      return next;
    });
  }, [localStream, socket, meetingId]);

  const forceMuteSelf = useCallback(
    (permanent?: boolean | string) => {
      localStream?.getAudioTracks().forEach((t) => (t.enabled = false));
      setMicOn(false);
      if (permanent === true || permanent === "true") {
        setMicLocked(true);
      }
    },
    [localStream],
  );

  const forceUnmuteSelf = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = true;
    });
    setMicLocked(false);
    setMicOn(true);
    socket?.emit("meeting:mic-state", { meetingId, muted: false });
  }, [localStream, socket, meetingId]);

  const unlockMic = useCallback(() => {
    setMicLocked(false);
  }, []);

  const replaceVideoTrackOnAllPeers = useCallback(
    (newTrack: MediaStreamTrack | null) => {
      peers.current.forEach(({ pc }) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(newTrack).catch((err) => {
            console.warn("replaceTrack failed:", err);
          });
        } else if (newTrack && localStream) {
          pc.addTrack(newTrack, localStream);
        }
      });
    },
    [localStream],
  );

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      const camTrack = localVideoTrackRef.current;
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      replaceVideoTrackOnAllPeers(camTrack);
      setScreenStream(null);
      setScreenSharing(false);
      socket?.emit("meeting:screen-share", {
        meetingId,
        userId: myUserId,
        sharing: false,
      });
      return;
    }

    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const track = ss.getVideoTracks()[0];
      if (!track) throw new Error("No video track in display media");

      screenTrackRef.current = track;
      setScreenStream(ss);
      replaceVideoTrackOnAllPeers(track);

      const handleTrackEnded = () => {
        if (screenTrackRef.current !== track) return;

        const camTrack = localVideoTrackRef.current;
        replaceVideoTrackOnAllPeers(camTrack);
        setScreenStream(null);
        setScreenSharing(false);
        screenTrackRef.current = null;
        socket?.emit("meeting:screen-share", {
          meetingId,
          userId: myUserId,
          sharing: false,
        });
        track.removeEventListener("ended", handleTrackEnded);
      };

      track.addEventListener("ended", handleTrackEnded);

      setScreenSharing(true);
      socket?.emit("meeting:screen-share", {
        meetingId,
        userId: myUserId,
        sharing: true,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        console.log("Screen share cancelled by user");
      } else {
        console.error("Screen share error:", err);
      }
    }
  }, [
    screenSharing,
    localStream,
    socket,
    meetingId,
    myUserId,
    replaceVideoTrackOnAllPeers,
  ]);

  const cleanupAll = useCallback(() => {
    isCleaningUp.current = true;
    screenTrackRef.current?.stop();
    localStream?.getTracks().forEach((t) => t.stop());
    peers.current.forEach(({ pc }) => pc.close());
    peers.current.clear();
    localVideoTrackRef.current = null;
    localAudioTrackRef.current = null;
    screenTrackRef.current = null;
    setRemoteStreams({});
    setLocalStream(null);
    setScreenStream(null);
    setScreenSharing(false);
  }, [localStream]);

  return {
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
  };
}