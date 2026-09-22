import { useEffect, useRef } from "react";
import { MicOff, UserRound } from "lucide-react";

export const VideoTile = ({
  stream,
  name,
  isHost,
  muted,
  cameraOff,
  local = false,
  volume = 1,
  fill = false,
  micLocked = false,
}: {
  stream: MediaStream | null;
  name: string;
  isHost?: boolean;
  muted?: boolean;
  cameraOff?: boolean;
  local?: boolean;
  volume?: number;
  // true for the big presenter tile during screen share - fills its
  // container instead of forcing a 16:9 box.
  fill?: boolean;
  micLocked?: boolean;
}) => {
  const ref = useRef<HTMLVideoElement>(null);

  // IMPORTANT: cameraOff is in the dependency list on purpose.
  // The <video> element is conditionally rendered below (mounted only when
  // stream && !cameraOff). Every time cameraOff flips from true -> false a
  // brand new <video> DOM node is created, and its srcObject stays empty
  // until this effect runs again. Without "cameraOff" here, toggling the
  // camera back on left the tile blank until a manual page refresh.
  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream;
    ref.current.volume = volume;
    if (stream) ref.current.play().catch(() => {});
  }, [stream, volume, cameraOff]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg ${
        fill ? "h-full w-full" : "aspect-video"
      }`}
    >
      {stream && !cameraOff ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={local}
          className={`h-full w-full object-cover ${local ? '-scale-x-100' : ''}`}
          style={local ? { transform: 'scaleX(-1)' } : undefined}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold">
            {name?.charAt(0)?.toUpperCase() || <UserRound />}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-xs">
        <span className="font-semibold">
          {name}
          {isHost ? " · Host" : ""}
          {local ? " · You" : ""}
        </span>
        {muted || cameraOff || micLocked ? (
          <div className="flex items-center gap-1">
            {muted && <MicOff size={14} />}
            {micLocked && (
              <span className="rounded bg-red-500/80 px-1.5 py-0.5 text-[9px] font-bold">
                LOCKED
              </span>
            )}
            {cameraOff && <span>CAM OFF</span>}
          </div>
        ) : null}
      </div>
    </div>
  );
};