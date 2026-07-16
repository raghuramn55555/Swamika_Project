// ─── Shared API response wrappers ────────────────────────────────────────────

/** Generic paginated response from Spring Boot */
export interface PageResponse<T> {
  content:          T[];
  totalElements:    number;
  totalPages:       number;
  size:             number;
  number:           number;   // current page (0-indexed)
  first:            boolean;
  last:             boolean;
}

/** Standard service call result — avoids throwing in components */
export interface ServiceResult<T = void> {
  ok:      boolean;
  data?:   T;
  error?:  string;
  code?:   string;   // errorCode from ApiProblem
}
