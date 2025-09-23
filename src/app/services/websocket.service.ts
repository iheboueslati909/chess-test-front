import { Injectable } from '@angular/core';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

export interface GameInvitation {
  id: number;
  fromUser: User;
  toUser: User;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private stompClient: Client | null = null;
  private connected = false;
  private connectionReady = new BehaviorSubject<boolean>(false);

  private readonly API_URL = 'http://localhost:8080/api/invitations';

  private onlineUsersSubject = new BehaviorSubject<User[]>([]);
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  private invitationsSubject = new BehaviorSubject<GameInvitation[]>([]);
  public invitations$ = this.invitationsSubject.asObservable();

  constructor(private auth: AuthService, private http: HttpClient) {
    this.initConnection();

    // React to login/logout events
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.connectionReady.subscribe(ready => {
          if (ready) this.sendUserConnect();
        });
      } else {
        if (this.connected) this.sendUserDisconnect();
      }
    });
  }

  private initConnection(): void {
    if (this.stompClient) return;

    const socket = new SockJS('http://localhost:8080/ws');

    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      debug: (msg: string) => console.log('STOMP:', msg),
      onConnect: frame => {
        this.connected = true;
        console.log('✅ Connected to STOMP');
        this.connectionReady.next(true);

        this.subscribeToTopics();
      },
      onStompError: frame => console.error('❌ STOMP error', frame),
      onWebSocketError: evt => console.error('❌ WebSocket error', evt),
      onDisconnect: () => {
        this.connected = false;
        this.connectionReady.next(false);
        this.onlineUsersSubject.next([]);
        this.invitationsSubject.next([]);
        console.log('⚠️ Disconnected from STOMP');
      }
    });

    this.stompClient.activate();
  }

  private subscribeToTopics(): void {
    if (!this.stompClient) return;

    // Online users updates
    this.stompClient.subscribe('/topic/users.online', (msg: IMessage) => {
      const users: User[] = JSON.parse(msg.body);
      this.onlineUsersSubject.next(users);
      console.log('👥 Online users update', users);
    });

    // Invitations to this user
    this.stompClient.subscribe('/user/queue/invitations', (msg: IMessage) => {
      console.log('📨 Invitation message received', msg);
      const invitation: GameInvitation = JSON.parse(msg.body);

      const current = this.invitationsSubject.value;
      const index = current.findIndex(inv => inv.id === invitation.id);

      if (index !== -1) current[index] = invitation;
      else current.push(invitation);

      this.invitationsSubject.next([...current]);
      console.log('📨 New/Updated invitation stored', invitation);
    });

    // Invitation responses
    this.stompClient.subscribe('/user/queue/invitation-response', (msg: IMessage) => {
      const invitation: GameInvitation = JSON.parse(msg.body);
      const updated = this.invitationsSubject.value.map(inv =>
        inv.id === invitation.id ? invitation : inv
      );
      this.invitationsSubject.next(updated);
      console.log('📬 Invitation response received', invitation);
    });
  }

  getOnlineUsersUpdates(): Observable<User[]> {
    return this.onlineUsers$;
  }

  getInvitationsUpdates(): Observable<GameInvitation[]> {
    return this.invitations$;
  }

  sendInvitation(userId: number): void {
    this.http.post<GameInvitation>(`${this.API_URL}/send/${userId}`, {}).subscribe({
      next: invitation => console.log('✅ Invitation sent', invitation),
      error: err => console.error('❌ Failed to send invitation', err)
    });
  }

  sendUserConnect(): void {
    if (this.connected && this.stompClient) {
      this.stompClient.publish({ destination: '/app/user.connect', body: '{}' });
      console.log('📶 User connect sent');
    }
  }

  sendUserDisconnect(): void {
    if (this.connected && this.stompClient) {
      this.stompClient.publish({ destination: '/app/user.disconnect', body: '{}' });
      console.log('📴 User disconnect sent');
    }
  }
}
