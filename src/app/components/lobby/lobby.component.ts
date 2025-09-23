import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

export interface GameInvitation {
  id: number;
  fromUser: User;
  toUser: User;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
}

@Component({
    selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  users: User[] = [];
  pendingInvitations: GameInvitation[] = [];
  loading = true;

  private subscription = new Subscription();

  constructor(
    private auth: AuthService,
    private ws: WebsocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.subscription.add(
      this.auth.currentUser$.subscribe(user => {
        this.currentUser = user;

        // Re-filter users whenever currentUser changes
        const latestUsers = this.ws.getOnlineUsersUpdates() as any; // BehaviorSubject hack
        if (latestUsers._value) {
            this.users = (latestUsers._value as User[]).filter((u: User) => u.id !== this.currentUser!.id);
        }
      })
    );

    // Subscribe to online users updates
    this.subscription.add(
      this.ws.getOnlineUsersUpdates().subscribe(users => {
        if (this.currentUser) {
          this.users = (users ?? []).filter(u => u.id !== this.currentUser!.id);
        } else {
          this.users = users ?? [];
        }

        if (this.loading) this.loading = false;
        try { this.cdr.detectChanges(); } catch {}
      })
    );

    this.subscription.add(
      this.ws.getInvitationsUpdates().subscribe(invitations => {
        this.pendingInvitations = invitations.filter(inv => 
          inv.status === 'PENDING' && inv.toUser.id === this.currentUser!.id
        );
        console.log('📬 Updated pending invitations:', this.pendingInvitations);
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
  }

  logout(): void {
    this.auth.logout();
    // Websocket auto-send disconnect via currentUser$ subscription
  }

  // Optional: invitation logic
  invite(user: User): void {
    this.ws.sendInvitation(user.id);
    alert(`Invitation sent to ${user.username}`);
  }

  acceptInvitation(invite: GameInvitation): void {
    // Call backend API to accept invitation
    // Redirect to /game after success
    console.log('Accepted invitation', invite);
    // Example: this.router.navigate(['/game', invite.id]);
  }

  declineInvitation(invite: GameInvitation): void {
    // Call backend API to decline invitation
    console.log('Declined invitation', invite);
  }
}
