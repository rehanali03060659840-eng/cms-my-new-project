import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
type RemoteStreams = Record<string, MediaStream>;

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
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  const requestMedia = useCallback(async () => {
    setRequestingMedia(true);
    setPermissionError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(s);
      setMicOn(true);
      setCameraOn(true);
    } catch (e: any) {
      setLocalStream(null);
      setPermissionError(
        e?.name === "NotAllowedError"
          ? "Camera & microphone access was blocked. Allow access from your browser's site settings and try again."
          : "Couldn't access camera or microphone.",
      );
    } finally {
      setRequestingMedia(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setRequestingMedia(true);
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (alive) {
          setLocalStream(s);
          setPermissionError(null);
        } else {
          s.getTracks().forEach((t) => t.stop());
        }
      } catch (e: any) {
        if (alive) {
          setPermissionError(
            e?.name === "NotAllowedError"
              ? "Camera & microphone access was blocked. Allow access from your browser's site settings and try again."
              : "Couldn't access camera or microphone.",
          );
        }
      } finally {
        if (alive) setRequestingMedia(false);
      }
    })();
    return () => {
      alive = false;
      peers.current.forEach((pc) => pc.close());
      peers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!localStream) return;
    peers.current.forEach((pc) => {
      const existing = pc.getSenders().map((s) => s.track?.id);
      localStream.getTracks().forEach((track) => {
        if (!existing.includes(track.id)) pc.addTrack(track, localStream);
      });
    });
  }, [localStream]);

  const createPeer = useCallback(
    (targetUserId: string, isInitiator: boolean) => {
      if (!socket || targetUserId === myUserId) return null;
      peers.current.get(targetUserId)?.close();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peers.current.set(targetUserId, pc);
      localStream
        ?.getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      pc.onicecandidate = (e) => {
        if (e.candidate)
          socket.emit("webrtc:signal", {
            meetingId,
            toUserId: targetUserId,
            data: { candidate: e.candidate },
          });
      };

      pc.ontrack = (e) => {
        if (e.streams[0])
          setRemoteStreams((p) => ({ ...p, [targetUserId]: e.streams[0] }));
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          pc.close();
          peers.current.delete(targetUserId);
          setRemoteStreams((p) => {
            const n = { ...p };
            delete n[targetUserId];
            return n;
          });
        }
      };

      // Handles tracks added after the connection is already up (late
      // permission grant, or switching to/from screen share) by
      // re-offering automatically.
      pc.onnegotiationneeded = async () => {
        try {
          if (pc.signalingState !== "stable") return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:signal", {
            meetingId,
            toUserId: targetUserId,
            data: { sdp: offer },
          });
        } catch (e) {
          console.warn("renegotiation failed", e);
        }
      };

      if (isInitiator)
        pc.createOffer().then(async (offer) => {
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:signal", {
            meetingId,
            toUserId: targetUserId,
            data: { sdp: offer },
          });
        });
      return pc;
    },
    [socket, meetingId, myUserId, localStream],
  );

  const connectToParticipant = useCallback(
    (userId: string) => {
      if (userId !== myUserId && !peers.current.has(userId))
        createPeer(userId, true);
    },
    [createPeer, myUserId],
  );
  const disconnectParticipant = useCallback((userId: string) => {
    peers.current.get(userId)?.close();
    peers.current.delete(userId);
    setRemoteStreams((p) => {
      const n = { ...p };
      delete n[userId];
      return n;
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onSignal = async ({ fromUserId, toUserId, data }: any) => {
      if (toUserId !== myUserId || fromUserId === myUserId) return;
      let pc = peers.current.get(fromUserId);
      if (!pc) pc = createPeer(fromUserId, false) || undefined;
      if (!pc) return;
      try {
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("webrtc:signal", {
              meetingId,
              toUserId: fromUserId,
              data: { sdp: answer },
            });
          }
        } else if (data.candidate && pc.remoteDescription)
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.warn("WebRTC signal error", e);
      }
    };
    socket.on("webrtc:signal", onSignal);
    return () => {
      socket.off("webrtc:signal", onSignal);
    };
  }, [socket, myUserId, meetingId, createPeer]);

  const toggleMic = useCallback(() => {
    if (micLocked) return; // host permanently muted this user - button is disabled
    // Driven purely off the React state (not off reading track.enabled),
    // so the track is always set to exactly what the icon shows - no more
    // "mute works but unmute doesn't" desync.
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

  // permanent = host locked the mic - the toggle button becomes disabled
  // until the host calls unlockMic() for this user. Guarded against a
  // truthy-but-not-boolean value (e.g. a stray "false" string coming over
  // the socket) so a plain temporary mute can never accidentally lock.
  const forceMuteSelf = useCallback(
  (permanent?: boolean | string) => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = false));

    setMicOn(false);

    if (permanent === true) {
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

  socket?.emit("meeting:mic-state", {
    meetingId,
    muted: false,
  });
}, [localStream, socket, meetingId]);

const unlockMic = useCallback(() => {
  setMicLocked(false);
}, []);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      const cam = localStream?.getVideoTracks()[0];
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      peers.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && cam) sender.replaceTrack(cam);
      });
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
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = ss.getVideoTracks()[0];
      screenTrackRef.current = track;
      setScreenStream(ss);
      peers.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(track);
        } else {
          // No existing video sender on this connection (can happen if the
          // camera permission hadn't resolved yet when this peer was
          // created). Add the screen track directly - onnegotiationneeded
          // above will take care of re-offering automatically. This was
          // the main reason screen share sometimes showed nothing at all.
          pc.addTrack(track, ss);
        }
      });
      track.onended = () => {
        const cam = localStream?.getVideoTracks()[0];
        peers.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && cam) sender.replaceTrack(cam);
        });
        setScreenStream(null);
        setScreenSharing(false);
        screenTrackRef.current = null;
        socket?.emit("meeting:screen-share", {
          meetingId,
          userId: myUserId,
          sharing: false,
        });
      };
      setScreenSharing(true);
      socket?.emit("meeting:screen-share", {
        meetingId,
        userId: myUserId,
        sharing: true,
      });
    } catch {
      /* user cancelled the screen picker */
    }
  }, [screenSharing, localStream, socket, meetingId, myUserId]);

  const cleanupAll = useCallback(() => {
    screenTrackRef.current?.stop();
    localStream?.getTracks().forEach((t) => t.stop());
    peers.current.forEach((pc) => pc.close());
    peers.current.clear();
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
