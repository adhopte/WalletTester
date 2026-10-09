import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'
import { ResponseParser } from './../utils/ResponseParser'
import { LocalStorageService } from './../services/local-storage.service'
import { environment } from "../../environments/environment"
import { ConfigService } from './config-service'
import { AdminService } from './admin.service'
import { Integer } from 'asn1js'
import { UseCaseId, UserAttributes } from '../models/Oid4vciModels'

const gipsHost = environment.gipsHost

const gipsbasePath = environment.gipsBasePath
const gipsBaseUrl = gipsHost + gipsbasePath + "/rest/v1/"

const oid4vciBasePath = environment.oid4vciBasePath

const accessTokenUrl = "accesstoken/create"
// const URLCreateTranscation="transaction/create"
// const URLSubmitAttribute = "transaction/{{transactionId}}/identity"
// const URLGetTranscation = baseUrl + "transaction/" // baseurl+transcationID

@Injectable({
  providedIn: 'root'
})

export class RestControllerService {


  constructor(private httpClient: HttpClient, private _storage: LocalStorageService, private configs: ConfigService, private admin: AdminService) { }

  private httpOptions = {
    headers: new HttpHeaders().set('Content-Type', 'application/json')
  }

  private extractData(res: Response) {
    const body = res
    return body || {}
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error("Amit : " + error) // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`Amit : ${operation} failed: ${error.message}`)

      // Let the app keep running by returning an empty result.
      return of(result as T)
    }
  }
  convertJp2(bytes: any) {
    // convertJp2(base64String: string) {
    console.log(bytes);
    // const binary = atob(base64String); // decode base64 to binary string
    // const len = binary.length;
    // const bytes = new Uint8Array(len);

    // for (let i = 0; i < len; i++) {
    //   bytes[i] = binary.charCodeAt(i);
    // }

    const blob = new Blob([bytes], { type: 'image/jp2' });
    const file = new File([blob], 'image.jp2', { type: 'image/jp2' });

    const formData = new FormData();
    formData.append('image', blob, 'face.jp2');

    return this.httpClient.post<{ jpegBase64: string }>('/api/convert-jp2', formData);
  }

  loadDTCUsers() {
    return this.httpClient.get(this.configs.dtcDataFile());
  }

  loadOidDataUser(useCaseId: string) {
    switch (useCaseId) {
      case UseCaseId.oid_pid_inp_uc1:
        return this.handleSorData(this.configs.userPidClaimsFile(), useCaseId);
      case UseCaseId.oid_pid_mdoc_uc1:
        return this.handleSorData(this.configs.userPidMdocClaimsFile(), useCaseId);
      case UseCaseId.oid_degree_uc1:
        return this.handleSorData(this.configs.userDegreeClaimsFile(), useCaseId);
      case UseCaseId.oid_birth_certificate_sd_jwt_uc1:
        return this.handleSorData(this.configs.userBirthCertificateClaimsSdJwtFile(), useCaseId);
      case UseCaseId.oid_birth_certificate_mdoc_uc1:
        return this.handleSorData(this.configs.userBirthCertificateClaimsMdocFile(), useCaseId);
      default:
        throw new Error("no use case id found for " + useCaseId)
    }
  }
  handleSorData(claimsFile: string, useCaseId: string) {
    if (environment.useSorServer) {
      return this.httpClient.get(this.configs.sorHost() + environment.sorBasePath + "/" + useCaseId + "/sor/", this.httpOptions).pipe(
        tap((res) => (
          console.log("get sor by credentials id : " + res)
        )),
        catchError(this.handleError<any>('get sor by credentials id'))
      );
    } else {
      return this.httpClient.get(claimsFile);
    }
  }

  createTransacation(url: string, params: string): Observable<any> {
    return this.httpClient.post(gipsBaseUrl + url, params, this.httpOptions).pipe(
      tap((res) => (
        console.log("CreateTransaction : " + res)
      )),
      catchError(this.handleError<any>('createTransaction'))
    );
  }


  /**
   * Simulated root-of-trust check of a citizen (date of birth + NPI) by the SOR server.
   * Emits true when the details match the record.
   */
  verifyCitizen(useCaseId: string, user: UserAttributes, birthDate: string, npi: string): Observable<boolean> {
    if (!environment.useSorServer) {
      // Records were read from a static file, which still contains the NPI
      const recordBirthDate = user.attributes.find(a => a.name === 'birth_date' || a.name === 'birthdate')?.value;
      const clean = (v: unknown) => String(v ?? '').replace(/[\s-]+/g, '').toUpperCase();
      const ids = [user.npi, ...user.attributes
        .filter(a => ['personal_administrative_number', 'document_number', 'birth_record_reference'].includes(a.name))
        .map(a => a.value)].filter(v => v !== undefined && v !== null && v !== '');
      return of(clean(npi) !== '' && ids.some(id => clean(id) === clean(npi)) && birthDate === String(recordBirthDate));
    }
    const url = this.configs.sorHost() + environment.sorBasePath + "/" + useCaseId + "/sor/" + encodeURIComponent(user.identifier) + "/verify";
    return this.httpClient.post<{ verified: boolean }>(url, JSON.stringify({ birthDate, npi }), { headers: this.adminHeaders() }).pipe(
      map(res => res?.verified === true),
      catchError(() => of(false))
    );
  }

  /** Administrator login; emits the session token, or null with the HTTP status on failure */
  adminLogin(password: string): Observable<{ token?: string, expiresIn?: number, status?: number }> {
    return this.httpClient.post<{ token: string, expiresIn: number }>(this.sorBaseUrl() + '/admin/login', JSON.stringify({ password }), this.httpOptions).pipe(
      catchError((err: HttpErrorResponse) => of({ status: err.status }))
    );
  }

  adminLogout(): Observable<unknown> {
    return this.httpClient.post(this.sorBaseUrl() + '/admin/logout', '{}', { headers: this.adminHeaders() }).pipe(
      catchError(() => of(null))
    );
  }

  /** Full pre-authorization records, ID numbers included (administrator only) */
  loadAdminRecords(useCaseId: string): Observable<UserAttributes[] | null> {
    return this.httpClient.get<UserAttributes[]>(this.sorBaseUrl() + '/admin/' + useCaseId + '/sor/', { headers: this.adminHeaders() }).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.admin.end();
        }
        return of(null);
      })
    );
  }

  private sorBaseUrl(): string {
    return this.configs.sorHost() + environment.sorBasePath;
  }

  private adminHeaders(): HttpHeaders {
    const token = this.admin.currentToken();
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return token ? headers.set('Authorization', 'Bearer ' + token) : headers;
  }

  /** The credential issuer's metadata (null when unavailable) */
  getIssuerMetadata(): Observable<any> {
    return this.httpClient.get(this.configs.oid4vciHost() + oid4vciBasePath + '/.well-known/openid-credential-issuer').pipe(
      catchError(() => of(null))
    );
  }

  /** Details of the last failed generateOffer call, for display to the user */
  lastOfferError: { status: number, detail: string } | null = null;

  generateOffer(url: string, params: string): Observable<any> {
    this.lastOfferError = null;
    return this.httpClient.post(this.configs.oid4vciHost() + oid4vciBasePath + url, params, this.httpOptions).pipe(
      tap((res) => {
        console.info("generate offer")
        console.dir(res)
      }),
      catchError((err: HttpErrorResponse) => {
        this.lastOfferError = { status: err.status, detail: RestControllerService.errorDetail(err) };
        return this.handleError<any>('generateOffer')(err);
      })
    );
  }

  private static errorDetail(err: HttpErrorResponse): string {
    const body = err.error;
    let text = typeof body === 'string' ? body : (body ? JSON.stringify(body) : '');
    // nginx error pages are HTML - keep only the text
    text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const status = err.status ? `HTTP ${err.status} ${err.statusText ?? ''}`.trim() : 'No response';
    return (text ? `${status}: ${text}` : status).slice(0, 500);
  }

  submitAttribute(url: string, params: string): Observable<any> {
    var updatedAccessToken = this._storage.getItemFromStorage("accessToken")
    this.updateHeadersWithAccessToken(updatedAccessToken)
    return this.httpClient.post(gipsBaseUrl + url, params, this.httpOptions).pipe(
      tap((res) => (
        console.log("submitAttribute : " + res)
      )),
      catchError(this.handleError<any>('submitAttribute'))
    );
  }

  updateHeadersWithAccessToken(accessToken: string) {
    this.httpOptions.headers = this.httpOptions.headers.set('Authorization', 'Bearer '.concat(accessToken))
  }

  getTranscation(url: string): Observable<any> {
    return this.httpClient.get(gipsBaseUrl + url, this.httpOptions).pipe(
      tap((res) => (
        console.log("GetTransaction : " + res)
      )),
      catchError(this.handleError<any>('GET Transaction'))
    )
  }

  setUpAccessToken(accessTokenRequestBody: string): Observable<any> {
    var accessToken: string
    return this.postForAccessToken(accessTokenRequestBody).pipe(
      tap((res) => {
        var parser = ResponseParser.getParser(this._storage)
        accessToken = parser.parseAccessTokenResponse(JSON.stringify(res))
        this._storage.saveToStorage("accessToken", accessToken)
        this.updateHeadersWithAccessToken(accessToken)
      }),
      catchError(this.handleError<any>('GET Access Token'))
    )
  }

  postForAccessToken(accessTokenRequestBody: string): Observable<any> {
    return this.httpClient.post(gipsBaseUrl + accessTokenUrl, accessTokenRequestBody, this.httpOptions).pipe(
      tap((res) => (
        console.log("GetAccessToken : " + res)
      )),
      catchError(this.handleError<any>('GET Transaction'))
    )
  }
}
