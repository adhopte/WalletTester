import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestControllerService } from '../../services/rest-controller.service';
import { CredentialConfigService } from '../../services/credential-config.service';
import { AdminService } from '../../services/admin.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { CodeRequest, DEFAULT_WALLET_IDENTIFIER, ID_CLAIMS, Offer, offerErrorMessage, UseCaseId, UserAttributes, VERIFIED_USE_CASES } from '../../models/Oid4vciModels';
import { v4 as uuidv4 } from 'uuid';
import { forkJoin, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

type VerificationState = 'form' | 'checking' | 'failed' | 'locked' | 'verified' | 'issuing';

const MAX_ATTEMPTS = 3;
// Minimum time the "checking with the national register" step is shown
const CHECK_DELAY_MS = 1200;

@Component({
  selector: 'pre-auth-code-flow',
  imports: [MatTableModule, NgForOf, NgIf, FormsModule, TranslatePipe, RouterLink],
  templateUrl: './pre-auth-code-flow.component.html',
  styleUrl: './pre-auth-code-flow.component.scss',
  standalone: true
})
export class PreAuthCodeFlowComponent implements OnInit {
  route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private credentialConfigs = inject(CredentialConfigService);
  admin = inject(AdminService);
  dataSet: UserAttributes[] = [];

  staticColumns = ['action'];
  dynamicColumnsPid = ['given_name', 'family_name', 'birthdate', 'email_address', 'mobile_phone_number', 'issuance_date', 'expiry_date'];
  dynamicColumnsPidMdoc = ['given_name', 'family_name', 'birth_place', 'expiry_date'];
  dynamicColumnsDegrees = ['student_given_name', 'student_family_name', 'degree_level', 'degree_subject', 'institution_name', 'graduation_year', 'issuing_authority'];
  dynamicColumnsBirthCertificateSdJwt = ['given_name', 'family_name', 'birth_place', 'issuing_authority', 'issuance_date'];
  dynamicColumnsBirthCertificateMdoc = ['given_name', 'family_name', 'birth_date', 'doctor', 'hospital', 'issuance_date', 'expiry_date'];

  dynamicColumns :string[];
  displayedColumns :string[];
  useCaseId = "";
  requiresVerification = false;

  // Verification dialog
  selected: UserAttributes | null = null;
  state: VerificationState = 'form';
  attempts = 0;
  birthDate = '';
  npi = '';
  @ViewChild('firstField') firstField?: ElementRef<HTMLInputElement>;

  constructor(private router: Router, private _rest: RestControllerService) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.useCaseId = params["useCaseId"];
    });
    this.requiresVerification = VERIFIED_USE_CASES.includes(this.useCaseId);
    this.buildDisplayedColumns(this.useCaseId);
    // The administrator gets the full records (ID numbers included)
    const records$ = this.requiresVerification && this.admin.isAdmin()
      ? this._rest.loadAdminRecords(this.useCaseId)
      : this._rest.loadOidDataUser(this.useCaseId);
    records$.subscribe((res: any) => {
      if (res === null && this.requiresVerification) {
        // admin session expired: fall back to the agent view
        this._rest.loadOidDataUser(this.useCaseId).subscribe((list: any) => this.dataSet = list ?? []);
        return;
      }
      this.dataSet = res ?? [];
      // Opened from the admin page for a given record
      const record = this.route.snapshot.queryParamMap.get('record');
      const user = record ? this.dataSet.find(u => u.identifier === record) : undefined;
      if (user) {
        this.start(user);
      }
    });
  }

  buildDisplayedColumns(useCaseId: string) {
    switch(useCaseId){
      case UseCaseId.oid_pid_inp_uc1:
        this.dynamicColumns = this.dynamicColumnsPid;
        break;
      case UseCaseId.oid_pid_mdoc_uc1:
        this.dynamicColumns = this.dynamicColumnsPidMdoc;
        break;
      case UseCaseId.oid_degree_uc1:
        this.dynamicColumns = this.dynamicColumnsDegrees;
        break;
      case UseCaseId.oid_birth_certificate_sd_jwt_uc1:
        this.dynamicColumns = this.dynamicColumnsBirthCertificateSdJwt;
        break;
      case UseCaseId.oid_birth_certificate_mdoc_uc1:
        this.dynamicColumns = this.dynamicColumnsBirthCertificateMdoc;
        break;
      default:
        throw new Error("no use case id found for " + useCaseId)
    }
    this.displayedColumns = [...this.staticColumns, ...this.dynamicColumns];
    if (this.requiresVerification) {
      this.displayedColumns.push('npi', 'status');
    }
    if (useCaseId === UseCaseId.oid_pid_mdoc_uc1) {
      this.displayedColumns.splice(1, 0, 'photo');
    }
  }

  /** Translated claim name, or given_name -> Given name when there is no translation */
  columnLabel(column: string): string {
    const key = 'claims.' + column;
    const label = this.translate.instant(key);
    return label !== key ? label : this.humanize(column);
  }

  humanize(column: string): string {
    const text = column.replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  getAttributeValue(element: UserAttributes, column: string): string {
    const attribute = element.attributes.find(c => c.name === column);
    return attribute ? String(attribute.value) : '';
  }

  /** Portrait claim (base64 JPEG) as an image source, if the record has one */
  portrait(user: UserAttributes): string | null {
    const value = user.attributes.find(a => a.name === 'portrait')?.value;
    if (!value) {
      return null;
    }
    return String(value).startsWith('data:') ? value : 'data:image/jpeg;base64,' + value;
  }

  fullName(user: UserAttributes): string {
    return [this.getAttributeValue(user, 'given_name'), this.getAttributeValue(user, 'family_name')].filter(Boolean).join(' ');
  }

  /** ID numbers of a full record (administrator view) */
  idNumbers(user: UserAttributes): string[] {
    const ids = ID_CLAIMS.map(name => this.getAttributeValue(user, name)).filter(Boolean);
    return user.npi ? [user.npi, ...ids] : ids;
  }

  recordBirthDate(user: UserAttributes): string {
    return this.getAttributeValue(user, 'birth_date') || this.getAttributeValue(user, 'birthdate');
  }

  /** Administrator: fill the verification form from the record */
  fillFromRecord() {
    if (!this.selected) {
      return;
    }
    this.birthDate = this.recordBirthDate(this.selected);
    this.npi = this.idNumbers(this.selected)[0] ?? '';
    if (this.state === 'failed' || this.state === 'locked') {
      this.state = 'form';
    }
  }

  npiHint(user: UserAttributes): string {
    if (this.admin.isAdmin()) {
      return this.idNumbers(user).join(' · ');
    }
    if (user.npiHint) {
      return user.npiHint;
    }
    const digits = (user.npi ?? '').replace(/\s+/g, '');
    return digits ? '•'.repeat(Math.max(digits.length - 4, 0)) + digits.slice(-4) : '';
  }

  start(user: UserAttributes) {
    if (!this.requiresVerification) {
      this.createOffer(user);
      return;
    }
    this.selected = user;
    this.state = 'form';
    this.attempts = 0;
    this.birthDate = '';
    this.npi = '';
    setTimeout(() => this.firstField?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  closeVerification() {
    if (this.state !== 'checking' && this.state !== 'issuing') {
      this.selected = null;
    }
  }

  verify() {
    const user = this.selected;
    if (!user || !this.birthDate || !this.npi.trim() || this.state === 'checking' || this.state === 'locked') {
      return;
    }
    this.state = 'checking';
    forkJoin([this._rest.verifyCitizen(this.useCaseId, user, this.birthDate, this.npi), timer(CHECK_DELAY_MS)])
      .pipe(map(([verified]) => verified))
      .subscribe(verified => {
        if (verified) {
          this.state = 'verified';
          setTimeout(() => {
            this.state = 'issuing';
            this.createOffer(user, true);
          }, 700);
          return;
        }
        this.attempts++;
        // The administrator is never locked out
        this.state = this.attempts >= MAX_ATTEMPTS && !this.admin.isAdmin() ? 'locked' : 'failed';
      });
  }

  get attemptsLeft(): number {
    return MAX_ATTEMPTS - this.attempts;
  }

  createOffer(user: UserAttributes, verified = false) {
    const businessId = uuidv4();
    const walletIdentifier = user.walletId || DEFAULT_WALLET_IDENTIFIER;
    this.credentialConfigs.resolve(this.useCaseId, user.credentialConfigurationId).pipe(
      switchMap(credentialConfigurationId => {
        const createOfferRequest = {
          "identifier": user.identifier,
          "business_id": businessId,
          "wallet_identifier": walletIdentifier,
          "businessId": businessId,
          "walletIdentifier": walletIdentifier,
          "authorization_details": [{
            "type": "openid_credential",
            "credential_configuration_id": credentialConfigurationId,
          }]
        } as CodeRequest;
        if (user.credentialId) {
          createOfferRequest.authorization_details[0].credential_identifiers = [user.credentialId];
        }
        return this._rest.generateOffer('/offer', JSON.stringify(createOfferRequest));
      })
    ).subscribe((offertRequest: Offer) => {
      if (!offertRequest?.uri) {
        this.selected = null;
        alert(offerErrorMessage(this.translate, this._rest.lastOfferError));
        return;
      }
      const state = verified ? { ...offertRequest, verifiedHolder: this.fullName(user), assisted: this.admin.isAdmin() } : offertRequest;
      this.router.navigate(['display-oid4vci-offer'], { state });
    });
  }
}
