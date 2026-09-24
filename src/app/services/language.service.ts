import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface SupportedLanguage {
  code: string;
  label: string;
}

/**
 * Handles the portal's UI language: English, French and Polish.
 * The chosen language is remembered in localStorage; on first visit the
 * browser language is used when supported, otherwise English.
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  static readonly DEFAULT_LANGUAGE = 'en';
  static readonly STORAGE_KEY = 'portal-language';

  readonly languages: SupportedLanguage[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pl', label: 'Polski' },
  ];

  private translate = inject(TranslateService);
  private title = inject(Title);
  private document = inject(DOCUMENT);

  init(): Observable<unknown> {
    this.translate.addLangs(this.languages.map(l => l.code));
    return this.use(this.initialLanguage());
  }

  get current(): string {
    return this.translate.getCurrentLang() || LanguageService.DEFAULT_LANGUAGE;
  }

  use(code: string): Observable<unknown> {
    const lang = this.isSupported(code) ? code : LanguageService.DEFAULT_LANGUAGE;
    try {
      localStorage.setItem(LanguageService.STORAGE_KEY, lang);
    } catch {
      // storage unavailable (private mode etc.) - language just won't persist
    }
    this.document.documentElement.lang = lang;
    return this.translate.use(lang).pipe(
      tap(() => this.title.setTitle(this.translate.instant('app.title')))
    );
  }

  private initialLanguage(): string {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LanguageService.STORAGE_KEY);
    } catch {
      // ignore
    }
    if (stored && this.isSupported(stored)) {
      return stored;
    }
    const browserLang = this.translate.getBrowserLang();
    return browserLang && this.isSupported(browserLang) ? browserLang : LanguageService.DEFAULT_LANGUAGE;
  }

  private isSupported(code: string): boolean {
    return this.languages.some(l => l.code === code);
  }
}
