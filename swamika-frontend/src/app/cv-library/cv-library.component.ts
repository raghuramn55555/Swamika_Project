import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

interface CvEntry {
  id: string;
  anonymousRef: string;
  filename: string;
  status: 'READY' | 'WARNING' | 'FAILED' | 'PROCESSING' | 'RECEIVED';
  uploadedAt: string;
  sizeKb: number;
  skills: string[];
  parsingQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'PENDING';
}

@Component({
  selector: 'sw-cv-library',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatChipsModule,
    MatMenuModule, MatDividerModule, MatProgressBarModule,
    MatTooltipModule, MatDialogModule,
  ],
  template: `
    <div class="sw-page">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">CV Library</h2>
          <p class="page-sub">{{ cvs.length }} documents &bull; {{ readyCount() }} ready</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button color="primary" (click)="triggerUpload()">
            <mat-icon>upload_file</mat-icon> Upload CV
          </button>
          <button mat-raised-button color="primary" (click)="triggerBulkUpload()">
            <mat-icon>drive_folder_upload</mat-icon> Bulk Upload
          </button>
        </div>
      </div>

      <!-- Upload drop zone -->
      <div class="drop-zone sw-card"
           [class.drag-over]="isDragging()"
           (dragover)="$event.preventDefault(); isDragging.set(true)"
           (dragleave)="isDragging.set(false)"
           (drop)="onDrop($event)"
           role="button"
           tabindex="0"
           aria-label="Drop CV files here or click to upload"
           (click)="triggerUpload()"
           (keydown.enter)="triggerUpload()">
        <mat-icon class="drop-icon">cloud_upload</mat-icon>
        <p class="drop-text">Drag &amp; drop PDF or DOCX files here</p>
        <p class="drop-sub">or <strong>click to browse</strong> &bull; max 10 MB per file</p>
        <input #fileInput type="file" accept=".pdf,.docx" multiple
               style="display:none" (change)="onFileSelect($event)" />
      </div>

      <!-- Filters row -->
      <div class="filters-row sw-card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Filter candidates</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="filterText" placeholder="Name, skill, role…" />
        </mat-form-field>

        <div class="status-filters">
          @for (s of statusFilters; track s.value) {
            <button mat-stroked-button
                    [class.active-filter]="activeFilter() === s.value"
                    (click)="activeFilter.set(s.value)"
                    [attr.aria-pressed]="activeFilter() === s.value">
              {{ s.label }}
              <span class="filter-count">{{ countByStatus(s.value) }}</span>
            </button>
          }
        </div>
      </div>

      <!-- CV table -->
      <div class="sw-card table-card">
        <table mat-table [dataSource]="filteredCvs()" class="cv-table" aria-label="CV Library">

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <span class="sw-badge"
                    [class.ready]="row.status === 'READY'"
                    [class.warning]="row.status === 'WARNING'"
                    [class.failed]="row.status === 'FAILED'"
                    [class.progress]="row.status === 'PROCESSING' || row.status === 'RECEIVED'">
                <mat-icon>{{ statusIcon(row.status) }}</mat-icon>
                {{ row.status }}
              </span>
            </td>
          </ng-container>

          <!-- Anonymous ref -->
          <ng-container matColumnDef="ref">
            <th mat-header-cell *matHeaderCellDef>Reference</th>
            <td mat-cell *matCellDef="let row">
              <strong class="ref-id">{{ row.anonymousRef }}</strong>
            </td>
          </ng-container>

          <!-- Skills preview -->
          <ng-container matColumnDef="skills">
            <th mat-header-cell *matHeaderCellDef>Top Skills</th>
            <td mat-cell *matCellDef="let row">
              <div class="skill-chips">
                @for (sk of row.skills.slice(0,3); track sk) {
                  <span class="skill-chip">{{ sk }}</span>
                }
                @if (row.skills.length > 3) {
                  <span class="skill-chip more">+{{ row.skills.length - 3 }}</span>
                }
              </div>
            </td>
          </ng-container>

          <!-- Parsing quality -->
          <ng-container matColumnDef="quality">
            <th mat-header-cell *matHeaderCellDef>Parse Quality</th>
            <td mat-cell *matCellDef="let row">
              <span class="quality-badge" [class]="'q-' + row.parsingQuality.toLowerCase()">
                {{ row.parsingQuality }}
              </span>
            </td>
          </ng-container>

          <!-- Uploaded at -->
          <ng-container matColumnDef="uploaded">
            <th mat-header-cell *matHeaderCellDef>Uploaded</th>
            <td mat-cell *matCellDef="let row" class="muted-cell">{{ row.uploadedAt }}</td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor]="rowMenu"
                      [attr.aria-label]="'Actions for ' + row.anonymousRef">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #rowMenu="matMenu">
                <button mat-menu-item>
                  <mat-icon>person</mat-icon> View profile
                </button>
                <button mat-menu-item>
                  <mat-icon>manage_search</mat-icon> Search similar
                </button>
                <button mat-menu-item [disabled]="row.status === 'PROCESSING'">
                  <mat-icon>refresh</mat-icon> Reprocess
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item class="delete-item">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="cv-row"></tr>

          <!-- Empty state -->
          <tr class="mat-row no-data-row" *matNoDataRow>
            <td [attr.colspan]="displayedColumns.length" class="no-data-cell">
              <mat-icon>folder_open</mat-icon>
              <p>No CVs match your filter</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }

    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--sw-text); }
    .page-sub   { color: var(--sw-text-muted); font-size: 0.875rem; margin-top: 4px; }

    .header-actions { display: flex; gap: 10px; flex-wrap: wrap;
      button { border-radius: 8px; display: flex; align-items: center; gap: 6px; } }

    // ── Drop zone ─────────────────────────────────────────────────────────────
    .drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 36px;
      border: 2px dashed var(--sw-border);
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      margin-bottom: 16px;
      text-align: center;

      &:hover, &.drag-over {
        border-color: var(--sw-primary);
        background: rgba(57, 73, 171, 0.04);
      }

      &:focus-visible { outline: 3px solid var(--sw-primary); }
    }

    .drop-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
      color: var(--sw-primary);
      margin-bottom: 12px;
    }

    .drop-text { font-size: 1rem; color: var(--sw-text); margin-bottom: 4px; }
    .drop-sub  { font-size: 0.82rem; color: var(--sw-text-muted); }

    // ── Filters ───────────────────────────────────────────────────────────────
    .filters-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px;
      margin-bottom: 16px;
    }

    .search-field { flex: 1; min-width: 220px; }

    .status-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      button {
        border-radius: 20px;
        height: 36px;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .active-filter {
        background: var(--sw-primary);
        color: #fff;
        border-color: var(--sw-primary);
      }
    }

    .filter-count {
      background: var(--sw-bg);
      border-radius: 10px;
      padding: 1px 6px;
      font-size: 0.72rem;
    }

    .active-filter .filter-count {
      background: rgba(255,255,255,0.25);
    }

    // ── Table ─────────────────────────────────────────────────────────────────
    .table-card { padding: 0; overflow: hidden; }

    .cv-table { width: 100%; }

    .cv-row { cursor: pointer; &:hover { background: rgba(57,73,171,0.04); } }

    .ref-id { font-family: monospace; font-size: 0.85rem; color: var(--sw-primary); }
    .muted-cell { color: var(--sw-text-muted); font-size: 0.83rem; }

    .skill-chips { display: flex; gap: 4px; flex-wrap: wrap; }

    .skill-chip {
      background: rgba(57,73,171,0.1);
      color: var(--sw-primary);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 0.72rem;
      white-space: nowrap;

      &.more { background: var(--sw-border); color: var(--sw-text-muted); }
    }

    .quality-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;

      &.q-high    { background: #e8f5e9; color: #2e7d32; }
      &.q-medium  { background: #fff8e1; color: #f57f17; }
      &.q-low     { background: #ffebee; color: #c62828; }
      &.q-pending { background: var(--sw-border); color: var(--sw-text-muted); }
    }

    .delete-item { color: var(--sw-warn); mat-icon { color: var(--sw-warn); } }

    .no-data-row td { text-align: center; padding: 48px 24px; }
    .no-data-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--sw-text-muted);

      mat-icon { font-size: 40px; width: 40px; height: 40px; }
    }
  `],
})
export class CvLibraryComponent {
  filterText = '';
  isDragging = signal(false);
  activeFilter = signal<string>('ALL');

  statusFilters = [
    { label: 'All',        value: 'ALL'        },
    { label: 'Ready',      value: 'READY'      },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Warning',    value: 'WARNING'    },
    { label: 'Failed',     value: 'FAILED'     },
  ];

  displayedColumns = ['status', 'ref', 'skills', 'quality', 'uploaded', 'actions'];

  cvs: CvEntry[] = [
    { id: '1', anonymousRef: 'CV-1042', filename: 'john_doe.pdf',       status: 'READY',      uploadedAt: '2026-07-15', sizeKb: 142, skills: ['Java', 'Spring Boot', 'PostgreSQL', 'REST', 'Docker'], parsingQuality: 'HIGH'    },
    { id: '2', anonymousRef: 'CV-1043', filename: 'jane_smith.docx',    status: 'READY',      uploadedAt: '2026-07-15', sizeKb: 98,  skills: ['Angular', 'TypeScript', 'RxJS', 'Material'],            parsingQuality: 'HIGH'    },
    { id: '3', anonymousRef: 'CV-1044', filename: 'alex_jones.pdf',     status: 'WARNING',    uploadedAt: '2026-07-14', sizeKb: 210, skills: ['Python', 'Django', 'React'],                            parsingQuality: 'MEDIUM'  },
    { id: '4', anonymousRef: 'CV-1045', filename: 'scan_001.pdf',       status: 'FAILED',     uploadedAt: '2026-07-14', sizeKb: 3800,skills: [],                                                       parsingQuality: 'LOW'     },
    { id: '5', anonymousRef: 'CV-1046', filename: 'senior_dev.pdf',     status: 'PROCESSING', uploadedAt: '2026-07-15', sizeKb: 175, skills: [],                                                       parsingQuality: 'PENDING' },
    { id: '6', anonymousRef: 'CV-1047', filename: 'maria_r.docx',       status: 'READY',      uploadedAt: '2026-07-13', sizeKb: 88,  skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'AWS'],    parsingQuality: 'HIGH'    },
    { id: '7', anonymousRef: 'CV-1048', filename: 'product_mgr.pdf',    status: 'READY',      uploadedAt: '2026-07-13', sizeKb: 120, skills: ['Product Management', 'Agile', 'Scrum', 'Roadmapping'],  parsingQuality: 'HIGH'    },
    { id: '8', anonymousRef: 'CV-1049', filename: 'data_scientist.pdf', status: 'READY',      uploadedAt: '2026-07-12', sizeKb: 155, skills: ['Python', 'ML', 'TensorFlow', 'SQL', 'Pandas'],          parsingQuality: 'MEDIUM'  },
  ];

  filteredCvs(): CvEntry[] {
    return this.cvs.filter(cv => {
      const matchFilter = this.activeFilter() === 'ALL' || cv.status === this.activeFilter();
      const q = this.filterText.toLowerCase();
      const matchText = !q || cv.anonymousRef.toLowerCase().includes(q)
        || cv.skills.some(s => s.toLowerCase().includes(q));
      return matchFilter && matchText;
    });
  }

  countByStatus(status: string): number {
    if (status === 'ALL') return this.cvs.length;
    return this.cvs.filter(c => c.status === status).length;
  }

  readyCount(): number { return this.countByStatus('READY'); }

  statusIcon(s: string): string {
    const m: Record<string, string> = {
      READY: 'check_circle', WARNING: 'warning',
      FAILED: 'error', PROCESSING: 'hourglass_top', RECEIVED: 'inbox',
    };
    return m[s] ?? 'help';
  }

  triggerUpload(): void {
    document.querySelector<HTMLInputElement>('input[type=file]')?.click();
  }

  triggerBulkUpload(): void {
    document.querySelector<HTMLInputElement>('input[type=file]')?.click();
  }

  onFileSelect(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) console.log('Files selected:', files.length, '— wire to upload API');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files) console.log('Dropped:', files.length, '— wire to upload API');
  }
}
