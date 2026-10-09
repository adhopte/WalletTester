import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { UseCaseId } from '../models/Oid4vciModels';
import { RestControllerService } from './rest-controller.service';

type CredentialConfiguration = { format?: string, doctype?: string, vct?: string, scope?: string };

/**
 * Picks the credential_configuration_id to request for a use case from the
 * issuer's metadata, so the portal follows the issuer when its configuration
 * ids change. Falls back to the id stored with the citizen record.
 */
@Injectable({
  providedIn: 'root'
})
export class CredentialConfigService {

  private rest = inject(RestControllerService);
  private metadata$: Observable<Record<string, CredentialConfiguration> | null> | undefined;

  /** How to recognise each use case's credential in the issuer metadata */
  private static readonly MATCHERS: Record<string, (id: string, c: CredentialConfiguration) => boolean> = {
    [UseCaseId.oid_pid_mdoc_uc1]: (id, c) =>
      c.format === 'mso_mdoc' && /pid/i.test(`${id} ${c.doctype ?? ''}`) && !/mock/i.test(id),
    [UseCaseId.oid_birth_certificate_sd_jwt_uc1]: (id, c) =>
      /sd-jwt/i.test(c.format ?? '') && /birth/i.test(`${id} ${c.vct ?? ''}`),
    [UseCaseId.oid_birth_certificate_mdoc_uc1]: (id, c) =>
      c.format === 'mso_mdoc' && /birth/i.test(`${id} ${c.doctype ?? ''}`),
  };

  resolve(useCaseId: string, recordConfigurationId: string): Observable<string> {
    return this.configurations().pipe(map(configurations => {
      if (!configurations || configurations[recordConfigurationId]) {
        return recordConfigurationId;
      }
      const matcher = CredentialConfigService.MATCHERS[useCaseId];
      const ids = Object.keys(configurations).filter(id => matcher?.(id, configurations[id]));
      // Prefer a plain configuration over variants such as *_emrtd
      ids.sort((a, b) => a.length - b.length);
      return ids[0] ?? recordConfigurationId;
    }));
  }

  private configurations(): Observable<Record<string, CredentialConfiguration> | null> {
    if (!this.metadata$) {
      this.metadata$ = this.rest.getIssuerMetadata().pipe(
        map(metadata => metadata?.credential_configurations_supported ?? null),
        shareReplay(1)
      );
    }
    return this.metadata$ ?? of(null);
  }
}
