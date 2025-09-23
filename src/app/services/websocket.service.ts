import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private stompClient: Client | null = null;
  private connected = false;

  // BehaviorSubject for online users updates
  private onlineUsersSubject = new BehaviorSubject<User[]>([]);
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor() {
    this.connect();
  }

  connect(): void {
    if (this.stompClient && this.connected) return;

    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      onConnect: () => {
        this.connected = true;
        console.log('STOMP connected');

        // Subscribe to online users updates
        if (this.stompClient) {
          this.stompClient.subscribe('/topic/users.online', (message: IMessage) => {
            try {
              const users: User[] = JSON.parse(message.body);
              this.onlineUsersSubject.next(users);
            } catch (err) {
              console.warn('Failed to parse users.online payload', err);
            }
          });
        }

        // Notify server that user connected
        this.sendUserConnect();
      },
      onStompError: (frame: any) => {
        console.error('STOMP error', frame);
      },
      onDisconnect: () => {
        this.connected = false;
        console.log('STOMP disconnected');
      }
    });

    this.stompClient.activate();
  }

  getOnlineUsersUpdates(): Observable<User[]> {
    return this.onlineUsers$;
  }

  sendInvitation(toUserId: number): void {
    if (!this.connected || !this.stompClient) return;
    this.stompClient.publish({
      destination: '/app/invite',
      body: JSON.stringify({ toUserId })
    });
  }

  disconnect(): void {
    if (!this.stompClient) return;
    try {
      this.stompClient.publish({
        destination: '/app/user.disconnect',
        body: JSON.stringify({})
      });
    } catch (e) {
      // ignore
    }
    this.stompClient.deactivate();
    this.stompClient = null;
    this.connected = false;
  }

  private sendUserConnect(): void {
    if (!this.connected || !this.stompClient) return;
    this.stompClient.publish({
      destination: '/app/user.connect',
      body: JSON.stringify({})
    });
  }
}