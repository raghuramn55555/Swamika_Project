import { Pipe, PipeTransform } from '@angular/core';

const STATUS_ICONS: Record<string, string> = {
  READY:      'check_circle',
  WARNING:    'warning',
  FAILED:     'error',
  PROCESSING: 'hourglass_top',
  RECEIVED:   'inbox',
  UP:         'check_circle',
  DEGRADED:   'warning',
  DOWN:       'error',
};

/**
 * Converts a document/service status string to its Font Awesome icon class.
 * Usage: {{ status | statusIcon }}
 * Replaces the duplicated statusIcon() methods in dashboard and cv-library.
 */
@Pipe({ name: 'statusIcon', standalone: true, pure: true })
export class StatusIconPipe implements PipeTransform {
  transform(status: string): string {
    return STATUS_ICONS[status?.toUpperCase()] ?? 'help';
  }
}
