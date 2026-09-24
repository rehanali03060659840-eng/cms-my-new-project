import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CornerUpLeft,
  MessageCircleQuestion,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { Socket } from "socket.io-client";
import type { ChatMessage, ChatScope, ChatType } from "../../../types/liveMeet";

const fmtTime = (iso: string) => { 
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  return `${d.toLocaleDateString([], { day: "2-digit", month: "short" })} · ${time}`;
};

export const ChatPanel = ({
  socket,
  meetingId,
  scope,
  myUserId,
  title = "Chat",
}: {
  socket: Socket | null;
  meetingId: string;
  scope: ChatScope;
  myUserId: string;
  title?: string;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [type, setType] = useState<ChatType>("question");
  const [editing, setEditing] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; senderName: string } | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit("chat:load", { meetingId, scope }, (r: any) =>
      setMessages(r?.messages ?? []),
    );

    const onNew = (m: ChatMessage) => {
      if (m.scope === scope) setMessages((p) => [...p, m]);
    };
    const onUpdated = (m: ChatMessage) =>
      setMessages((p) => p.map((x) => (x._id === m._id ? m : x)));

    socket.on("chat:new", onNew);
    socket.on("chat:updated", onUpdated);

    return () => {
      socket.off("chat:new", onNew);
      socket.off("chat:updated", onUpdated);
    };
  }, [socket, meetingId, scope]);

  const startReply = (m: ChatMessage) => {
    setReplyTo({ id: m._id, text: m.text, senderName: m.senderName });
    setType("answer");
  };

  const send = () => {
    if (!socket || !text.trim()) return;
    if (editing) {
      socket.emit("chat:edit", { messageId: editing, text, meetingId });
      setEditing(null);
    } else {
      // NOTE: "replyTo" is sent to the backend so it can be stored and
      // echoed back to every viewer. If your chat:send handler doesn't
      // save/return this field yet, the quoted question will only show up
      // for the person who sent the reply (optimistic local state), not
      // for everyone else - add "replyTo" to the message schema/handler
      // on the server to make it fully work for all participants.
      socket.emit("chat:send", {
        meetingId,
        scope,
        type,
        text,
        replyTo: replyTo?.id,
      });
    }
    setText("");
    setType("question");
    setReplyTo(null);
  };

  const sorted = useMemo(() => messages, [messages]);
  const byId = useMemo(() => {
    const m = new Map<string, ChatMessage>();
    messages.forEach((msg) => m.set(msg._id, msg));
    return m;
  }, [messages]);

  const typeStyles: Record<ChatType, string> = {
    question: "bg-amber-50 border border-amber-100",
    answer: "bg-emerald-50 border border-emerald-100",
    message: "bg-zinc-50",
  };

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-2xl border border-zinc-200 text-zinc-900 bg-white shadow-sm">
      <div className="border-b p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-zinc-500">Questions and answers are saved.</p>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {sorted.map((m) => {
          const quoted = m.replyTo ? byId.get(m.replyTo) : undefined;
          return (
            <div
              key={m._id}
              className={`group rounded-xl p-3 ${typeStyles[m.type] ?? "bg-zinc-50"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-800">
                    {m.senderName}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] uppercase text-zinc-500">
                    {m.type}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {fmtTime(m.createdAt)}
                  </span>
                </div>
                <div className="hidden gap-1 group-hover:flex">
                  {m.type === "question" && !m.isDeleted && (
                    <button
                      onClick={() => startReply(m)}
                      title="Reply with an answer"
                      className="rounded p-1 hover:bg-zinc-200"
                    >
                      <CornerUpLeft size={13} />
                    </button>
                  )}
                  {m.senderId === myUserId && !m.isDeleted && (
                    <>
                      <button
                        onClick={() => {
                          setEditing(m._id);
                          setText(m.text);
                        }}
                        className="rounded p-1 hover:bg-zinc-200"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() =>
                          socket?.emit("chat:delete", {
                            messageId: m._id,
                            meetingId,
                          })
                        }
                        className="rounded p-1 hover:bg-red-100 text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {quoted && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-white/70 px-2 py-1.5 text-[11px] text-zinc-500">
                  <CornerUpLeft size={11} className="mt-0.5 shrink-0" />
                  <span className="truncate">
                    <span className="font-semibold">{quoted.senderName}:</span>{" "}
                    {quoted.text}
                  </span>
                </div>
              )}
              <p className="mt-1 text-sm text-zinc-700">
                {m.text}
                {m.isEdited && !m.isDeleted ? " (edited)" : ""}
              </p>
            </div>
          );
        })}
        {!messages.length && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-zinc-400">
            <MessageCircleQuestion size={28} className="text-zinc-300" />
            No questions yet.
          </div>
        )}
      </div>
      <div className="border-t p-3">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            <span className="truncate">
              Replying to <b>{replyTo.senderName}</b>: {replyTo.text}
            </span>
            <button onClick={() => setReplyTo(null)} className="shrink-0">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="mb-2 flex gap-2">
          {(["question", "answer"] as ChatType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase transition ${
                type === t
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={
              type === "question" ? "Ask a question..." : "Write an answer..."
            }
            className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none text-zinc-900 focus:border-indigo-500"
          />
          <button
            onClick={send}
            className="rounded-xl bg-indigo-600 px-4 text-white"
          >
            {editing ? <Check size={17} /> : <Send size={17} />}
          </button>
          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                setText("");
              }}
              className="rounded-xl border px-3"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};