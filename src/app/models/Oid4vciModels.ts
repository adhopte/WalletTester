
export class Offer {
    qr_code: string
    uri: string
    tx_code: string
    authorization_code: string
}


export class UserAttributes {
    identifier: string
    credentialConfigurationId: string
    credentialId?: string
    walletId: string
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
    public static readonly oid_degree_uc1 = "oid_degree_uc1"
    public static readonly oid_birth_certificate_sd_jwt_uc1 = "oid_birth_certificate_sd_jwt_uc1"
    public static readonly oid_birth_certificate_mdoc_uc1 = "oid_birth_certificate_mdoc_uc1"
    public static readonly oid_pid_idp_uc2 = "oid_pid_idp_uc2"
}

export const useCaseMap: Record<string, string> = {
    [UseCaseId.classic]: "Classic In Person agent",
    [UseCaseId.dtc_type1_inp]: "DTC Type 1 - In Person agent",
    [UseCaseId.oid_pid_inp_uc1]: "PID Issuance - In Person agent (UC-1)",
    [UseCaseId.oid_degree_uc1]: 'Student University Login (UC-1)',
    [UseCaseId.oid_birth_certificate_sd_jwt_uc1]: 'Birth Certificate Login (SD-JWT)',
    [UseCaseId.oid_birth_certificate_mdoc_uc1]: 'Birth Certificate Login (MDOC)',
    [UseCaseId.oid_pid_idp_uc2]: 'Issuance - Based on IDP login (UC-2)',
};


export class CodeRequest {
    identifier: string
    businessId: string
    walletIdentifier: string
    authorization_details: AuthorizationDetail[]
}

export class AuthorizationDetail {
    type: string
    credential_configuration_id: string
    credential_identifiers: string[]
}
