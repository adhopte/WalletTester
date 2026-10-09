import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { ID_CLAIMS, useCaseMap, UserAttributes, VERIFIED_USE_CASES } from '../../models/Oid4vciModels';
import { AdminService } from '../../services/admin.service';
import { ConfigService } from '../../services/config-service';
import { RestControllerService } from '../../services/rest-controller.service';

interface UseCaseRecords {
  useCaseId: string;
  records: UserAttributes[];
}

/**
 * Administrator area: full pre-authorization data for each verified use case,
 * with a shortcut to issue a record with assisted verification.
 */
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  imports: [FormsModule, RouterLink, TranslatePipe],
  standalone: true
})
export class AdminComponent implements OnInit {
  admin = inject(AdminService);
  private rest = inject(RestControllerService);
  private configs = inject(ConfigService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  password = '';
  loginError = '';
  signingIn = false;
  loading = false;
  sections: UseCaseRecords[] = [];
  expanded = new Set<string>();

  ngOnInit() {
    if (this.admin.isAdmin()) {
      this.load();
    }
  }

  login() {
    if (!this.password || this.signingIn) {
      return;
    }
    this.signingIn = true;
    this.loginError = '';
    this.rest.adminLogin(this.password).subscribe(res => {
      this.signingIn = false;
      if (res.token) {
        this.admin.start(res.token, res.expiresIn ?? 3600);
        this.password = '';
        this.load();
      } else {
        this.loginError = res.status === 503 ? 'admin.notConfigured' : res.status === 401 ? 'admin.invalidPassword' : 'admin.unavailable';
      }
    });
  }

  logout() {
    this.rest.adminLogout().subscribe();
    this.admin.end();
    this.sections = [];
  }

  load() {
    const useCases: string[] = (this.configs.supportedUseCases() ?? []).filter((id: string) => VERIFIED_USE_CASES.includes(id));
    this.loading = true;
    forkJoin(useCases.map(id => this.rest.loadAdminRecords(id))).subscribe(results => {
      this.loading = false;
      if (!this.admin.isAdmin()) {
        // session expired on the server
        this.loginError = 'admin.sessionExpired';
        return;
      }
      this.sections = useCases.map((useCaseId, i) => ({ useCaseId, records: results[i] ?? [] }));
    });
  }

  useCaseLabel(useCaseId: string): string {
    const key = 'useCases.' + useCaseId;
    const label = this.translate.instant(key);
    return label !== key ? label : (useCaseMap[useCaseId] ?? useCaseId);
  }

  claimLabel(name: string): string {
    const key = 'claims.' + name;
    const label = this.translate.instant(key);
    if (label !== key) {
      return label;
    }
    const text = name.replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  value(user: UserAttributes, name: string): string {
    const attribute = user.attributes.find(a => a.name === name);
    return attribute === undefined ? '' : String(attribute.value);
  }

  fullName(user: UserAttributes): string {
    return [this.value(user, 'given_name'), this.value(user, 'family_name')].filter(Boolean).join(' ');
  }

  birthDate(user: UserAttributes): string {
    return this.value(user, 'birth_date') || this.value(user, 'birthdate');
  }

  idNumbers(user: UserAttributes): { label: string, value: string }[] {
    const ids = ID_CLAIMS
      .filter(name => this.value(user, name))
      .map(name => ({ label: this.claimLabel(name), value: this.value(user, name) }));
    return user.npi ? [{ label: 'NPI', value: user.npi }, ...ids] : ids;
  }

  portrait(user: UserAttributes): string | null {
    const value = user.attributes.find(a => a.name === 'portrait')?.value;
    return value ? (String(value).startsWith('data:') ? value : 'data:image/jpeg;base64,' + value) : null;
  }

  /** Claims shown in the detail panel (the portrait is shown as an image) */
  claims(user: UserAttributes) {
    return user.attributes.filter(a => a.name !== 'portrait');
  }

  toggle(key: string) {
    this.expanded.has(key) ? this.expanded.delete(key) : this.expanded.add(key);
  }

  issue(useCaseId: string, user: UserAttributes) {
    this.router.navigate(['pre-auth-code-flow', useCaseId], { queryParams: { record: user.identifier } });
  }
}
