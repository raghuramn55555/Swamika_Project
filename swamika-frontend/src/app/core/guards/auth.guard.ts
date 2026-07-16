import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

/**
 * Protects routes that require any authenticated user.
 * Checks both the signal state and token validity.
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const tokens = inject(TokenService);
  const router = inject(Router);

  if (auth.isAuthenticated() && tokens.hasAnyToken()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
