import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  users: User[] = [];
  loading = true; // start loading
  private subscription = new Subscription();

  constructor(
    private auth: AuthService,
    private ws: WebsocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Reactively get current user
    this.subscription.add(
      this.auth.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Subscribe to real-time users updates
    this.subscription.add(
      this.ws.getOnlineUsersUpdates().subscribe(users => {
        if (!this.currentUser) {
          this.users = users ?? [];
        } else {
          // Filter out current user
          this.users = (users ?? []).filter(u => u.id !== this.currentUser!.id);
        }

        if (this.loading) this.loading = false;

        try { this.cdr.detectChanges(); } catch {}
      })
    );


    // Safety fallback: stop loading after 5s
    setTimeout(() => {
      if (this.loading) {
        console.warn('Loading timeout reached, clearing loading state');
        this.loading = false;
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    // Optional: WebSocket disconnect handled globally in service
  }

  logout(): void {
    this.auth.logout();
    // WebSocket service will auto-send disconnect if currentUser$ becomes null
  }

  // Uncomment if invitation feature is needed
  // invite(user: User): void {
  //   this.ws.sendInvitation(user.id);
  //   alert(`Invitation sent to ${user.username}`);
  // }
}
