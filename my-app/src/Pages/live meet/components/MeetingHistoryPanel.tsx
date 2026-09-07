import { useEffect, useState } from "react";
import { Clock3, Users, Video, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import type { MeetingHistoryItem } from "../../../types/liveMeet";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const MeetingHistoryPanel = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { token, user } = useAuth() as any;
  const [items, setItems] = useState<MeetingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || user?.role !== "super_admin") return;
     console.log("Sending Token:", token); 
  console.log("User Role:", user?.role);
    setLoading(true);
    fetch(`${API}/live-meet/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open, token, user?.role]);

  if (user?.role !== "super_admin") return null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[380px] transform bg-gradient-to-br from-[#111936] to-[#27348b] shadow-2xl transition-transform duration-300 text-white ${
          open ? "translate-x-0 " : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-bold">Meeting History</h2>
            <p className="text-xs text-zinc-500">Super admin only</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="h-[calc(100%-73px)] overflow-y-auto p-3">
          {loading ? (
            <p className="p-5 text-sm text-zinc-400">Loading...</p>
          ) : items.length ? (
            items.map((m) => (
              <div key={m._id} className="mb-2 rounded-xl border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{m.title}</p>
                    <p className="font-mono text-[10px] text-zinc-400">
                      {m.code}
                    </p>
                  </div>
                  <Video size={15} className="text-indigo-600" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-500">
                  <span className="flex gap-1">
                    <Users size={13} />
                    {m.joinedCount} joined
                  </span>
                  <span className="flex gap-1">
                    <Clock3 size={13} />
                    {Math.floor(m.durationSeconds / 60)}m
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-zinc-400">
                  Host: {m.hostName}
                </p>
              </div>
            ))
          ) : (
            <p className="p-5 text-sm text-zinc-400">No completed meetings.</p>
          )}
        </div>
      </aside>
    </>
  );
};