import { Component, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { CvService, UploadProgress } from '../../core/services/cv.service';
import { UserRole } from '../../core/models/user.models';
import { ScoreMeterComponent } from '../index';

type View = 'dashboard'|'library'|'search'|'results'|'team'|'shortlists'|'admin';

const TITLES: Record<View, [string, string]> = {
  dashboard:  ['Dashboard',      'Processing summary, recent searches and service health'],
  library:    ['CV Library',     'Upload, batch status, profiles, reprocess and delete'],
  search:     ['Search',         'Natural-language, vacancy and structured criteria'],
  results:    ['Results',        'Ranked candidates with evidence and confidence'],
  team:       ['Team Composer',  'Propose a team maximizing combined coverage'],
  shortlists: ['Shortlists',     'Saved candidates, notes, statuses and export'],
  admin:      ['Administration', 'Aliases, models, thresholds, retention and audit'],
};

/**
 * Which roles can see each nav item — sourced from the SRS Role Behavior table.
 *
 * ADMINISTRATOR  — everything
 * RECRUITER      — all except admin
 * REVIEWER       — dashboard, search, results, shortlists (view shared)
 * AUDITOR        — dashboard, admin (audit trail only)
 */
const NAV_ROLES: Record<View, UserRole[]> = {
  dashboard:  ['ADMINISTRATOR','RECRUITER','REVIEWER','AUDITOR'],
  library:    ['ADMINISTRATOR','RECRUITER'],
  search:     ['ADMINISTRATOR','RECRUITER','REVIEWER'],
  results:    ['ADMINISTRATOR','RECRUITER','REVIEWER'],
  team:       ['ADMINISTRATOR','RECRUITER'],
  shortlists: ['ADMINISTRATOR','RECRUITER','REVIEWER'],
  admin:      ['ADMINISTRATOR','AUDITOR'],
};

@Component({
  selector: 'sw-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, ScoreMeterComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
})
export class ShellComponent {
  auth    = inject(AuthService);
  theme   = inject(ThemeService);
  private cvSvc = inject(CvService);

  // ── Navigation ────────────────────────────────────────────────────────────
  activeView = signal<View>('dashboard');

  get title()    { return TITLES[this.activeView()][0]; }
  get subtitle() { return TITLES[this.activeView()][1]; }

  goto(v: View) { this.activeView.set(v); window.scrollTo(0, 0); }

  /** Returns true if the current user's role is allowed to see this nav item */
  canSee(view: View): boolean {
    const role = this.auth.currentUser()?.role;
    if (!role) return false;
    return NAV_ROLES[view].includes(role);
  }

  // ── Blind mode ────────────────────────────────────────────────────────────
  blindMode = signal(false);
  toggleBlind() { this.blindMode.update(b => !b); }

  // ── Evidence drawer ───────────────────────────────────────────────────────
  drawerOpen = signal(false);
  openDrawer()  { this.drawerOpen.set(true); }
  closeDrawer() { this.drawerOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEsc() { this.closeDrawer(); }

  // ── Search view ───────────────────────────────────────────────────────────
  activeTab       = signal('vacancy');
  activeFilter    = signal('all');
  compareCount    = signal(0);
  criteriaVisible = false;

  vacancyText = `We are hiring a Senior Backend Engineer to lead our Java/Spring Boot services. Must have 5+ years with Spring Boot and PostgreSQL, strong REST API design, and experience with Docker. French language skills preferred. Based in Lyon, hybrid.`;

  criteria = [
    { type: 'must', name: 'Spring Boot — 5+ years', weight: 90 },
    { type: 'must', name: 'PostgreSQL',              weight: 80 },
    { type: 'must', name: 'REST API design',         weight: 75 },
    { type: 'pref', name: 'Docker',                  weight: 50 },
    { type: 'pref', name: 'French language',         weight: 35 },
    { type: 'pref', name: 'Location — Lyon (hybrid)',weight: 30 },
  ];

  extractCriteria() { this.criteriaVisible = true; }

  setTab(t: string)    { this.activeTab.set(t); this.criteriaVisible = false; }
  setFilter(f: string) { this.activeFilter.set(f); }

  onCompareChange(checked: boolean) {
    this.compareCount.update(n => checked ? n + 1 : Math.max(0, n - 1));
  }

  // ── Team Composer ─────────────────────────────────────────────────────────
  teamSize     = '4';
  teamBase     = 'Senior Java / Spring Boot engineer (last search)';
  teamProposed = false;

  proposeTeam() { this.teamProposed = true; }

  teamRows = [
    { ref: 'CV-1042', contrib: 'Spring Boot, PostgreSQL, REST', cov: '+41%', badge: 'ready', label: 'Locked'   },
    { ref: 'CV-1078', contrib: 'Java, REST, CI/CD',             cov: '+27%', badge: 'ready', label: 'Included' },
    { ref: 'CV-1120', contrib: 'Docker, Cloud infra',           cov: '+18%', badge: 'ready', label: 'Included' },
    { ref: 'CV-1156', contrib: 'French, client-facing delivery',cov: '+6%',  badge: 'warn',  label: 'Gap: PostgreSQL depth' },
  ];

  // ── Upload state ──────────────────────────────────────────────────────────
  uploadQueue   = signal<UploadProgress[]>([]);
  isDragging    = signal(false);
  uploadError   = signal('');

  /**
   * Called when user selects files via the file input or drops them.
   * Single file → POST /api/v1/cvs with progress tracking.
   * Multiple files → POST /api/v1/cvs/bulk (one request, per-file outcomes).
   */
  handleFiles(files: FileList | File[]): void {
    const list = Array.from(files).filter(f =>
      f.type === 'application/pdf' ||
      f.name.toLowerCase().endsWith('.docx') ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (!list.length) {
      this.uploadError.set('Only PDF and DOCX files are accepted.');
      return;
    }
    this.uploadError.set('');

    if (list.length === 1) {
      // Single upload — show per-byte progress
      const initial: UploadProgress = { filename: list[0].name, progress: 0, status: 'uploading' };
      this.uploadQueue.update(q => [initial, ...q]);

      this.cvSvc.uploadOne(list[0]).subscribe({
        next: prog => {
          this.uploadQueue.update(q =>
            q.map(r => r.filename === prog.filename ? prog : r)
          );
        },
        error: (prog: UploadProgress) => {
          this.uploadQueue.update(q =>
            q.map(r => r.filename === prog.filename ? prog : r)
          );
        },
      });

    } else {
      // Bulk upload — add placeholders then replace with server outcomes
      const placeholders: UploadProgress[] = list.map(f => ({
        filename: f.name, progress: 50, status: 'uploading',
      }));
      this.uploadQueue.update(q => [...placeholders, ...q]);

      this.cvSvc.uploadBulk(list).subscribe({
        next: bulk => {
          // Mark each file with its outcome
          const byName = new Map<string, UploadProgress>();
          for (const r of bulk.accepted) {
            byName.set(r.filename, { filename: r.filename, progress: 100, status: 'done', result: r });
          }
          for (const d of bulk.duplicates) {
            byName.set(d.filename, { filename: d.filename, progress: 100, status: 'error', errorMsg: 'Duplicate — already in library.' });
          }
          for (const f of bulk.failed) {
            byName.set(f.filename, { filename: f.filename, progress: 0, status: 'error', errorMsg: f.reason });
          }
          this.uploadQueue.update(q =>
            q.map(r => byName.get(r.filename) ?? r)
          );
        },
        error: (err: Error) => {
          this.uploadError.set(err.message);
          this.uploadQueue.update(q =>
            q.map(r => list.some(f => f.name === r.filename)
              ? { ...r, status: 'error', errorMsg: 'Upload failed.' }
              : r
            )
          );
        },
      });
    }
  }

  onFileInput(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) this.handleFiles(files);
    (event.target as HTMLInputElement).value = ''; // reset so same file can be re-selected
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files.length) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  clearUpload(filename: string): void {
    this.uploadQueue.update(q => q.filter(r => r.filename !== filename));
  }

  statusLabel(p: UploadProgress): string {
    if (p.status === 'uploading') return `${p.progress}%`;
    if (p.status === 'processing') return 'Processing…';
    if (p.status === 'done') return p.result?.status ?? 'READY';
    if (p.status === 'error') return p.errorMsg ?? 'Failed';
    return '';
  }

  badgeClass(p: UploadProgress): string {
    if (p.status === 'error') return 'failed';
    if (p.status === 'done') {
      const s = p.result?.status;
      if (s === 'READY') return 'ready';
      if (s === 'WARNING') return 'warn';
      if (s === 'FAILED') return 'failed';
      return 'processing';
    }
    return 'processing';
  }

  // ── Results data ──────────────────────────────────────────────────────────
  results = [
    {
      ref:     'CV-1042',
      role:    'Current role: Senior Java Engineer · Relevant experience: 7.4 yrs',
      match:   89, confidence: 82, parseQuality: 'High', parseWidth: 95,
      matched: ['Java', 'Spring Boot', 'PostgreSQL', 'REST'],
      missing: [] as string[],
      unverified: [] as string[],
      gaps:    ['French'],
      evidenceBorder: '',
      evidencePgStyle: '',
      evidencePg:   'Pg 2',
      evidenceText: '"Migrated twelve services to Spring Boot 3.2…"',
      weak: false,
    },
    {
      ref:     'CV-1078',
      role:    'Current role: Backend Developer · Relevant experience: 4.1 yrs',
      match:   71, confidence: 64, parseQuality: 'Medium', parseWidth: 60,
      matched: ['Java', 'Spring Boot', 'REST'],
      missing: ['PostgreSQL'],
      unverified: [] as string[],
      gaps:    ['Docker', 'French'],
      evidenceBorder: '',
      evidencePgStyle: '',
      evidencePg:   'Pg 1',
      evidenceText: '"Built REST services using Spring Boot; database layer used MySQL."',
      weak: false,
    },
    {
      ref:     'CV-1101',
      role:    'Current role: Software Engineer · Relevant experience: 3.0 yrs',
      match:   58, confidence: 41, parseQuality: 'Low', parseWidth: 35,
      matched: ['Java'],
      missing: ['PostgreSQL'],
      unverified: ['Spring Boot (self-listed, no evidence)'],
      gaps:    [] as string[],
      evidenceBorder: 'border-left-color:var(--amber)',
      evidencePgStyle: 'background:var(--amber-soft);color:var(--amber)',
      evidencePg:   'Weak',
      evidenceText: 'Skill listed in summary keywords only — no supporting project text found.',
      weak: true,
    },
  ];

  // ── Upload progress rows ───────────────────────────────────────────────────
  uploads = [
    { name: 'A_Rahman_CV.pdf',    badge: 'ready',      badgeText: 'Ready',       meta: '1.2 MB · structuring complete',           barW: '100%', barColor: '' },
    { name: 'K_Ito_Resume.docx',  badge: 'processing', badgeText: 'Embedding',   meta: '640 KB · generating vectors',              barW: '64%',  barColor: '' },
    { name: 'scan_0091.pdf',      badge: 'warn',       badgeText: 'OCR required',meta: 'Insufficient extractable text',            barW: '100%', barColor: 'var(--amber)' },
    { name: 'CV_corrupted.docx',  badge: 'failed',     badgeText: 'Failed',      meta: 'Unreadable file — retry or replace',       barW: '100%', barColor: 'var(--red)' },
  ];

  // ── Library rows ───────────────────────────────────────────────────────────
  library = [
    { ref: 'CV-1042', title: 'Senior Java Engineer', badge: 'ready',  badgeText: 'Ready',   uploaded: 'Today',     quality: 'High',   canRetry: false },
    { ref: 'CV-1043', title: 'Frontend Developer',   badge: 'ready',  badgeText: 'Ready',   uploaded: 'Today',     quality: 'High',   canRetry: false },
    { ref: 'CV-1044', title: 'Data Engineer',        badge: 'warn',   badgeText: 'Warning', uploaded: 'Yesterday', quality: 'Medium', canRetry: false },
    { ref: 'CV-1039', title: 'QA Engineer',          badge: 'failed', badgeText: 'Failed',  uploaded: '2 days ago',quality: '—',      canRetry: true  },
  ];

  // ── Service health ────────────────────────────────────────────────────────
  health = [
    { name: 'Document parser',    badge: 'ready', text: 'Operational' },
    { name: 'Embedding service',  badge: 'ready', text: 'Operational' },
    { name: 'LLM extraction',     badge: 'warn',  text: 'Degraded'    },
    { name: 'Search index',       badge: 'ready', text: 'Operational' },
  ];

  // ── Recent searches (dashboard) ───────────────────────────────────────────
  recentSearches = [
    { query: 'Senior Java / Spring Boot engineer',   mode: 'Vacancy',          count: 34, blind: 'On',  ago: '12 min ago' },
    { query: '"React developer with AWS and CI/CD"', mode: 'Natural language', count: 19, blind: 'Off', ago: '1 hr ago'   },
    { query: 'Skills: Python, Django, PostgreSQL',   mode: 'Structured',       count: 27, blind: 'Off', ago: 'Yesterday'  },
  ];

  // ── Shortlists ────────────────────────────────────────────────────────────
  slStatus = ['Shortlisted', 'Interviewing', 'On hold', 'Rejected'];

  sl = [
    { ref: 'CV-1042', score: '89%', status: 'Shortlisted',  note: 'Strong fit, fast follow-up' },
    { ref: 'CV-1078', score: '71%', status: 'Interviewing', note: 'Needs PostgreSQL screen'     },
    { ref: 'CV-1120', score: '66%', status: 'On hold',      note: '—'                           },
  ];

  removeFromShortlist(ref: string) {
    this.sl = this.sl.filter(r => r.ref !== ref);
  }

  exportShortlist() {
    alert('Export will be wired to POST /api/v1/shortlists/{id}/export.');
  }
}
