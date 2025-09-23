import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: number;
  username: string;
  online: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly API_URL = 'http://localhost:8080/api/auth';

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.user) {
            this.handleAuthenticationSuccess(response);
          }
        })
      );
  }

  register(registerData: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, registerData)
      .pipe(
        tap(response => {
          if (response.success && response.user) {
            this.handleAuthenticationSuccess(response);
          }
        })
      );
  }

  logout(): void {
    // Call logout endpoint if needed
    this.http.post(`${this.API_URL}/logout`, {}).subscribe();

    // Clear local storage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
    
    this.router.navigate(['/login']);
  }

    /**
   * Auto-login using stored credentials
   */
  autoLogin(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        console.log('Auto-login successful for user:', user.username);
        
        // Optional: Validate token with backend (uncomment if needed)
        // this.validateToken().subscribe({
        //   error: () => this.logout()
        // });
        
      } catch (error) {
        console.error('Error during auto-login:', error);
        this.logout();
      }
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private handleAuthenticationSuccess(response: AuthResponse): void {
    if (response.user) {
      this.currentUserSubject.next(response.user);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      this.router.navigate(['/lobby']);
    }
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }
}