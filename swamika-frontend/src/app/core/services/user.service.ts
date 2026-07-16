import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { UserProfile, UserRole } from '../models/user.models';
import { ServiceResult, PageResponse } from '../models/api.models';

const API = '/api/v1';

export interface UpdateProfileRequest {
  fullName?:     string;
  organisation?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword:     string;
}

/** Admin-only user list entry */
export interface UserListItem {
  id:           string;
  fullName:     string;
  email:        string;
  role:         UserRole;
  organisation?: string;
  createdAt:    string;
  active:       boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // ── Current user profile ──────────────────────────────────────────────────

  async getMyProfile(): Promise<ServiceResult<UserProfile>> {
    try {
      const data = await firstValueFrom(
        this.http.get<UserProfile>(`${API}/users/me`)
      );
      // Sync the auth signal with fresh server data
      this.auth.currentUser.set(data);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: this.msg(err) };
    }
  }

  async updateMyProfile(req: UpdateProfileRequest): Promise<ServiceResult<UserProfile>> {
    try {
      const data = await firstValueFrom(
        this.http.patch<UserProfile>(`${API}/users/me`, req)
      );
      this.auth.currentUser.set(data);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: this.msg(err) };
    }
  }

  async changePassword(req: ChangePasswordRequest): Promise<ServiceResult> {
    try {
      await firstValueFrom(
        this.http.post(`${API}/users/me/change-password`, req)
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.msg(err) };
    }
  }

  // ── Admin: user management (ADMINISTRATOR only) ───────────────────────────

  async listUsers(page = 0, size = 20): Promise<ServiceResult<PageResponse<UserListItem>>> {
    if (!this.auth.hasRole('ADMINISTRATOR')) {
      return { ok: false, error: 'Administrator access required.', code: 'ACCESS_DENIED' };
    }
    try {
      const data = await firstValueFrom(
        this.http.get<PageResponse<UserListItem>>(`${API}/admin/users`, {
          params: { page, size },
        })
      );
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: this.msg(err) };
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<ServiceResult> {
    if (!this.auth.hasRole('ADMINISTRATOR')) {
      return { ok: false, error: 'Administrator access required.', code: 'ACCESS_DENIED' };
    }
    try {
      await firstValueFrom(
        this.http.patch(`${API}/admin/users/${userId}/role`, { role })
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.msg(err) };
    }
  }

  async deactivateUser(userId: string): Promise<ServiceResult> {
    if (!this.auth.hasRole('ADMINISTRATOR')) {
      return { ok: false, error: 'Administrator access required.', code: 'ACCESS_DENIED' };
    }
    try {
      await firstValueFrom(
        this.http.delete(`${API}/admin/users/${userId}`)
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.msg(err) };
    }
  }

  private msg(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'An unexpected error occurred.';
  }
}
