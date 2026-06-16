import { io, Socket } from 'socket.io-client';
import { config } from '@shared/config';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket | null => {
  if (!socket && token) {
    socket = io(`${config.api.socketUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
