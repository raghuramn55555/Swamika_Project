import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'swamika-theme';
  private doc = inject(DOCUMENT);

  isDark = signal<boolean>(this.loadPreference());

  constructor() {
    // Apply immediately on startup
    this.applyTheme(this.isDark());

    // Re-apply on every signal change
    effect(() => {
      const dark = this.isDark();
      this.applyTheme(dark);
      try { localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light'); }
      catch { /* storage blocked */ }
    });
  }

  toggle(): void { this.isDark.update(v => !v); }

  private applyTheme(dark: boolean): void {
    // Set data-theme on <html> so CSS vars at :root / html[data-theme] both work
    this.doc.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    // Also keep body class for any Material / legacy selectors
    this.doc.body.classList.toggle('dark-theme', dark);
  }

  private loadPreference(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return stored === 'dark';
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch { return false; }
  }
}
