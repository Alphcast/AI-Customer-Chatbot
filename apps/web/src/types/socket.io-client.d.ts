declare module 'socket.io-client' {
  import { ManagerOptions, SocketOptions, Socket as SocketIoSocket } from 'socket.io-client';

  export interface Socket {
    id: string;
    connected: boolean;
    disconnected: boolean;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback?: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
    connect(): void;
    disconnect(): void;
    open(): void;
    close(): void;
    io: Manager;
  }

  interface Manager {
    on(event: string, callback: (...args: unknown[]) => void): void;
  }

  export function io(uri?: string, opts?: Partial<ManagerOptions & SocketOptions>): Socket;

  export { ManagerOptions, SocketOptions };
}
