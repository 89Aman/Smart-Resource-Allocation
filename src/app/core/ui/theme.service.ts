import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Apply synchronously on creation
    this.applyTheme(this.theme());

    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
    });
  }

  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  setTheme(t: Theme) {
    this.theme.set(t);
  }

  private applyTheme(t: Theme) {
    if (typeof document !== 'undefined') {
      const isDark = t === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('dark-theme', isDark);
      document.body.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark-theme', isDark);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sahaay-theme', t);
    }
  }

  private getInitialTheme(): Theme {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('sahaay-theme');
      if (saved === 'light' || saved === 'dark') return saved as Theme;
    }
    
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
}
