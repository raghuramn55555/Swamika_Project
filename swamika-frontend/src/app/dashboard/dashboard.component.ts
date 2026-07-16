import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../core/services/auth.service';

type DocStatus = 'READY' | 'WARNING' | 'FAILED' | 'PROCESSING' | 'RECEIVED';
type ServiceStatus = 'UP' | 'DOWN' | 'DEGRADED';

interface StatCard {
  label:    string;
  value:    number;
  icon:     string;
  color:    string;
  bg:       string;
  delta?:   string;
  up?:      boolean;
}

interface RecentUpload {
  ref:      string;
  file:     string;
  status:   DocStatus;
  progress?: number;
  ago:      string;
}

interface RecentSearch {
  id:       string;
  query:    string;
  date:     string;
  results:  number;
  blind:    boolean;
}

interface ServiceHealth {
  name:     string;
  status:   ServiceStatus;
  detail:   string;
}

interface Notification {
  icon:    string;
  color:   string;
  message: string;
  time:    string;
}

@Component({
  selector: 'sw-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressBarModule, MatTooltipModule,
  ],
  template: `
  <div class="sw-page dash">

    <!-- ── Welcome bar ───────────────────────────────────────────────────── -->
    <div class="welcome-bar">
      <div>
        <h2 class="welcome-title">Good day, {{ firstName() }}</h2>
        <p class="welcome-sub">Here is your recruitment workspace overview.</p>
      </div>
      <div class="welcome-actions">
        <a mat-stroked-button color="primary" routerLink="/cv-library">
          <mat-icon>upload_file</mat-icon> Upload CVs
        </a>
        <a mat-raised-button color="primary" routerLink="/search">
          <mat-icon>manage_search</mat-icon> New Search
        </a>
      </div>
    </div>

    <!-- ── Stat cards ─────────────────────────────────────────────────────── -->
    <div class="stats-grid">
      @for (s of stats; track s.label) {
        <div class="stat-card sw-card">
          <div class="stat-icon" [style.background]="s.bg">
            <mat-icon [style.color]="s.color">{{ s.icon }}</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
          @if (s.delta) {
            <div class="stat-delta" [class.up]="s.up" [class.down]="!s.up">
              <mat-icon>{{ s.up ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              {{ s.delta }}
            </div>
          }
        </div>
      }
    </div>

    <!-- ── Main grid ──────────────────────────────────────────────────────── -->
    <div class="main-grid">

      <!-- Recent Uploads ───────────────────────────────────────────────────── -->
      <section class="sw-card upload-card">
        <div class="card-head">
          <div class="card-title-row">
            <mat-icon class="card-icon">upload_file</mat-icon>
            <span class="card-title">Recent Uploads</span>
          </div>
          <a mat-button color="primary" routerLink="/cv-library" class="card-link">
            View all <mat-icon>chevron_right</mat-icon>
          </a>
        </div>
        <mat-divider></mat-divider>

        <div class="upload-list">
          @for (u of recentUploads; track u.ref) {
            <div class="upload-row">
              <mat-icon class="upload-file-icon">description</mat-icon>
              <div class="upload-info">
                <span class="upload-ref">{{ u.ref }}</span>
                <span class="upload-ago">{{ u.ago }}</span>
              </div>
              @if (u.status === 'PROCESSING' && u.progress !== undefined) {
                <div class="upload-progress">
                  <mat-progress-bar mode="determinate" [value]="u.progress"
                                    color="primary"></mat-progress-bar>
                  <span class="prog-pct">{{ u.progress }}%</span>
                </div>
              } @else {
                <span class="status-badge"
                      [class.s-ready]="u.status === 'READY'"
                      [class.s-warning]="u.status === 'WARNING'"
                      [class.s-failed]="u.status === 'FAILED'"
                      [class.s-proc]="u.status === 'PROCESSING' || u.status === 'RECEIVED'">
                  <mat-icon>{{ statusIcon(u.status) }}</mat-icon>
                  {{ u.status }}
                </span>
              }
            </div>
          }
        </div>
      </section>

      <!-- Recent Searches ──────────────────────────────────────────────────── -->
      <section class="sw-card search-card">
        <div class="card-head">
          <div class="card-title-row">
            <mat-icon class="card-icon">manage_search</mat-icon>
            <span class="card-title">Recent Searches</span>
          </div>
          <a mat-button color="primary" routerLink="/search" class="card-link">
            New search <mat-icon>chevron_right</mat-icon>
          </a>
        </div>
        <mat-divider></mat-divider>

        <div class="search-list">
          @for (s of recentSearches; track s.id) {
            <div class="search-row">
              <div class="search-info">
                <span class="search-query">{{ s.query }}</span>
                <div class="search-meta">
                  <span>{{ s.date }}</span>
                  <span class="meta-dot">·</span>
                  <span>{{ s.results }} candidates</span>
                  @if (s.blind) {
                    <span class="blind-tag">
                      <mat-icon>visibility_off</mat-icon> Blind
                    </span>
                  }
                </div>
              </div>
              <button mat-icon-button matTooltip="Re-run" aria-label="Re-run search">
                <mat-icon>replay</mat-icon>
              </button>
            </div>
          }
        </div>
      </section>

      <!-- System Health ────────────────────────────────────────────────────── -->
      <section class="sw-card health-card">
        <div class="card-head">
          <div class="card-title-row">
            <mat-icon class="card-icon">monitor_heart</mat-icon>
            <span class="card-title">System Health</span>
          </div>
          <span class="health-ts">Checked just now</span>
        </div>
        <mat-divider></mat-divider>

        <div class="health-list">
          @for (h of healthItems; track h.name) {
            <div class="health-row">
              <div class="health-dot"
                   [class.dot-up]="h.status === 'UP'"
                   [class.dot-deg]="h.status === 'DEGRADED'"
                   [class.dot-dn]="h.status === 'DOWN'">
              </div>
              <div class="health-info">
                <span class="health-name">{{ h.name }}</span>
                <span class="health-detail">{{ h.detail }}</span>
              </div>
              <span class="health-label"
                    [class.hl-up]="h.status === 'UP'"
                    [class.hl-deg]="h.status === 'DEGRADED'"
                    [class.hl-dn]="h.status === 'DOWN'">
                {{ h.status === 'UP' ? 'Operational' : h.status === 'DEGRADED' ? 'Degraded' : 'Down' }}
              </span>
            </div>
          }
        </div>
      </section>

      <!-- Quick Actions ────────────────────────────────────────────────────── -->
      <section class="sw-card actions-card">
        <div class="card-head">
          <div class="card-title-row">
            <mat-icon class="card-icon">bolt</mat-icon>
            <span class="card-title">Quick Actions</span>
          </div>
        </div>
        <mat-divider></mat-divider>

        <div class="actions-grid">
          @for (a of quickActions; track a.label) {
            <a mat-stroked-button [routerLink]="a.route" class="action-btn"
               [attr.aria-label]="a.label">
              <mat-icon>{{ a.icon }}</mat-icon>
              <span>{{ a.label }}</span>
            </a>
          }
        </div>
      </section>

      <!-- Notifications ───────────────────────────────────────────────────── -->
      <section class="sw-card notif-card">
        <div class="card-head">
          <div class="card-title-row">
            <mat-icon class="card-icon">notifications</mat-icon>
            <span class="card-title">Notifications</span>
          </div>
          <span class="notif-badge">{{ notifications.length }}</span>
        </div>
        <mat-divider></mat-divider>

        <div class="notif-list">
          @for (n of notifications; track n.message) {
            <div class="notif-row">
              <div class="notif-icon-wrap" [style.background]="n.color + '22'">
                <mat-icon [style.color]="n.color">{{ n.icon }}</mat-icon>
              </div>
              <div class="notif-body">
                <span class="notif-msg">{{ n.message }}</span>
                <span class="notif-time">{{ n.time }}</span>
              </div>
            </div>
          }
        </div>
      </section>

    </div>
  </div>
  `,
  styles: [`
    .dash { padding-bottom: 48px; }

    // ── Welcome bar ───────────────────────────────────────────────────────────
    .welcome-bar {
      display: flex; align-items: flex-start;
      justify-content: space-between; flex-wrap: wrap;
      gap: 16px; margin-bottom: 28px;
    }
    .welcome-title {
      font-size: 1.55rem; font-weight: 700; color: var(--sw-text);
    }
    .welcome-sub { color: var(--sw-text-muted); font-size: 0.875rem; margin-top: 4px; }
    .welcome-actions {
      display: flex; gap: 12px; flex-wrap: wrap;
      a { display: flex; align-items: center; gap: 6px; border-radius: 8px; }
    }

    // ── Stat cards ────────────────────────────────────────────────────────────
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    .stat-card {
      display: flex; align-items: center; gap: 16px; padding: 20px;
    }
    .stat-icon {
      width: 50px; height: 50px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }
    .stat-body { flex: 1; display: flex; flex-direction: column; }
    .stat-value {
      font-size: 1.9rem; font-weight: 700;
      line-height: 1; color: var(--sw-text);
    }
    .stat-label { font-size: 0.78rem; color: var(--sw-text-muted); margin-top: 4px; }
    .stat-delta {
      font-size: 0.72rem; font-weight: 600;
      display: flex; align-items: center; gap: 2px; align-self: flex-start;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
      &.up   { color: #43a047; }
      &.down { color: #e53935; }
    }

    // ── Main grid ─────────────────────────────────────────────────────────────
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 20px;
      @media (max-width: 920px) { grid-template-columns: 1fr; }
    }

    // Span notifications full width at bottom
    .notif-card { grid-column: 1 / -1; }

    // ── Shared card styles ────────────────────────────────────────────────────
    .card-head {
      display: flex; align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
    }
    .card-title-row {
      display: flex; align-items: center; gap: 8px;
    }
    .card-icon {
      font-size: 20px; width: 20px; height: 20px;
      color: var(--sw-primary);
    }
    .card-title {
      font-size: 0.95rem; font-weight: 600; color: var(--sw-text);
    }
    .card-link {
      font-size: 0.8rem;
      display: flex; align-items: center;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    // ── Recent uploads ────────────────────────────────────────────────────────
    .upload-list { display: flex; flex-direction: column; gap: 2px; margin-top: 12px; }
    .upload-row {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 0;
      border-bottom: 1px solid var(--sw-border);
      &:last-child { border-bottom: none; }
    }
    .upload-file-icon {
      font-size: 20px; width: 20px; height: 20px;
      color: var(--sw-text-muted); flex-shrink: 0;
    }
    .upload-info { flex: 1; display: flex; flex-direction: column; }
    .upload-ref  { font-size: 0.85rem; font-weight: 500; color: var(--sw-text); font-family: monospace; }
    .upload-ago  { font-size: 0.73rem; color: var(--sw-text-muted); }
    .upload-progress {
      display: flex; align-items: center; gap: 8px; min-width: 110px;
      mat-progress-bar { flex: 1; }
    }
    .prog-pct { font-size: 0.72rem; color: var(--sw-text-muted); white-space: nowrap; }

    // Status badge
    .status-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 20px;
      font-size: 0.71rem; font-weight: 600;
      white-space: nowrap;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }

      &.s-ready   { background: #e8f5e9; color: #2e7d32; }
      &.s-warning { background: #fff8e1; color: #f57f17; }
      &.s-failed  { background: #ffebee; color: #c62828; }
      &.s-proc    { background: #e3f2fd; color: #1565c0; }

      .dark-theme & {
        &.s-ready   { background: #1a3a1f; color: #a5d6a7; }
        &.s-warning { background: #3e2f00; color: #ffe082; }
        &.s-failed  { background: #3e0a0a; color: #ef9a9a; }
        &.s-proc    { background: #0d2137; color: #90caf9; }
      }
    }

    // ── Recent searches ───────────────────────────────────────────────────────
    .search-list { display: flex; flex-direction: column; margin-top: 12px; }
    .search-row {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 0;
      border-bottom: 1px solid var(--sw-border);
      &:last-child { border-bottom: none; }
    }
    .search-info { flex: 1; }
    .search-query { display: block; font-size: 0.85rem; font-weight: 500; color: var(--sw-text); }
    .search-meta {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      font-size: 0.73rem; color: var(--sw-text-muted); margin-top: 2px;
    }
    .meta-dot { opacity: 0.4; }
    .blind-tag {
      display: inline-flex; align-items: center; gap: 3px;
      background: #e3f2fd; color: #1565c0;
      padding: 1px 7px; border-radius: 10px;
      font-size: 0.7rem; font-weight: 600;
      mat-icon { font-size: 11px; width: 11px; height: 11px; }
      .dark-theme & { background: #0d2137; color: #90caf9; }
    }

    // ── System health ─────────────────────────────────────────────────────────
    .health-ts { font-size: 0.73rem; color: var(--sw-text-muted); }
    .health-list { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
    .health-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--sw-border);
      &:last-child { border-bottom: none; }
    }
    .health-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      &.dot-up  { background: #43a047; box-shadow: 0 0 0 3px rgba(67,160,71,0.2); }
      &.dot-deg { background: #fb8c00; box-shadow: 0 0 0 3px rgba(251,140,0,0.2); }
      &.dot-dn  { background: #e53935; box-shadow: 0 0 0 3px rgba(229,57,53,0.2); }
    }
    .health-info { flex: 1; }
    .health-name   { display: block; font-size: 0.85rem; font-weight: 500; color: var(--sw-text); }
    .health-detail { font-size: 0.72rem; color: var(--sw-text-muted); }
    .health-label {
      font-size: 0.72rem; font-weight: 600;
      &.hl-up  { color: #43a047; }
      &.hl-deg { color: #fb8c00; }
      &.hl-dn  { color: #e53935; }
    }

    // ── Quick actions ─────────────────────────────────────────────────────────
    .actions-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 10px; margin-top: 12px;
    }
    .action-btn {
      height: 68px; border-radius: 10px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 5px;
      font-size: 0.78rem;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }

    // ── Notifications ─────────────────────────────────────────────────────────
    .notif-badge {
      background: var(--sw-primary); color: #fff;
      font-size: 0.7rem; font-weight: 700;
      border-radius: 10px; padding: 1px 7px;
    }
    .notif-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 10px; margin-top: 12px;
    }
    .notif-row {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px;
      background: var(--sw-bg);
      border: 1px solid var(--sw-border);
      border-radius: 10px;
    }
    .notif-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .notif-body { display: flex; flex-direction: column; }
    .notif-msg  { font-size: 0.83rem; color: var(--sw-text); line-height: 1.4; }
    .notif-time { font-size: 0.72rem; color: var(--sw-text-muted); margin-top: 3px; }
  `],
})
export class DashboardComponent {
  private auth = inject(AuthService);

  firstName = computed(() => this.auth.firstName());

  stats: StatCard[] = [
    { label: 'Total CVs',         value: 247, icon: 'description',   color: '#3949ab', bg: '#e8eaf6', delta: '+12 this week', up: true  },
    { label: 'Ready to Search',   value: 231, icon: 'check_circle',  color: '#43a047', bg: '#e8f5e9', delta: '+10 this week', up: true  },
    { label: 'Warnings',          value: 9,   icon: 'warning',       color: '#f57f17', bg: '#fff8e1'                                     },
    { label: 'Failed',            value: 7,   icon: 'error',         color: '#e53935', bg: '#ffebee'                                     },
    { label: 'Active Shortlists', value: 5,   icon: 'bookmark',      color: '#00897b', bg: '#e0f2f1', delta: '+2 this week',  up: true  },
    { label: 'Searches Today',    value: 14,  icon: 'saved_search',  color: '#6a1b9a', bg: '#f3e5f5', delta: '+3 vs yesterday',up: true  },
  ];

  recentUploads: RecentUpload[] = [
    { ref: 'CV-1042', file: 'john_doe.pdf',         status: 'READY',      ago: '2 min ago'   },
    { ref: 'CV-1043', file: 'senior_java_dev.pdf',  status: 'PROCESSING', progress: 62, ago: 'Just now' },
    { ref: 'CV-1044', file: 'maria_smith.docx',     status: 'READY',      ago: '15 min ago'  },
    { ref: 'CV-1045', file: 'damaged_scan.pdf',     status: 'FAILED',     ago: '1 hr ago'    },
    { ref: 'CV-1046', file: 'cv_angular_dev.pdf',   status: 'WARNING',    ago: '2 hr ago'    },
  ];

  recentSearches: RecentSearch[] = [
    { id: 's1', query: 'Senior Java Engineer — Spring Boot & PostgreSQL', date: 'Today',      results: 18, blind: true  },
    { id: 's2', query: 'Angular developer 3+ years TypeScript',          date: 'Yesterday',  results: 9,  blind: false },
    { id: 's3', query: 'DevOps engineer — Kubernetes & CI/CD',           date: '2 days ago', results: 7,  blind: true  },
    { id: 's4', query: 'Product Manager with fintech background',        date: '3 days ago', results: 12, blind: false },
  ];

  healthItems: ServiceHealth[] = [
    { name: 'PostgreSQL + pgvector', status: 'UP',       detail: 'Structured, FTS and vector store'      },
    { name: 'Embedding service',     status: 'UP',       detail: 'Semantic ranking available'            },
    { name: 'LLM extraction',        status: 'DEGRADED', detail: 'Fallback to deterministic parser'      },
    { name: 'Document storage',      status: 'UP',       detail: 'PDF / DOCX upload storage'             },
    { name: 'Background processing', status: 'UP',       detail: 'Ingestion queue running'               },
  ];

  quickActions = [
    { label: 'Upload CV',       icon: 'upload_file',          route: '/cv-library'  },
    { label: 'New Search',      icon: 'manage_search',        route: '/search'      },
    { label: 'CV Library',      icon: 'folder_shared',        route: '/cv-library'  },
    { label: 'Team Composer',   icon: 'group_work',           route: '/team'        },
    { label: 'Shortlists',      icon: 'bookmark',             route: '/shortlists'  },
    { label: 'Administration',  icon: 'admin_panel_settings', route: '/admin'       },
  ];

  notifications: Notification[] = [
    { icon: 'check_circle', color: '#43a047', message: '12 CVs processed and ready to search.',                 time: '5 min ago'    },
    { icon: 'warning',      color: '#f57f17', message: 'CV-1046 has low parsing quality — OCR may be required.', time: '2 hr ago'    },
    { icon: 'info',         color: '#1565c0', message: 'LLM extraction service is degraded. Using deterministic parser.', time: '3 hr ago' },
    { icon: 'delete',       color: '#e53935', message: 'Candidate CV-1039 deleted by Admin — audit logged.',    time: 'Yesterday'    },
  ];

  statusIcon(s: DocStatus): string {
    const m: Record<DocStatus, string> = {
      READY: 'check_circle', WARNING: 'warning',
      FAILED: 'error', PROCESSING: 'hourglass_top', RECEIVED: 'inbox',
    };
    return m[s];
  }
}
