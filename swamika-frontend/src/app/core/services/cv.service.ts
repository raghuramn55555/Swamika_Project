import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';

const API = '/api/v1';

// ── Matches the API processing lifecycle: FR-004 ──────────────────────────────
export type CvStatus =
  | 'RECEIVED' | 'EXTRACTING' | 'STRUCTURING'
  | 'EMBEDDING' | 'READY' | 'WARNING' | 'FAILED';

export interface CvUploadResult {
  documentId:  string;
  filename:    string;
  status:      CvStatus;
  sha256:      string;
  sizeBytes:   number;
  warnings?:   string[];
  error?:      string;
}

export interface BulkUploadResult {
  accepted:   CvUploadResult[];
  duplicates: { filename: string; existingDocumentId: string }[];
  failed:     { filename: string; reason: string }[];
  total:      number;
}

/** Upload progress for a single file — used for the progress bar in the UI */
export interface UploadProgress {
  filename:   string;
  progress:   number;       // 0–100
  status:     'uploading' | 'processing' | 'done' | 'error';
  result?:    CvUploadResult;
  errorMsg?:  string;
}

@Injectable({ providedIn: 'root' })
export class CvService {
  private http = inject(HttpClient);

  /**
   * Upload a single CV — POST /api/v1/cvs
   * Returns upload progress (0-100) and then the final result.
   * FR-001, FR-003 (duplicate detection via SHA-256 on server)
   */
  uploadOne(file: File): Observable<UploadProgress> {
    const form = new FormData();
    form.append('file', file, file.name);

    return this.http
      .post<CvUploadResult>(`${API}/cvs`, form, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map(event => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            return { filename: file.name, progress, status: 'uploading' } as UploadProgress;
          }

          if (event.type === HttpEventType.Response) {
            const result = event.body!;
            return {
              filename: file.name,
              progress: 100,
              status:   result.status === 'FAILED' ? 'error' : 'done',
              result,
              errorMsg: result.error,
            } as UploadProgress;
          }

          return { filename: file.name, progress: 0, status: 'uploading' } as UploadProgress;
        }),
        catchError((err: HttpErrorResponse) =>
          throwError(() => ({
            filename: file.name,
            progress: 0,
            status:   'error',
            errorMsg: this.extractError(err),
          } as UploadProgress))
        )
      );
  }

  /**
   * Bulk upload — POST /api/v1/cvs/bulk
   * FR-002: Upload multiple CVs and receive per-file outcomes.
   * Uses a single multipart request; server reports per-file success/failure.
   */
  uploadBulk(files: File[]): Observable<BulkUploadResult> {
    const form = new FormData();
    for (const f of files) {
      form.append('files', f, f.name);
    }

    return this.http
      .post<BulkUploadResult>(`${API}/cvs/bulk`, form)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.extractError(err)))
        )
      );
  }

  /**
   * Poll processing status for a document — GET /api/v1/cvs/{documentId}/status
   * FR-004: RECEIVED → EXTRACTING → STRUCTURING → EMBEDDING → READY/WARNING/FAILED
   */
  getStatus(documentId: string): Observable<{ documentId: string; status: CvStatus; warnings?: string[] }> {
    return this.http.get<{ documentId: string; status: CvStatus; warnings?: string[] }>(
      `${API}/cvs/${documentId}/status`
    );
  }

  private extractError(err: HttpErrorResponse): string {
    const body = err.error as { detail?: string; title?: string } | null;
    if (body?.detail) return body.detail;
    if (body?.title)  return body.title;
    if (err.status === 409) return 'Duplicate document — already exists in the library.';
    if (err.status === 413) return 'File too large. Maximum size is 10 MB.';
    if (err.status === 415) return 'Unsupported file type. Only PDF and DOCX are accepted.';
    return `Upload failed (${err.status}).`;
  }
}
