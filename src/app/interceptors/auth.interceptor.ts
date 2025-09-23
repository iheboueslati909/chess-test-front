import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip adding token for auth requests
if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
  return next(req);
}


  // Get the token from auth service
  const token = authService.getToken();
  
  // Clone request and add authorization header if token exists
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  // If no token, proceed with original request
  return next(req);
};