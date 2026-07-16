import { Component, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

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

@Component({
  selector: 'sw-shell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);

  // ── Navigation ────────────────────────────────────────────────────────────
  activeView = signal<View>('dashboard');

  get title()    { return TITLES[this.activeView()][0]; }
  get subtitle() { return TITLES[this.activeView()][1]; }

  goto(v: View) {
    this.activeView.set(v);
    window.scrollTo(0, 0);
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
  activeTab     = signal('vacancy');
  activeFilter  = signal('all');
  compareCount  = signal(0);
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

  extractCriteria() {
    this.criteriaVisible = true;
  }

  setTab(t: string)    { this.activeTab.set(t); this.criteriaVisible = false; }
  setFilter(f: string) { this.activeFilter.set(f); }

  onCompareChange(checked: boolean) {
    this.compareCount.update(n => checked ? n + 1 : Math.max(0, n - 1));
  }

  // ── Team Composer ─────────────────────────────────────────────────────────
  teamSize    = '4';
  teamBase    = 'Senior Java / Spring Boot engineer (last search)';
  teamProposed = false;

  proposeTeam() { this.teamProposed = true; }

  teamRows = [
    { ref: 'CV-1042', contrib: 'Spring Boot, PostgreSQL, REST', cov: '+41%', badge: 'ready', label: 'Locked'   },
    { ref: 'CV-1078', contrib: 'Java, REST, CI/CD',             cov: '+27%', badge: 'ready', label: 'Included' },
    { ref: 'CV-1120', contrib: 'Docker, Cloud infra',           cov: '+18%', badge: 'ready', label: 'Included' },
    { ref: 'CV-1156', contrib: 'French, client-facing delivery',cov: '+6%',  badge: 'warn',  label: 'Gap: PostgreSQL depth' },
  ];

  // ── Shortlists ────────────────────────────────────────────────────────────
  slStatus = ['Shortlisted', 'Interviewing', 'On hold', 'Rejected'];

  sl = [
    { ref: 'CV-1042', score: '89%', status: 'Shortlisted',  note: 'Strong fit, fast follow-up'   },
    { ref: 'CV-1078', score: '71%', status: 'Interviewing', note: 'Needs PostgreSQL screen'       },
    { ref: 'CV-1120', score: '66%', status: 'On hold',      note: '—'                             },
  ];

  removeFromShortlist(ref: string) {
    this.sl = this.sl.filter(r => r.ref !== ref);
  }

  exportShortlist() {
    alert('Export functionality will be connected to the backend API (POST /api/v1/shortlists/{id}/export).');
  }
}
