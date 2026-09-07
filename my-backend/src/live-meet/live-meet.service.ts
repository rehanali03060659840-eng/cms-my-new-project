import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes, randomUUID } from 'crypto';
import { LiveChat, LiveChatDocument } from './schemas/live-chat.schema';
import {
  MeetingHistory,
  MeetingHistoryDocument,
} from './schemas/meeting-history.schema';

export type UserInfo = { userId: string; name: string; role: string };
export type JoinRequest = {
  meetingId: string;
  userId: string;
  userName: string;
  socketId: string;
  createdAt: string;
};
export type Participant = {
  userId: string;
  userName: string;
  socketIds: Set<string>;
  joinedAt: Date;
  isHost: boolean;
  muted: boolean;
  cameraOff: boolean;
  micLocked:boolean;

};

export type ActiveMeeting = {
  _id: string;
  title: string;
  code: string;
  hostId: string;
  hostName: string;
  hostSocketId: string;
  requireApproval: boolean;
  maxParticipants: number;
  status: 'lobby' | 'live' | 'ended';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  joinedCount: number;
  peakParticipants: number;
  requests: Map<string, JoinRequest>;
  participants: Map<string, Participant>;
  blockedUserIds?: Set<string>;
};

@Injectable()
export class LiveMeetService {
  private readonly active = new Map<string, ActiveMeeting>();

  constructor(
    @InjectModel(LiveChat.name)
    private readonly chatModel: Model<LiveChatDocument>,
    @InjectModel(MeetingHistory.name)
    private readonly historyModel: Model<MeetingHistoryDocument>,
  ) {}

  private makeCode() {
    return randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  }

  createMeeting(
    user: UserInfo,
    title: string,
    requireApproval = true,
    maxParticipants = 12,
  ) {
    let code = this.makeCode();
    while ([...this.active.values()].some((m) => m.code === code))
      code = this.makeCode();
    const meeting: ActiveMeeting = {
      _id: randomUUID(),
      title: title.trim(),
      code,
      hostId: user.userId,
      hostName: user.name,
      hostSocketId: '',
      requireApproval,
      maxParticipants,
      status: 'lobby',
      createdAt: new Date(),
      joinedCount: 0,
      peakParticipants: 0,
      requests: new Map(),
      participants: new Map(),
    };
    this.active.set(meeting._id, meeting);
    return meeting;
  }

  setHostSocket(meetingId: string, socketId: string) {
    const m = this.get(meetingId);
    m.hostSocketId = socketId;
  }
  get(meetingId: string) {
    const m = this.active.get(meetingId);
    if (!m) throw new NotFoundException('Meeting not found or already ended');
    return m;
  }
  findByCode(code: string) {
    return [...this.active.values()].find((m) => m.code === code.toUpperCase());
  }
  requireHost(m: ActiveMeeting, user: UserInfo) {
    if (m.hostId !== user.userId)
      throw new ForbiddenException('Only the host can do this');
  }

  requestJoin(m: ActiveMeeting, user: UserInfo, socketId: string) {
    if (m.status === 'ended')
      throw new BadRequestException('Meeting has ended');
    if (m.participants.has(user.userId))
      return { accepted: true, participant: m.participants.get(user.userId) };
    if (m.participants.size >= m.maxParticipants)
      throw new BadRequestException('Meeting is full');
    const request: JoinRequest = {
      meetingId: m._id,
      userId: user.userId,
      userName: user.name,
      socketId,
      createdAt: new Date().toISOString(),
    };
    m.requests.set(user.userId, request);
    return { accepted: !m.requireApproval && m.status === 'live', request };
  }

  acceptRequest(m: ActiveMeeting, user: UserInfo, targetUserId: string) {
    this.requireHost(m, user);
    const req = m.requests.get(targetUserId);
    if (!req) throw new NotFoundException('Join request not found');
    m.requests.delete(targetUserId);
    return this.addParticipant(m, {
      userId: req.userId,
      name: req.userName,
      role: 'user',
    });
  }

  rejectRequest(m: ActiveMeeting, user: UserInfo, targetUserId: string) {
    this.requireHost(m, user);
    m.requests.delete(targetUserId);
  }

  addParticipant(m: ActiveMeeting, user: UserInfo) {
    let p = m.participants.get(user.userId);
    if (!p) {
      p = {
        userId: user.userId,
        userName: user.name,
        socketIds: new Set(),
        joinedAt: new Date(),
        isHost: user.userId === m.hostId,
        muted: false,
        cameraOff: false,
        micLocked: false,
      };
      m.participants.set(user.userId, p);
      m.joinedCount += 1;
      m.peakParticipants = Math.max(m.peakParticipants, m.participants.size);
    }
    return p;
  }

  attachSocket(m: ActiveMeeting, userId: string, socketId: string) {
    m.participants.get(userId)?.socketIds.add(socketId);
  }

  removeParticipant(m: ActiveMeeting, userId: string) {
    if (userId === m.hostId)
      throw new ForbiddenException('Host cannot be removed');
    m.participants.delete(userId);
    m.requests.delete(userId);
  }

  startMeeting(m: ActiveMeeting, user: UserInfo) {
    this.requireHost(m, user);
    if (m.status !== 'lobby')
      throw new BadRequestException('Meeting is already started');
    m.status = 'live';
    m.startedAt = new Date();
    this.addParticipant(m, user);
  }

  async endMeeting(m: ActiveMeeting, user: UserInfo) {
    this.requireHost(m, user);
    m.status = 'ended';
    m.endedAt = new Date();
    const durationSeconds = m.startedAt
      ? Math.max(
          0,
          Math.floor((m.endedAt.getTime() - m.startedAt.getTime()) / 1000),
        )
      : 0;
    await this.historyModel.create({
      meetingId: m._id,
      title: m.title,
      code: m.code,
      hostId: m.hostId,
      hostName: m.hostName,
      startedAt: m.startedAt ?? m.createdAt,
      endedAt: m.endedAt,
      durationSeconds,
      joinedCount: m.joinedCount,
      peakParticipants: m.peakParticipants,
      participants: [...m.participants.values()].map((p) => ({
        userId: p.userId,
        userName: p.userName,
        joinedAt: p.joinedAt,
        leftAt: new Date(),
      })),
    });
    this.active.delete(m._id);
    return { durationSeconds };
  }

  async listHistory(limit = 50) {
    return this.historyModel.find().sort({ endedAt: -1 }).limit(limit).lean();
  }
  async getHistory(meetingId: string) {
    const h = await this.historyModel.findOne({ meetingId }).lean();
    if (!h) throw new NotFoundException('History not found');
    return h;
  }

  async listChat(meetingId: string, scope: 'lobby' | 'room') {
    return this.chatModel
      .find({ meetingId, scope })
      .sort({ createdAt: 1 })
      .limit(300)
      .lean();
  }
  async saveChat(
    meetingId: string,
    scope: 'lobby' | 'room',
    type: 'message' | 'question' | 'answer',
    user: UserInfo,
    text: string,
    replyTo?: string,
  ) {
    return this.chatModel.create({
      meetingId,
      scope,
      type,
      senderId: user.userId,
      senderName: user.name,
      text: text.trim(),
      replyTo: replyTo ?? null,
    });
  }
  async editChat(id: string, user: UserInfo, text: string) {
    const msg = await this.chatModel.findById(id);
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== user.userId)
      throw new ForbiddenException('You can edit only your own message');
    msg.text = text.trim();
    msg.isEdited = true;
    return msg.save();
  }
  async deleteChat(id: string, user: UserInfo) {
    const msg = await this.chatModel.findById(id);
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== user.userId)
      throw new ForbiddenException('You can delete only your own message');
    msg.isDeleted = true;
    msg.text = 'This message was deleted';
    return msg.save();
  }
}
