import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type RemoteStreams = Record<string, MediaStream>;

interface PeerConnectionState {
  pc: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  // === FIX: queue ICE candidates that arrive before remoteDescription
  pendingCandidates: RTCIceCandidateInit[];
}

interface SenderEntry {
  sender: RTCRtpSender;
  track: MediaStreamTrack;
}

export interface UseMeshCallResult {
  localStream: MediaStream | null;
  remoteStreams: RemoteStreams;
  micOn: boolean;
  cameraOn: boolean;
  micLocked: boolean;
  screenSharing: boolean;
  screenStream: MediaStream | null;
  permissionError: string | null;
  requestingMedia: boolean;
  requestMedia: () => Promise<void>;
  connectToParticipant: (userId: string) => void;
  disconnectParticipant: (userId: string) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  forceMuteSelf: (permanent?: boolean | string) => void;
  forceUnmuteSelf: () => void;
  unlockMic: () => void;
  cleanupAll: () => void;
}

export function useMeshCall(
  socket: Socket | null,
  meetingId: string,
  myUserId: string,
): UseMeshCallResult {
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
  const hasRequestedOnMount = useRef(false);
  const audioSenders = useRef<Map<string, SenderEntry>>(new Map());
  const videoSenders = useRef<Map<string, SenderEntry>>(new Map());

  // Keep latest toggle state accessible inside async media request
  const micOnRef = useRef(micOn);
  const cameraOnRef = useRef(cameraOn);
  useEffect(() => {
    micOnRef.current = micOn;
    cameraOnRef.current = cameraOn;
  }, [micOn, cameraOn]);

  const requestMedia = useCallback(async (): Promise<void> => {
    if (requestingMedia) return;
    setRequestingMedia(true);
    setPermissionError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError(
        "Camera/microphone access isn't available. Page must be HTTPS or localhost.",
      );
      setRequestingMedia(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "user",
        },
      });

      // === FIX: apply current UI state (refs) so toggles that happened
      // while the permission dialog was open are respected
      stream.getAudioTracks().forEach((t) => {
        localAudioTrackRef.current = t;
        t.enabled = micOnRef.current;
      });
      stream.getVideoTracks().forEach((t) => {
        localVideoTrackRef.current = t;
        t.enabled = cameraOnRef.current;
      });

      setLocalStream(stream);
      setPermissionError(null);
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionError(
            "Camera and microphone permissions were denied. Allow them in browser settings and click Enable again.",
          );
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setPermissionError("No camera or microphone detected on this device.");
        } else if (err.name === "NotReadableError" || err.name === "ConstraintNotSatisfiedError") {
          setPermissionError(
            "Camera or microphone is already in use by another app/tab. Close other apps and try again.",
          );
        } else {
          setPermissionError(`Media error: ${err.message}`);
        }
      } else {
        setPermissionError(`Media error: ${(err as Error).message}`);
      }
    } finally {
      setRequestingMedia(false);
    }
  }, [requestingMedia]);

  useEffect(() => {
    if (hasRequestedOnMount.current) return;
    hasRequestedOnMount.current = true;
    requestMedia();
  }, [requestMedia]);

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
          console.warn("setLocalDescription safe-fail:", pc.signalingState, err.message);
          return false;
        }
        throw err;
      }
    },
    [],
  );

  const createPeer = useCallback(
    (targetUserId: string, _isInitiator: boolean): RTCPeerConnection | null => {
      if (!socket || targetUserId === myUserId) return null;

      const existing = peers.current.get(targetUserId);
      if (existing) {
        existing.pc.close();
        peers.current.delete(targetUserId);
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const polite = myUserId > targetUserId;

      const peerState: PeerConnectionState = {
        pc,
        polite,
        makingOffer: false,
        ignoreOffer: false,
        pendingCandidates: [], // === FIX
      };
      peers.current.set(targetUserId, peerState);

      // Add existing local tracks immediately (if already available)
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          const sender = pc.addTrack(track, localStream);
          audioSenders.current.set(track.id, { sender, track });
        });
        localStream.getVideoTracks().forEach((track) => {
          const sender = pc.addTrack(track, localStream);
          videoSenders.current.set(track.id, { sender, track });
        });
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

      // === FIX: robust ontrack – never lose the stream
      pc.ontrack = (e) => {
        setRemoteStreams((prev) => {
          const existingStream = prev[targetUserId];
          if (existingStream) {
            const already = existingStream.getTracks().some((t) => t.id === e.track.id);
            if (!already) existingStream.addTrack(e.track);
            return { ...prev, [targetUserId]: existingStream };
          }
          const stream = e.streams[0] ?? new MediaStream([e.track]);
          return { ...prev, [targetUserId]: stream };
        });
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
        if (!state || state.makingOffer) return;
        try {
          state.makingOffer = true;
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          const success = await safeSetLocalDescription(pc, offer);
          if (success && pc.localDescription) {
            socket.emit("webrtc:signal", {
              meetingId,
              toUserId: targetUserId,
              data: { sdp: pc.localDescription },
            });
          }
        } catch (err) {
          console.error("Negotiation error:", err);
        } finally {
          state.makingOffer = false;
        }
      };

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

  // === FIX: flush pending ICE candidates after remoteDescription is set
  const flushPendingCandidates = useCallback(async (fromUserId: string) => {
    const state = peers.current.get(fromUserId);
    if (!state || !state.pc.remoteDescription) return;
    const candidates = [...state.pendingCandidates];
    state.pendingCandidates = [];
    for (const c of candidates) {
      try {
        await state.pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        if (!state.ignoreOffer) console.warn("Late ICE add failed:", err);
      }
    }
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

      const { pc, polite } = state;

      try {
        if (data.sdp) {
          const description = data.sdp;

          const offerCollision =
            description.type === "offer" &&
            (state.makingOffer || pc.signalingState !== "stable");

          state.ignoreOffer = !polite && offerCollision;
          if (state.ignoreOffer) return;

          if (offerCollision) {
            await Promise.all([
              pc.setLocalDescription({ type: "rollback" }),
              pc.setRemoteDescription(new RTCSessionDescription(description)),
            ]);
          } else {
            await pc.setRemoteDescription(new RTCSessionDescription(description));
          }

          // === FIX: flush any candidates that arrived early
          await flushPendingCandidates(fromUserId);

          if (description.type === "offer") {
            const answer = await pc.createAnswer();
            const success = await safeSetLocalDescription(pc, answer);
            if (success && pc.localDescription) {
              socket.emit("webrtc:signal", {
                meetingId,
                toUserId: fromUserId,
                data: { sdp: pc.localDescription },
              });
            }
          }
        } else if (data.candidate) {
          // === FIX: queue if remoteDescription not ready yet
          if (pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
              if (!state.ignoreOffer) console.warn("ICE candidate add failed:", err);
            }
          } else {
            state.pendingCandidates.push(data.candidate);
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
  }, [socket, myUserId, meetingId, createPeer, safeSetLocalDescription, flushPendingCandidates]);

  // === FIX: when localStream finally arrives, attach tracks to ALL existing peers
  // and force renegotiation so the other side actually receives media
  useEffect(() => {
    if (!localStream) return;

    peers.current.forEach(({ pc }) => {
      const existingAudio = pc.getSenders().filter((s) => s.track?.kind === "audio");
      const existingVideo = pc.getSenders().filter((s) => s.track?.kind === "video");

      localStream.getAudioTracks().forEach((track) => {
        if (!existingAudio.find((s) => s.track?.id === track.id)) {
          const sender = pc.addTrack(track, localStream);
          audioSenders.current.set(track.id, { sender, track });
        }
      });
      localStream.getVideoTracks().forEach((track) => {
        if (!existingVideo.find((s) => s.track?.id === track.id)) {
          const sender = pc.addTrack(track, localStream);
          videoSenders.current.set(track.id, { sender, track });
        }
      });
    });
  }, [localStream]);

  const toggleMic = useCallback(() => {
    if (micLocked) return;
    setMicOn((prev) => {
      const next = !prev;
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
      if (localAudioTrackRef.current) localAudioTrackRef.current.enabled = next;
      socket?.emit("meeting:mic-state", { meetingId, muted: !next });
      return next;
    });
  }, [micLocked, localStream, socket, meetingId]);

  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => {
      const next = !prev;
      localStream?.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
      if (localVideoTrackRef.current) localVideoTrackRef.current.enabled = next;
      socket?.emit("meeting:camera-state", { meetingId, cameraOff: !next });
      return next;
    });
  }, [localStream, socket, meetingId]);

  const forceMuteSelf = useCallback(
    (permanent?: boolean | string) => {
      localStream?.getAudioTracks().forEach((t) => (t.enabled = false));
      if (localAudioTrackRef.current) localAudioTrackRef.current.enabled = false;
      setMicOn(false);
      if (permanent === true || permanent === "true") setMicLocked(true);
    },
    [localStream],
  );

  const forceUnmuteSelf = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = true));
    if (localAudioTrackRef.current) localAudioTrackRef.current.enabled = true;
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
  }, [screenSharing, socket, meetingId, myUserId, replaceVideoTrackOnAllPeers]);

  const cleanupAll = useCallback(() => {
    isCleaningUp.current = true;
    localStream?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    peers.current.forEach(({ pc }) => pc.close());
    peers.current.clear();
    audioSenders.current.clear();
    videoSenders.current.clear();
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    screenTrackRef.current = null;
    setRemoteStreams({});
    setLocalStream(null);
    setScreenStream(null);
    setScreenSharing(false);
  }, [localStream, screenStream]);

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
  } satisfies UseMeshCallResult;
}