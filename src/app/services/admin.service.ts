import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'portal-admin-session';

/**
 * Session of the portal administrator. The token is issued by the SOR server
 * (POST /admin/login) and kept for this browser tab only.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly token = signal<string | null>(AdminService.restore());
  readonly isAdmin = () => this.token() !== null;

  currentToken(): string | null {
    return this.token();
  }

  start(token: string, expiresInSeconds: number) {
    this.token.set(token);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expires: Date.now() + expiresInSeconds * 1000 }));
    } catch {
      // storage unavailable: the session lasts until the page is reloaded
    }
  }

  end() {
    this.token.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private static restore(): string | null {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      return saved && saved.expires > Date.now() ? saved.token : null;
    } catch {
      return null;
    }
  }
}
