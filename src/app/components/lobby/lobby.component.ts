import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';
import { User } from '../../models/user.model';
import { Observable, Subscription, combineLatest } from 'rxjs';

@Component({
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit, OnDestroy {
    currentUser: User | null = null;
    users: User[] = [];
    loading = false;
    private subscription = new Subscription();

    constructor(
        private userService: UserService,
        private auth: AuthService,
        private ws: WebsocketService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.currentUser = this.userService.getCurrentUser();
        this.fetchInitialUsers();
        this.subscribeToRealTimeUpdates();
        // Fallback: stop loading after 5s to avoid permanent "Loading players..."
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

    fetchInitialUsers(): void {
        this.loading = true;
        this.userService.listUsers().subscribe({
            next: (users) => {
                console.log('Fetched initial users', users);
                this.users = users;
                this.loading = false;
                // ensure UI updates if this callback ran outside Angular zone
                try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
            },
            error: (err) => {
                console.error('User fetch error', err);
                this.loading = false;
                try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
            }
        });
    }

    subscribeToRealTimeUpdates(): void {
        // Subscribe to websocket online users updates and apply them when non-empty
        this.subscription.add(
            this.ws.getOnlineUsersUpdates().subscribe(realtime => {
                console.log('Realtime users update', realtime);
                if (realtime && realtime.length > 0) {
                    this.users = realtime;
                    if (this.loading) {
                        this.loading = false;
                    }
                    try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
                }
            }) 
        );
    }

    logout(): void {
        this.auth.logout();
        this.ws.disconnect();
    }

    invite(user: User): void {
        this.ws.sendInvitation(user.id);
        alert(`Invitation sent to ${user.username}`);
    }
}