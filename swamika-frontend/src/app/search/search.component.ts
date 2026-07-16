import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

interface Requirement {
  label: string;
  type: 'MUST' | 'PREFERRED' | 'BONUS';
  importance: number;
  minYears?: number;
}

interface SearchResult {
  ref: string;
  rank: number;
  matchScore: number;
  confidenceScore: number;
  parsingQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  currentRole: string;
  relevantYears: number;
  matched: string[];
  missing: string[];
  topEvidence: string;
  evidencePage: number;
}

@Component({
  selector: 'sw-search',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTabsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSliderModule,
    MatSelectModule, MatSlideToggleModule, MatChipsModule,
    MatTooltipModule, MatProgressSpinnerModule,
    MatDividerModule, MatExpansionModule,
  ],
  template: `
    <div class="sw-page search-page">
      <h2 class="page-title">Search Candidates</h2>

      <div class="search-layout">

        <!-- ── Left: Search builder panel ──────────────────────────────────── -->
        <aside class="builder-panel sw-card">
          <mat-tab-group [selectedIndex]="tabIndex()" (selectedIndexChange)="tabIndex.set($event)"
                         animationDuration="200ms">

            <!-- Natural language tab -->
            <mat-tab label="Natural Language">
              <div class="tab-body">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Describe what you need</mat-label>
                  <textarea matInput [(ngModel)]="nlQuery" rows="4"
                            placeholder="e.g. Senior Java engineer with 5+ years Spring Boot, PostgreSQL, familiar with microservices…"></textarea>
                </mat-form-field>
              </div>
            </mat-tab>

            <!-- Vacancy / JD tab -->
            <mat-tab label="Vacancy / JD">
              <div class="tab-body">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Paste job description</mat-label>
                  <textarea matInput [(ngModel)]="jdText" rows="6"
                            placeholder="Paste the full job description here. The system will extract criteria automatically."></textarea>
                </mat-form-field>
                <button mat-stroked-button color="accent" (click)="extractFromJD()" [disabled]="!jdText">
                  <mat-icon>auto_fix_high</mat-icon> Extract criteria
                </button>
              </div>
            </mat-tab>

            <!-- Structured tab -->
            <mat-tab label="Structured">
              <div class="tab-body">
                <p class="hint-text">Define skill requirements and weights manually.</p>
              </div>
            </mat-tab>

          </mat-tab-group>

          <!-- Requirements list -->
          <div class="requirements-section">
            <div class="req-header">
              <span class="sw-section-title">Requirements</span>
              <button mat-icon-button color="primary" (click)="addRequirement()"
                      matTooltip="Add requirement" aria-label="Add requirement">
                <mat-icon>add_circle</mat-icon>
              </button>
            </div>

            @for (req of requirements; track req.label; let i = $index) {
              <div class="req-row">
                <span class="req-type-badge" [class]="'rt-' + req.type.toLowerCase()">
                  {{ req.type }}
                </span>
                <span class="req-label">{{ req.label }}</span>
                @if (req.minYears) {
                  <span class="req-years">{{ req.minYears }}y+</span>
                }
                <div class="req-importance">
                  <mat-slider min="0" max="1" step="0.1" discrete class="imp-slider"
                              [attr.aria-label]="'Importance for ' + req.label">
                    <input matSliderThumb [(ngModel)]="req.importance" />
                  </mat-slider>
                  <span class="imp-val">{{ (req.importance * 100).toFixed(0) }}%</span>
                </div>
                <button mat-icon-button (click)="removeReq(i)"
                        [attr.aria-label]="'Remove ' + req.label">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>

          <mat-divider></mat-divider>

          <!-- Options -->
          <div class="options-section">
            <div class="option-row">
              <span>Blind mode</span>
              <mat-slide-toggle [(ngModel)]="blindMode" color="primary"
                                aria-label="Enable blind mode ranking">
              </mat-slide-toggle>
            </div>
            @if (blindMode) {
              <p class="blind-note">
                <mat-icon>visibility_off</mat-icon>
                Identity fields excluded from results and logs.
              </p>
            }

            <mat-form-field appearance="outline" class="full-width mt-12">
              <mat-label>Max results</mat-label>
              <mat-select [(ngModel)]="pageSize">
                <mat-option [value]="10">10</mat-option>
                <mat-option [value]="20">20</mat-option>
                <mat-option [value]="50">50</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <button mat-raised-button color="primary" class="search-btn"
                  (click)="runSearch()" [disabled]="searching()">
            @if (searching()) {
              <ng-container>
                <mat-spinner diameter="20" color="accent"></mat-spinner>
              </ng-container>
            } @else {
              <ng-container>
                <mat-icon>manage_search</mat-icon>
              </ng-container>
            }
            {{ searching() ? 'Searching…' : 'Search' }}
          </button>
        </aside>

        <!-- ── Right: Results panel ──────────────────────────────────────────── -->
        <div class="results-panel">

          @if (!searched()) {
            <div class="results-empty sw-card">
              <mat-icon class="empty-icon">travel_explore</mat-icon>
              <h3>Ready to search</h3>
              <p>Set your requirements on the left and click Search to rank candidates.</p>
            </div>
          }

          @if (searched() && results.length === 0 && !searching()) {
            <div class="results-empty sw-card">
              <mat-icon class="empty-icon">search_off</mat-icon>
              <h3>No candidates found</h3>
              <p>Try relaxing your filters or removing hard requirements.</p>
            </div>
          }

          @if (searched() && results.length > 0) {
            <div class="results-header">
              <span class="results-count">{{ results.length }} candidates ranked</span>
              @if (blindMode) {
                <span class="blind-indicator">
                  <mat-icon>visibility_off</mat-icon> Blind mode active
                </span>
              }
            </div>

            @for (r of results; track r.ref) {
              <div class="result-card sw-card">
                <div class="result-top">
                  <div class="result-rank">#{{ r.rank }}</div>
                  <div class="result-meta">
                    <span class="result-ref">{{ r.ref }}</span>
                    <span class="result-role">{{ r.currentRole }}</span>
                    <span class="result-exp">Relevant: {{ r.relevantYears }}y</span>
                  </div>
                  <div class="result-scores">
                    <div class="score-item">
                      <span class="score-val" [class.high]="r.matchScore >= 80"
                                              [class.med]="r.matchScore >= 60 && r.matchScore < 80"
                                              [class.low]="r.matchScore < 60">
                        {{ r.matchScore }}%
                      </span>
                      <span class="score-lbl">Match</span>
                    </div>
                    <div class="score-item">
                      <span class="score-val conf">{{ r.confidenceScore }}%</span>
                      <span class="score-lbl">Confidence</span>
                    </div>
                    <span class="sw-badge"
                          [class.ready]="r.parsingQuality === 'HIGH'"
                          [class.warning]="r.parsingQuality === 'MEDIUM'"
                          [class.failed]="r.parsingQuality === 'LOW'">
                      {{ r.parsingQuality }}
                    </span>
                  </div>
                </div>

                <!-- Skills matched/missing -->
                <div class="result-skills">
                  <div class="skill-group">
                    <span class="skill-group-label matched">Matched</span>
                    @for (s of r.matched; track s) {
                      <span class="skill-chip matched">{{ s }}</span>
                    }
                  </div>
                  @if (r.missing.length > 0) {
                    <div class="skill-group">
                      <span class="skill-group-label missing">Missing must-haves</span>
                      @for (s of r.missing; track s) {
                        <span class="skill-chip missing">{{ s }}</span>
                      }
                    </div>
                  }
                </div>

                <!-- Evidence preview -->
                <div class="evidence-preview">
                  <mat-icon>format_quote</mat-icon>
                  <span>"{{ r.topEvidence }}"</span>
                  <span class="evidence-page">Page {{ r.evidencePage }}</span>
                </div>

                <!-- Actions -->
                <div class="result-actions">
                  <button mat-button color="primary">
                    <mat-icon>info</mat-icon> Explain
                  </button>
                  <button mat-button color="primary">
                    <mat-icon>compare</mat-icon> Compare
                  </button>
                  <button mat-button color="primary">
                    <mat-icon>bookmark_add</mat-icon> Shortlist
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-page { padding-bottom: 40px; }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--sw-text);
      margin-bottom: 20px;
    }

    // ── Layout ────────────────────────────────────────────────────────────────
    .search-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 20px;
      align-items: start;

      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    // ── Builder panel ─────────────────────────────────────────────────────────
    .builder-panel { padding: 0; overflow: hidden; }

    .tab-body { padding: 16px; }

    .full-width { width: 100%; }
    .mt-12 { margin-top: 12px; }

    .hint-text { color: var(--sw-text-muted); font-size: 0.85rem; }

    // ── Requirements ──────────────────────────────────────────────────────────
    .requirements-section {
      padding: 16px;
      border-top: 1px solid var(--sw-border);
    }

    .req-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .req-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid var(--sw-border);

      &:last-child { border-bottom: none; }
    }

    .req-type-badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 8px;
      flex-shrink: 0;

      &.rt-must      { background: #ffebee; color: #c62828; }
      &.rt-preferred { background: #e3f2fd; color: #1565c0; }
      &.rt-bonus     { background: #e8f5e9; color: #2e7d32; }
    }

    .req-label { flex: 1; font-size: 0.85rem; color: var(--sw-text); }
    .req-years { font-size: 0.72rem; color: var(--sw-text-muted); white-space: nowrap; }

    .req-importance {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .imp-slider { width: 80px; }
    .imp-val    { font-size: 0.72rem; color: var(--sw-text-muted); width: 30px; }

    // ── Options ───────────────────────────────────────────────────────────────
    .options-section { padding: 16px; }

    .option-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--sw-text);
    }

    .blind-note {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: #1565c0;
      background: #e3f2fd;
      border-radius: 8px;
      padding: 8px 10px;
      margin-top: 8px;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .search-btn {
      width: calc(100% - 32px);
      margin: 0 16px 16px;
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
    }

    // ── Results ───────────────────────────────────────────────────────────────
    .results-panel { display: flex; flex-direction: column; gap: 16px; }

    .results-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
      color: var(--sw-text-muted);

      h3 { color: var(--sw-text); margin: 12px 0 8px; }
      p  { font-size: 0.875rem; }
    }

    .empty-icon { font-size: 52px; width: 52px; height: 52px; color: var(--sw-primary); opacity: 0.5; }

    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .results-count { font-size: 0.875rem; color: var(--sw-text-muted); }

    .blind-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #1565c0;
      background: #e3f2fd;
      padding: 4px 10px;
      border-radius: 12px;

      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    // ── Result card ───────────────────────────────────────────────────────────
    .result-card { padding: 18px; }

    .result-top {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 14px;
    }

    .result-rank {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--sw-primary);
      width: 36px;
      flex-shrink: 0;
    }

    .result-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .result-ref  { font-weight: 700; font-family: monospace; color: var(--sw-text); }
    .result-role { font-size: 0.875rem; color: var(--sw-text); }
    .result-exp  { font-size: 0.78rem; color: var(--sw-text-muted); }

    .result-scores {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .score-item { display: flex; flex-direction: column; align-items: center; }

    .score-val {
      font-size: 1.1rem;
      font-weight: 700;

      &.high { color: var(--sw-success); }
      &.med  { color: #f57f17; }
      &.low  { color: var(--sw-warn); }
      &.conf { color: var(--sw-primary); }
    }

    .score-lbl { font-size: 0.68rem; color: var(--sw-text-muted); }

    // ── Result skills ─────────────────────────────────────────────────────────
    .result-skills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

    .skill-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .skill-group-label {
      font-size: 0.72rem;
      font-weight: 600;
      &.matched { color: var(--sw-success); }
      &.missing  { color: var(--sw-warn); }
    }

    .skill-chip {
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 0.72rem;

      &.matched { background: #e8f5e9; color: #2e7d32; }
      &.missing  { background: #ffebee; color: #c62828; }
    }

    // ── Evidence preview ──────────────────────────────────────────────────────
    .evidence-preview {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 10px 12px;
      background: var(--sw-bg);
      border-radius: 8px;
      font-size: 0.8rem;
      color: var(--sw-text-muted);
      margin-bottom: 12px;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--sw-primary); flex-shrink: 0; margin-top: 2px; }
      span     { flex: 1; font-style: italic; }
    }

    .evidence-page {
      font-style: normal;
      white-space: nowrap;
      background: var(--sw-border);
      border-radius: 8px;
      padding: 1px 6px;
      font-size: 0.7rem;
    }

    // ── Result actions ────────────────────────────────────────────────────────
    .result-actions {
      display: flex;
      gap: 4px;
      border-top: 1px solid var(--sw-border);
      padding-top: 10px;

      button { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; }
    }
  `],
})
export class SearchComponent {
  tabIndex    = signal(0);
  searching   = signal(false);
  searched    = signal(false);
  blindMode   = true;
  pageSize    = 20;
  nlQuery     = '';
  jdText      = '';

  requirements: Requirement[] = [
    { label: 'Java',        type: 'MUST',      importance: 1.0, minYears: 5 },
    { label: 'Spring Boot', type: 'MUST',      importance: 1.0             },
    { label: 'PostgreSQL',  type: 'PREFERRED', importance: 0.7             },
    { label: 'Angular',     type: 'PREFERRED', importance: 0.5             },
    { label: 'Docker',      type: 'BONUS',     importance: 0.3             },
  ];

  results: SearchResult[] = [];

  runSearch(): void {
    this.searching.set(true);
    setTimeout(() => {
      this.results = this.mockResults();
      this.searching.set(false);
      this.searched.set(true);
    }, 1200);
  }

  extractFromJD(): void {
    // Wire to POST /api/v1/searches/from-job-description
    this.requirements = [
      { label: 'Java',        type: 'MUST',      importance: 1.0, minYears: 5 },
      { label: 'Spring Boot', type: 'MUST',      importance: 1.0             },
      { label: 'PostgreSQL',  type: 'MUST',      importance: 0.9             },
      { label: 'Microservices',type:'PREFERRED',  importance: 0.6             },
    ];
  }

  addRequirement(): void {
    this.requirements.push({ label: 'New skill', type: 'PREFERRED', importance: 0.5 });
  }

  removeReq(i: number): void {
    this.requirements.splice(i, 1);
  }

  private mockResults(): SearchResult[] {
    return [
      { ref: 'CV-1042', rank: 1, matchScore: 89, confidenceScore: 82, parsingQuality: 'HIGH',
        currentRole: 'Senior Java Engineer', relevantYears: 7.4,
        matched: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
        missing: [],
        topEvidence: 'Migrated twelve services to Spring Boot 3.2 improving throughput by 40%.',
        evidencePage: 2 },
      { ref: 'CV-1047', rank: 2, matchScore: 74, confidenceScore: 78, parsingQuality: 'HIGH',
        currentRole: 'Backend Engineer', relevantYears: 4.2,
        matched: ['Java', 'Spring Boot'],
        missing: ['PostgreSQL'],
        topEvidence: 'Designed REST APIs using Spring Boot and deployed on Kubernetes.',
        evidencePage: 1 },
      { ref: 'CV-1048', rank: 3, matchScore: 61, confidenceScore: 65, parsingQuality: 'MEDIUM',
        currentRole: 'Full Stack Developer', relevantYears: 3.0,
        matched: ['Java', 'Angular'],
        missing: ['Spring Boot'],
        topEvidence: 'Built Angular frontend consuming Java REST microservices.',
        evidencePage: 3 },
    ];
  }
}
