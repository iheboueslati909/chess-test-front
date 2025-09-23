import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly API = 'http://localhost:8080/api/users';

listUsers(): Observable<User[]> {
  return this.http.get<User[]>(`${this.API}/online`);
}


  getCurrentUser(): User | null {
    return this.auth.getCurrentUser();
  }
}

export default UserService;
