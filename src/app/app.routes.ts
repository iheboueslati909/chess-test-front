import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component') },
  { path: 'register', loadComponent: () => import('./components/register/register.component') },
  { 
    path: 'lobby', 
    loadComponent: () => import('./components/lobby/lobby.component'),
    canActivate: [authGuard] 
  },
  { path: '', redirectTo: '/lobby', pathMatch: 'full' },
  { path: '**', redirectTo: '/lobby' }
];