import { io, Socket } from 'socket.io-client';
import { config } from '@shared/config';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (!socket) {
    socket = io(`${config.api.socketUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
