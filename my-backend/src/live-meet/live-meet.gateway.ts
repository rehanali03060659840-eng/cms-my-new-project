import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LiveMeetService, UserInfo } from './live-meet.service';

@WebSocketGateway({
  namespace: '/live-meet',
  transports: ['polling', 'websocket'], 
  cors: {
    origin: [
      'https://web.app',
      'https://web.app',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  },
})
export class LiveMeetGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  constructor(
    private readonly service: LiveMeetService, 
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Missing token');
      const payload = await this.jwt.verifyAsync<any>(token);
      const user: UserInfo = {
        userId: String(
          payload.sub ?? payload.id ?? payload.userId ?? payload.email,
        ),
        name: String(
          payload.name ?? payload.username ?? payload.email ?? 'User',
        ),
        role: String(payload.role ?? 'user'),
      };
      socket.data.user = user;
    } catch (err) {
      console.error('LiveMeet socket authentication failed:', err);
      socket.emit('live-meet:error', {
        message: 'Socket authentication failed',
      });
      socket.disconnect(true);
    }
  }

  private user(socket: Socket) {
    if (!socket.data.user) throw new ForbiddenException('Not authenticated');
    return socket.data.user as UserInfo;
  }
  private room(meetingId: string) {
    return `meeting:${meetingId}`;
  }

  // Returns all connected sockets in this gateway's namespace.
  // When @WebSocketGateway specifies a namespace, this.server is a
  // Namespace (sockets is a Map). Without a namespace it's a Server
  // (sockets is a Namespace, sockets.sockets is a Map).
  private allSockets(): Socket[] {
    const s = this.server as any;
    const map: Map<string, Socket> | undefined =
      s?.sockets?.sockets instanceof Map
        ? s.sockets.sockets
        : s?.sockets instanceof Map
          ? s.sockets
          : undefined;
    return map ? [...map.values()] : [];
  }

  @SubscribeMessage('meeting:create')
  create(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      title: string;
      requireApproval?: boolean;
      maxParticipants?: number;
    },
  ) {
    const m = this.service.createMeeting(
      this.user(socket),
      body.title,
      body.requireApproval ?? true,
      body.maxParticipants ?? 12,
    );
    this.service.setHostSocket(m._id, socket.id);
    socket.join(this.room(m._id));
    return { meeting: this.dto(m) };
  }

  @SubscribeMessage('meeting:find-by-code')
  findByCode(@MessageBody() body: { code: string }) {
    const m = this.service.findByCode(body.code);
    return { meeting: m ? this.dto(m) : null };
  }

  @SubscribeMessage('meeting:request-join')
  async requestJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string },
  ) {
    const user = this.user(socket);
    const m = this.service.get(body.meetingId);
    if (m.blockedUserIds?.has(user.userId)) {
      socket.emit('meeting:rejected', {
        meetingId: m._id,
        message: 'You have been blocked from this meeting',
      });
      return { accepted: false, blocked: true };
    }
    const result = this.service.requestJoin(m, user, socket.id);
    socket.join(this.room(m._id));
    this.server.to(m.hostSocketId).emit(
      'meeting:join-request',
      result.request ?? {
        userId: user.userId,
        userName: user.name,
        meetingId: m._id,
      },
    );
    if (result.accepted) {
      this.service.addParticipant(m, user);
      this.service.attachSocket(m, user.userId, socket.id);
      socket.emit('meeting:approved', {
        meeting: this.dto(m),
        participants: this.participants(m),
      });
    } else socket.emit('meeting:waiting', { meeting: this.dto(m) });
    return { accepted: result.accepted };
  }

  @SubscribeMessage('meeting:approve-request')
  approve(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string; userId: string },
  ) {
    const host = this.user(socket);
    const m = this.service.get(body.meetingId);
    const p = this.service.acceptRequest(m, host, body.userId);
    const reqSocket = this.allSockets().find(
      (s) => s.data.user?.userId === body.userId && s.connected,
    );
    if (reqSocket) {
      this.service.attachSocket(m, body.userId, reqSocket.id);
      reqSocket.emit('meeting:approved', {
        meeting: this.dto(m),
        participants: this.participants(m),
      });
    }
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
    return { participant: this.publicParticipant(p) };
  }

  @SubscribeMessage('meeting:reject-request')
  reject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string; userId: string; block?: boolean },
  ) {
    const m = this.service.get(body.meetingId);
    this.service.rejectRequest(m, this.user(socket), body.userId);
    if (body.block) {
      if (!m.blockedUserIds) m.blockedUserIds = new Set<string>();
      m.blockedUserIds.add(body.userId);
    }
    const target = this.allSockets().find(
      (s) => s.data.user?.userId === body.userId,
    );
    target?.emit('meeting:rejected', {
      meetingId: m._id,
      message: body.block
        ? 'Your join request was rejected and you were blocked'
        : 'Your join request was rejected',
      blocked: !!body.block,
    });
  }

  @SubscribeMessage('meeting:start')
  start(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string },
  ) {
    const m = this.service.get(body.meetingId);
    this.service.startMeeting(m, this.user(socket));
    socket.join(this.room(m._id));
    this.server.to(this.room(m._id)).emit('meeting:started', {
      meeting: this.dto(m),
      participants: this.participants(m),
    });
  }

  @SubscribeMessage('meeting:join-room')
  joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string },
  ) {
    const user = this.user(socket);
    const m = this.service.get(body.meetingId);
    if (user.userId !== m.hostId && !m.participants.has(user.userId))
      throw new ForbiddenException('Join request not approved');
    this.service.addParticipant(m, user);
    this.service.attachSocket(m, user.userId, socket.id);
    if (user.userId === m.hostId) {
      this.service.setHostSocket(m._id, socket.id);
    }
    socket.join(this.room(m._id));
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
    return { meeting: this.dto(m), participants: this.participants(m) };
  }

  @SubscribeMessage('meeting:leave')
  leave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string },
  ) {
    const m = this.service.get(body.meetingId);
    const user = this.user(socket);
    if (user.userId !== m.hostId) {
      m.participants.delete(user.userId);
    }
    socket.leave(this.room(m._id));
    this.server
      .to(this.room(m._id))
      .emit('meeting:participant-left', { userId: user.userId });
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
  }

  @SubscribeMessage('meeting:end')
  async end(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string },
  ) {
    const m = this.service.get(body.meetingId);
    const result = await this.service.endMeeting(m, this.user(socket));
    this.server
      .to(this.room(m._id))
      .emit('meeting:ended', { meetingId: m._id, ...result });
    return result;
  }

  // --- mute / lock / unlock / unmute ------------------------------------

  @SubscribeMessage('meeting:mute')
  mute(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: { meetingId: string; userId: string; permanent?: boolean },
  ) {
    const m = this.service.get(body.meetingId);
    this.service.requireHost(m, this.user(socket));
    if (body.userId === m.hostId)
      throw new BadRequestException('Host cannot be muted');
    const p = m.participants.get(body.userId);
    if (!p) return;
    p.muted = true;
    p.micLocked = !!body.permanent;
    for (const sid of p.socketIds)
      this.server.to(sid).emit('meeting:participant-muted', {
        userId: body.userId,
        permanent: p.micLocked,
      });
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
  }

  @SubscribeMessage('meeting:unmute')
  unmute(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string; userId: string },
  ) {
    const m = this.service.get(body.meetingId);
    this.service.requireHost(m, this.user(socket));
    const p = m.participants.get(body.userId);
    if (!p) return { ok: false, message: 'Participant not found' };
    p.muted = false;
    p.micLocked = false;
    for (const sid of p.socketIds)
      this.server
        .to(sid)
        .emit('meeting:participant-unmuted', { userId: body.userId });
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
    return { ok: true };
  }

  @SubscribeMessage('meeting:unlock-mic')
  unlockMic(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string; userId: string },
  ) {
    const m = this.service.get(body.meetingId);
    this.service.requireHost(m, this.user(socket));
    const p = m.participants.get(body.userId);
    if (!p) return;
    p.micLocked = false;
    for (const sid of p.socketIds)
      this.server.to(sid).emit('meeting:mic-unlocked', { userId: body.userId });
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
  }

  @SubscribeMessage('meeting:mute-all')
  muteAll(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string },
  ) {
    const m = this.service.get(body.meetingId);
    this.service.requireHost(m, this.user(socket));
    for (const p of m.participants.values()) {
      if (p.userId === m.hostId) continue;
      p.muted = true;
      for (const sid of p.socketIds)
        this.server.to(sid).emit('meeting:participant-muted', {
          userId: p.userId,
          permanent: false,
        });
    }
    this.server.to(this.room(m._id)).emit('meeting:muted-all', {});
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
  }

  // Self-reported mic/camera toggles - keeps everyone else's participant
  // list (and the MicOff / CAM OFF badges on their tiles) in sync.
  @SubscribeMessage('meeting:mic-state')
  micState(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string; muted: boolean },
  ) {
    const m = this.service.get(body.meetingId);
    const user = this.user(socket);
    const p = m.participants.get(user.userId);
    if (!p || p.micLocked) return; // locked users can't self-report unmuted
    p.muted = body.muted;
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
  }

  @SubscribeMessage('meeting:camera-state')
  cameraState(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string; cameraOff: boolean },
  ) {
    const m = this.service.get(body.meetingId);
    const user = this.user(socket);
    const p = m.participants.get(user.userId);
    if (!p) return;
    p.cameraOff = body.cameraOff;
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
  }

  // Relays "who is presenting" to the room - the actual video track goes
  // peer-to-peer over WebRTC, this only drives the UI (big tile, chat
  // moving under the video, etc).
  @SubscribeMessage('meeting:screen-share')
  screenShare(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: { meetingId: string; userId: string; sharing: boolean },
  ) {
    const m = this.service.get(body.meetingId);
    socket.to(this.room(m._id)).emit('meeting:screen-share', {
      userId: body.userId,
      sharing: body.sharing,
    });
  }

  // ------------------------------------------------------------------

  @SubscribeMessage('meeting:remove')
  remove(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: { meetingId: string; userId: string; block?: boolean },
  ) {
    const m = this.service.get(body.meetingId);
    this.service.requireHost(m, this.user(socket));
    if (body.userId === m.hostId)
      throw new BadRequestException('Host cannot be removed');
    const p = m.participants.get(body.userId);
    this.service.removeParticipant(m, body.userId);
    if (body.block) {
      if (!m.blockedUserIds) m.blockedUserIds = new Set<string>();
      m.blockedUserIds.add(body.userId);
    }
    for (const sid of p?.socketIds ?? [])
      this.server
        .to(sid)
        .emit('meeting:removed', { meetingId: m._id, blocked: !!body.block });
    this.server
      .to(this.room(m._id))
      .emit('meeting:participants', this.participants(m));
  }

  @SubscribeMessage('chat:load')
  async loadChat(
    @MessageBody() body: { meetingId: string; scope: 'lobby' | 'room' },
  ) {
    return {
      messages: await this.service.listChat(body.meetingId, body.scope),
    };
  }

  @SubscribeMessage('chat:send')
  async sendChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      meetingId: string;
      scope: 'lobby' | 'room';
      type?: 'message' | 'question' | 'answer';
      text: string;
      replyTo?: string;
    },
  ) {
    const msg = await this.service.saveChat(
      body.meetingId,
      body.scope,
      body.type ?? 'message',
      this.user(socket),
      body.text,
      body.replyTo,
    );
    this.server.to(this.room(body.meetingId)).emit('chat:new', msg);
    return { message: msg };
  }

  @SubscribeMessage('chat:edit')
  async editChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { messageId: string; text: string; meetingId: string },
  ) {
    const msg = await this.service.editChat(
      body.messageId,
      this.user(socket),
      body.text,
    );
    this.server.to(this.room(body.meetingId)).emit('chat:updated', msg);
    return { message: msg };
  }

  @SubscribeMessage('chat:delete')
  async deleteChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { messageId: string; meetingId: string },
  ) {
    const msg = await this.service.deleteChat(
      body.messageId,
      this.user(socket),
    );
    this.server.to(this.room(body.meetingId)).emit('chat:updated', msg);
    return { message: msg };
  }

  @SubscribeMessage('webrtc:signal')
  signal(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { meetingId: string; toUserId: string; data: any },
  ) {
    const m = this.service.get(body.meetingId);
    if (
      !m.participants.has(this.user(socket).userId) &&
      this.user(socket).userId !== m.hostId
    )
      throw new ForbiddenException('Not in meeting');
    const target = this.allSockets().find(
      (s) => s.data.user?.userId === body.toUserId,
    );
    target?.emit('webrtc:signal', {
      fromUserId: this.user(socket).userId,
      toUserId: body.toUserId,
      data: body.data,
    });
  }

  private dto(m: any) {
    return {
      _id: m._id,
      title: m.title,
      code: m.code,
      hostId: m.hostId,
      hostName: m.hostName,
      requireApproval: m.requireApproval,
      maxParticipants: m.maxParticipants,
      status: m.status,
      startedAt: m.startedAt?.toISOString(),
      endedAt: m.endedAt?.toISOString(),
      durationSeconds: m.startedAt
        ? Math.floor(
            ((m.endedAt ?? new Date()).getTime() - m.startedAt.getTime()) /
              1000,
          )
        : 0,
      peakParticipants: m.peakParticipants,
      createdAt: m.createdAt.toISOString(),
    };
  }
  private publicParticipant(p: any) {
    return {
      userId: p.userId,
      userName: p.userName,
      isHost: p.isHost,
      muted: p.muted,
      cameraOff: p.cameraOff,
      micLocked: !!p.micLocked,
    };
  }
  private participants(m: any) {
    return [...m.participants.values()].map((p: any) =>
      this.publicParticipant(p),
    );
  }
}
