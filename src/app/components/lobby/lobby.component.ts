import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';
import { User } from '../../models/user.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {
  currentUser: User | null = null;
  users: User[] = [];
  loading = false;

  constructor(
    private userService: UserService,
    private auth: AuthService,
    private ws: WebsocketService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.userService.getCurrentUser();
    this.fetchUsers();
    this.ws.messages().subscribe(msg => console.log('WS msg', msg));
  }

    fetchUsers(): void {
    this.loading = true;
    this.userService.listUsers().subscribe({
        next: (list) => { 
        console.log('User list received', list);
        this.users = list;
        this.loading = false;
        },
        error: (err) => { 
        console.error('User fetch error', err);
        this.loading = false; 
        }
    });
    }


  logout(): void {
    this.auth.logout();
  }

  invite(user: User): void {
    this.ws.sendInvitation(user.id);
    alert(`Invitation sent to ${user.username}`);
  }
}

export default LobbyComponent;
