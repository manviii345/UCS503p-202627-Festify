import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

let io: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export function initSocketServer(server: http.Server): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // ─── Socket Authentication Middleware ────────────────────────────────────
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      };
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ─── Connection & Room Authorization ────────────────────────────────────
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;

    // Auto-join own fest room on connection based on user context
    const defaultRoom = `fest_${user.role === 'ADMIN' ? user.id : 1}`;
    socket.join(defaultRoom);

    socket.on('join_fest', (data: { festId: number }, ack?: (res: any) => void) => {
      const targetFestId = Number(data?.festId);

      if (isNaN(targetFestId)) {
        const errObj = { error: 'Invalid festId' };
        if (ack) ack(errObj);
        socket.emit('error_message', errObj);
        return;
      }

      // Tenant Authorization Check:
      // An Admin can ONLY join the fest room matching their own admin user ID.
      // Cross-tenant joins MUST be rejected.
      if (user.role === 'ADMIN' && targetFestId !== user.id) {
        const errObj = { error: 'Forbidden: Cross-tenant room join rejected' };
        if (ack) ack(errObj);
        socket.emit('error_message', errObj);
        return;
      }

      const roomName = `fest_${targetFestId}`;
      socket.join(roomName);

      const successObj = { success: true, room: roomName };
      if (ack) ack(successObj);
      socket.emit('joined_room', successObj);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function broadcastCheckIn(festId: number, data: any) {
  if (io) {
    io.to(`fest_${festId}`).emit('checkin_update', data);
  }
}

export function broadcastNotification(festId: number, data: any) {
  if (io) {
    io.to(`fest_${festId}`).emit('notification_broadcast', data);
  }
}

export function broadcastScheduleUpdate(festId: number, data: any) {
  if (io) {
    io.to(`fest_${festId}`).emit('schedule_update', data);
  }
}
