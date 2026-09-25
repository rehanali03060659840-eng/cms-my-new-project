import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type RemoteStreams = Record<string, MediaStream>;

interface PeerConnectionState {
  pc: RTCPeerConnection;
  // "polite" peers roll back their own offer and accept an incoming one
  // when both sides try to renegotiate at the same time (glare). Exactly
  // one side of every pair is polite so there's never a standoff.
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
}

interface SenderEntry {
  sender: RTCRtpSender;
  track: MediaStreamTrack;
}

/** The shape of everything the hook exposes to its consumers. */
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
  const [micOn, setMicOn] = useState<boolean>(true);
  const [cameraOn, setCameraOn] = useState<boolean>(true);
  const [micLocked, setMicLocked] = useState<boolean>(false);
  const [screenSharing, setScreenSharing] = useState<boolean>(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requestingMedia, setRequestingMedia] = useState<boolean>(false);

  const peers = useRef<Map<string, PeerConnectionState>>(new Map());
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const isCleaningUp = useRef<boolean>(false);
  const hasRequestedOnMount = useRef<boolean>(false);
  const audioSenders = useRef<Map<string, SenderEntry>>(new Map());
  const videoSenders = useRef<Map<string, SenderEntry>>(new Map());

  const requestMedia = useCallback(async (): Promise<void> => {
    if (requestingMedia) return;
    setRequestingMedia(true);
    setPermissionError(null);

    // Basic environment guard: getUserMedia only exists in secure contexts
    // (https or localhost). If it's missing, fail fast with a clear message
    // instead of throwing a confusing runtime error.
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError(
        "Camera/microphone access isn't available in this browser context. Make sure the page is loaded over HTTPS.",
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
      setLocalStream(stream);
      stream.getAudioTracks().forEach((t) => {
        localAudioTrackRef.current = t;
        // Respect whatever mic/cam state the user had toggled to before.
        t.enabled = micOn;
      });
      stream.getVideoTracks().forEach((t) => {
        localVideoTrackRef.current = t;
        t.enabled = cameraOn;
      });
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionError(
            "Camera and microphone permissions were denied. Please allow them in your browser settings and try again.",
          );
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setPermissionError("No camera or microphone was detected on this device.");
        } else if (err.name === "NotReadableError" || err.name === "ConstraintNotSatisfiedError") {
          setPermissionError(
            "Camera or microphone is already in use by another application or tab.",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestingMedia]);

  // Ask for camera/mic access once, automatically, as soon as the hook
  // mounts (previously this only ran from a manual "Enable camera & mic"
  // button, so media never initialized on its own).
  useEffect(() => {
    if (hasRequestedOnMount.current) return;
    hasRequestedOnMount.current = true;
    requestMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Exactly one side of every pair must be "polite" so a simultaneous
      // renegotiation from both ends never ends in a standoff. Comparing
      // the two user IDs gives both sides the same, consistent answer.
      const polite = myUserId > targetUserId;
      const peerState: PeerConnectionState = {
        pc,
        polite,
        makingOffer: false,
        ignoreOffer: false,
      };
      peers.current.set(targetUserId, peerState);

      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        const videoTracks = localStream.getVideoTracks();
        audioTracks.forEach((track) => {
          const sender = pc.addTrack(track, localStream);
          audioSenders.current.set(track.id, { sender, track });
        });
        videoTracks.forEach((track) => {
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

      // This is the ONLY place an offer is ever created now. Previously,
      // createPeer *also* manually created an initial offer below when
      // isInitiator was true — but addTrack() above already queues this
      // same "negotiationneeded" event automatically. Having both fire
      // raced against each other and produced exactly the console error
      // you saw: "signalingState have-local-offer" / m-lines order
      // mismatch, because a second offer was built while the first one
      // was still in flight. Removing the duplicate manual offer (further
      // down) fixes that at the source.
      pc.onnegotiationneeded = async () => {
        const state = peers.current.get(targetUserId);
        if (!state) return;
        try {
          state.makingOffer = true;
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          const success = await safeSetLocalDescription(pc, offer);
          if (success) {
            socket.emit("webrtc:signal", {
              meetingId,
              toUserId: targetUserId,
              data: { sdp: pc.localDescription },
            });
          }
        } catch (err) {
          console.error("Negotiation error ignored safely:", err);
        } finally {
          state.makingOffer = false;
        }
      };

      // NOTE: the old code had an `if (isInitiator) { pc.createOffer()... }`
      // block here that manually kicked off the very first offer. It has
      // been removed on purpose — `onnegotiationneeded` above already fires
      // automatically once the tracks are added a few lines up, so keeping
      // both caused the duplicate-offer race described above. `isInitiator`
      // is kept as a parameter for API compatibility with existing callers
      // but is intentionally unused now.
      void isInitiator;

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

      const { pc, polite } = state;

      try {
        if (data.sdp) {
          const description = data.sdp;

          // Perfect-negotiation glare handling: if we're also in the
          // middle of sending our own offer (or we're not in a stable
          // state) when an incoming offer arrives, that's a collision.
          // The polite side rolls its own offer back and accepts the
          // incoming one; the impolite side ignores the incoming one and
          // lets its own offer win. This is what actually prevents the
          // "m-lines order mismatch" error when both sides try to
          // renegotiate around the same time (e.g. toggling camera /
          // screen-share close together).
          const offerCollision =
            description.type === "offer" &&
            (state.makingOffer || pc.signalingState !== "stable");

          state.ignoreOffer = !polite && offerCollision;
          if (state.ignoreOffer) {
            return;
          }

          if (offerCollision) {
            await Promise.all([
              pc.setLocalDescription({ type: "rollback" }),
              pc.setRemoteDescription(new RTCSessionDescription(description)),
            ]);
          } else {
            await pc.setRemoteDescription(new RTCSessionDescription(description));
          }

          if (description.type === "offer") {
            const answer = await pc.createAnswer();
            const success = await safeSetLocalDescription(pc, answer);
            if (success) {
              socket.emit("webrtc:signal", {
                meetingId,
                toUserId: fromUserId,
                data: { sdp: pc.localDescription },
              });
            }
          }
        } else if (data.candidate && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            if (!state.ignoreOffer) {
              console.warn("ICE candidate add failed:", err);
            }
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
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
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
      socket?.emit("meeting:camera-state", { meetingId, cameraOff: !next });
      // NOTE: the old code called `scheduleRenegotiation(myUserId)` here.
      // That function looked up a peer connection keyed by *your own*
      // user ID, which never exists in the `peers` map (you don't have a
      // peer connection to yourself), so it was a silent no-op. Simply
      // flipping `track.enabled` is all that's needed for mute/unmute or
      // camera on/off — the browser propagates that to the remote side
      // without any SDP renegotiation, so no replacement call is needed.
      return next;
    });
  }, [localStream, socket, meetingId]);

  const forceMuteSelf = useCallback(
    (permanent?: boolean | string) => {
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setMicOn(false);
      if (permanent === true || permanent === "true") {
        setMicLocked(true);
      }
    },
    [localStream],
  );

  const forceUnmuteSelf = useCallback(() => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = true;
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

  // When the local stream finally arrives (or is recreated), make sure every
  // already-existing peer connection actually has our audio + video tracks
  // attached. Without this, peers created before getUserMedia resolved would
  // never send media to anyone.
  useEffect(() => {
    if (!localStream) return;
    const audio = localStream.getAudioTracks();
    const video = localStream.getVideoTracks();
    peers.current.forEach(({ pc }) => {
      const existingAudio = pc.getSenders().filter((s) => s.track?.kind === "audio");
      const existingVideo = pc.getSenders().filter((s) => s.track?.kind === "video");
      audio.forEach((track) => {
        const already = existingAudio.find((s) => s.track?.id === track.id);
        if (!already) {
          const sender = pc.addTrack(track, localStream);
          audioSenders.current.set(track.id, { sender, track });
        }
      });
      video.forEach((track) => {
        const already = existingVideo.find((s) => s.track?.id === track.id);
        if (!already) {
          const sender = pc.addTrack(track, localStream);
          videoSenders.current.set(track.id, { sender, track });
        }
      });
    });
  }, [localStream]);

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
    localStream?.getTracks().forEach((track) => track.stop());
    screenStream?.getTracks().forEach((track) => track.stop());
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