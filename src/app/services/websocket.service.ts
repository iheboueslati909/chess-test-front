import { Injectable, inject } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private incoming$ = new Subject<any>();

  connect(): void {
    if (this.socket$) { return; }
    try {
      this.socket$ = webSocket('ws://localhost:8080/ws');
      this.socket$.subscribe(msg => this.incoming$.next(msg), err => console.error('WS error', err));
    } catch (e) {
      console.warn('WebSocket init failed', e);
    }
  }

  sendInvitation(toUserId: number): void {
    this.connect();
    const payload = { type: 'INVITE', to: toUserId };
    this.socket$?.next(payload);
  }

  messages(): Observable<any> {
    this.connect();
    return this.incoming$.asObservable();
  }
}

export default WebsocketService;
