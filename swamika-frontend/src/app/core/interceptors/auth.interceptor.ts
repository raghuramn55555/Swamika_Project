import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn,
  HttpErrorResponse, HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, from, switchMap, catchError } from 'rxjs';

import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

const PUBLIC_PATHS = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  const tokens = inject(TokenService);
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Skip public auth endpoints
  if (PUBLIC_PATHS.some(p => req.url.includes(p))) {
    return next(req);
  }

  const token = tokens.getAccessToken();

  if (token && tokens.isAccessTokenValid()) {
    return next(attachToken(req, token)).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          return tryRefresh(req, next, tokens, auth, router);
        }
        return throwError(() => err);
      })
    );
  }

  if (token && !tokens.isAccessTokenValid()) {
    return tryRefresh(req, next, tokens, auth, router);
  }

  return next(req);
};

function attachToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function tryRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokens: TokenService,
  auth: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  return from(auth.refreshAccessToken()).pipe(
    switchMap(refreshed => {
      if (refreshed) {
        const newToken = tokens.getAccessToken();
        return newToken ? next(attachToken(req, newToken)) : next(req);
      }
      router.navigate(['/login']);
      return throwError(() => new Error('Session expired'));
    }),
    catchError(err => {
      router.navigate(['/login']);
      return throwError(() => err);
    })
  );
}
