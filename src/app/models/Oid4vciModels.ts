import { TranslateService } from '@ngx-translate/core';


export class Offer {
    qr_code: string
    uri: string
    tx_code: string
    authorization_code: string
    // Set by the portal when the holder's identity was verified before the offer was created
    verifiedHolder?: string
}


export class UserAttributes {
    identifier: string
    credentialConfigurationId: string
    credentialId?: string
    walletId: string
    // National ID number (NPI), only present when the records are read without the SOR server
    npi?: string
    // Last digits of the NPI, as returned by the SOR server
    npiHint?: string
    attributes: Attribute[]
}

export class Attribute {
    name: string
    value: string
}

export class UseCaseId {
    public static classic = "classic"
    public static readonly dtc_type1_inp = "dtc_type1_inp"
    public static readonly oid_pid_inp_uc1 = "oid_pid_inp_uc1"
    public static readonly oid_pid_mdoc_uc1 = "oid_pid_mdoc_uc1"
    public static readonly oid_degree_uc1 = "oid_degree_uc1"
    public static readonly oid_birth_certificate_sd_jwt_uc1 = "oid_birth_certificate_sd_jwt_uc1"
    public static readonly oid_birth_certificate_mdoc_uc1 = "oid_birth_certificate_mdoc_uc1"
    public static readonly oid_pid_idp_uc2 = "oid_pid_idp_uc2"
}

export const useCaseMap: Record<string, string> = {
    [UseCaseId.classic]: "Classic In Person agent",
    [UseCaseId.dtc_type1_inp]: "DTC Type 1 - In Person agent",
    [UseCaseId.oid_pid_inp_uc1]: "PID Issuance - In Person agent (UC-1)",
    [UseCaseId.oid_pid_mdoc_uc1]: "Digital identity card (PID mDoc)",
    [UseCaseId.oid_degree_uc1]: 'Student University Login (UC-1)',
    [UseCaseId.oid_birth_certificate_sd_jwt_uc1]: 'Birth Certificate Login (SD-JWT)',
    [UseCaseId.oid_birth_certificate_mdoc_uc1]: 'Birth Certificate Login (MDOC)',
    [UseCaseId.oid_pid_idp_uc2]: 'Issuance - Based on IDP login (UC-2)',
};


// The issuer's /offer API documents snake_case business_id / wallet_identifier
// (see the SIGMA Core-ID Issuer Bruno collection); the camelCase fields are
// kept for issuers that still expect them.
export const DEFAULT_WALLET_IDENTIFIER = "w-001";

export class CodeRequest {
    identifier: string
    business_id?: string
    wallet_identifier?: string
    businessId?: string
    walletIdentifier?: string
    authorization_details: AuthorizationDetail[]
}

export class AuthorizationDetail {
    type: string
    credential_configuration_id: string
    credential_identifiers: string[]
}


/** User-facing message for a failed credential offer request */
export function offerErrorMessage(translate: TranslateService, error: { status: number, detail: string } | null): string {
    let message = translate.instant('offer.failed');
    if (!error) {
        return message;
    }
    if ([0, 502, 503, 504].includes(error.status)) {
        message += '\n\n' + translate.instant('offer.issuerUnreachable');
    }
    return message + '\n\n' + translate.instant('offer.issuerResponse') + ' ' + error.detail;
}
