// ─── User & Role models (aligned with SRS roles table) ───────────────────────

export type UserRole = 'ADMINISTRATOR' | 'RECRUITER' | 'REVIEWER' | 'AUDITOR';

/** Permitted actions per role, sourced from SRS §Users and Roles */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMINISTRATOR: [
    'upload_cv', 'delete_cv', 'run_search', 'save_search',
    'reveal_identity', 'edit_aliases', 'edit_models',
    'read_audit', 'export_shortlist', 'manage_users',
  ],
  RECRUITER: [
    'upload_cv', 'run_search', 'save_search',
    'compare_candidates', 'create_shortlist', 'add_notes',
    'reveal_identity_policy', 'export_shortlist',
  ],
  REVIEWER: [
    'view_shared_search', 'view_comparison',
    'provide_feedback',
  ],
  AUDITOR: [
    'read_audit', 'read_search_config',
    'read_model_versions', 'read_deletion_evidence',
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRATOR: 'Administrator',
  RECRUITER:     'Recruiter',
  REVIEWER:      'Reviewer / Hiring Manager',
  AUDITOR:       'Auditor',
};

export const ROLE_ICONS: Record<UserRole, string> = {
  ADMINISTRATOR: 'admin_panel_settings',
  RECRUITER:     'person_search',
  REVIEWER:      'rate_review',
  AUDITOR:       'policy',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMINISTRATOR: 'Configure users, retention, dictionaries, model endpoints and settings.',
  RECRUITER:     'Upload CVs, run searches, compare candidates, create shortlists and add notes.',
  REVIEWER:      'View approved results and comparisons; provide relevance feedback.',
  AUDITOR:       'Read audit events, search configurations, model versions and deletion evidence.',
};

// ── Auth payloads ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface RegisterRequest {
  fullName:     string;
  email:        string;
  password:     string;
  role:         UserRole;
  organisation?: string;
}

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    'Bearer';
  expiresIn:    number;        // seconds
  user:         UserProfile;
}

// ── User profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id:            string;
  fullName:      string;
  email:         string;
  role:          UserRole;
  organisation?: string;
  createdAt:     string;
}

// ── Token payload (decoded JWT claims) ───────────────────────────────────────

export interface TokenClaims {
  sub:   string;        // user id
  email: string;
  role:  UserRole;
  exp:   number;        // unix timestamp
  iat:   number;
}

// ── API error shape (RFC 7807 / application/problem+json) ─────────────────────

export interface ApiProblem {
  type:          string;
  title:         string;
  status:        number;
  detail:        string;
  errorCode:     string;
  correlationId: string;
  fieldErrors?:  { field: string; message: string }[];
}
