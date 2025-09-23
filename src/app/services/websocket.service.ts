import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private stompClient: Client | null = null;
  private connected = false;

  private onlineUsersSubject = new BehaviorSubject<User[]>([]);
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor(private auth: AuthService) {
    this.connect();

    // React to login/logout events
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.sendUserConnect();
      } else {
        this.sendUserDisconnect();
      }
    });
  }

  connect(): void {
    if (this.stompClient) return;

    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
        console.log('✅ Connected to STOMP');

        // Subscribe to online users topic
        this.stompClient!.subscribe('/topic/users.online', (msg: IMessage) => {
          try {
            const users: User[] = JSON.parse(msg.body);
            this.onlineUsersSubject.next(users);
          } catch (e) {
            console.error('❌ Bad payload for users.online', e);
          }
        });

        // If user already logged in, sync status
        if (this.auth.getCurrentUser()) {
          this.sendUserConnect();
        }
      },
      onDisconnect: () => {
        this.connected = false;
        console.log('⚠️ Disconnected from STOMP');
      },
      onStompError: frame => {
        console.error('💥 Broker error', frame);
      }
    });

    this.stompClient.activate();
  }

  getOnlineUsersUpdates(): Observable<User[]> {
    return this.onlineUsers$;
  }

  disconnect(): void {
    if (this.stompClient) {
      this.sendUserDisconnect();
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.connected = false;
  }

  private sendUserConnect(): void {
    if (this.connected && this.stompClient) {
      this.stompClient.publish({
        destination: '/app/user.connect',
        body: '{}'
      });
      console.log('📡 Sent user.connect');
    }
  }

  private sendUserDisconnect(): void {
    if (this.connected && this.stompClient) {
      this.stompClient.publish({
        destination: '/app/user.disconnect',
        body: '{}'
      });
      console.log('📡 Sent user.disconnect');
    }
  }
}
