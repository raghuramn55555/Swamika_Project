import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.models';

/**
 * Protects routes that require specific roles.
 *
 * Usage in routes:
 *   canActivate: [roleGuard],
 *   data: { roles: ['ADMINISTRATOR', 'AUDITOR'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const required: UserRole[] = route.data['roles'] ?? [];
  if (required.length === 0) return true;

  if (auth.isAuthenticated() && auth.hasRole(...required)) {
    return true;
  }

  // Authenticated but wrong role → dashboard with access-denied state
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/dashboard'], {
      queryParams: { denied: '1' },
    });
  }

  return router.createUrlTree(['/login']);
};
