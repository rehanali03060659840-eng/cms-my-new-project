export type MeetingStatus = "lobby" | "live" | "ended";
export type ChatScope = "lobby" | "room";
export type ChatType = "message" | "question" | "answer";

export interface LiveMeeting {
  _id: string;
  title: string;
  code: string;
  hostId: string;
  hostName: string;
  requireApproval: boolean;
  maxParticipants: number;
  status: MeetingStatus;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  peakParticipants: number;
  createdAt: string;
}
export interface MeetingHistoryItem extends LiveMeeting {
  joinedCount: number;
  participants?: {
    userId: string;
    userName: string;
    joinedAt: string;
    leftAt?: string;
  }[];
}
export interface ChatMessage {
  _id: string;
  scope: ChatScope;
  type: ChatType;
  meetingId: string;
  senderId: string;
  senderName: string;
  text: string;
  // id of the question this message answers, so an "answer" bubble can show
  // a small "replying to ..." quote above it. Optional - older messages and
  // plain questions won't have this.
  replyTo?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}
export interface JoinRequest {
  meetingId: string;
  userId: string;
  userName: string;
  socketId?: string;
  createdAt?: string;
}
export interface RoomParticipant {
  userId: string;
  userName: string;
  isHost: boolean;
  muted: boolean;
  cameraOff: boolean;
  // true when the host has permanently muted this person - their own mic
  // button gets disabled and only the host can lift it via "unlock mic".
  micLocked?: boolean;
}