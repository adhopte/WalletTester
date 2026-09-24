import { Injectable, Inject } from '@angular/core';
import { WINDOW } from '../../window-provider';
import * as flows from '../../assets/flows.json';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  dtcFlowName(): string {
    return (this.window as any).env?.flows["DTC_FLOW_NAME"]
  }
  supportedUseCases() {
    return (this.window as any).env?.flows.supportedUseCases;
  }
  dtcDataFile(): string {
    return (this.window as any).env?.flows["DTC_DATA_FILE"];
  }

  userPidClaimsFile(): string {
    return (this.window as any).env?.flows["USER_PID_CLAIMS_FILE"];
  }

  userDegreeClaimsFile(): string {
    return (this.window as any).env?.flows["USER_DEGREE_CLAIMS_FILE"];
  }

  userBirthCertificateClaimsSdJwtFile(): string {
    return (this.window as any).env?.flows["USER_BIRTH_CERTIFICATE_CLAIMS_SD_JWT_FILE"];
  }

  userBirthCertificateClaimsMdocFile(): string {
    return (this.window as any).env?.flows["USER_BIRTH_CERTIFICATE_CLAIMS_MDOC_FILE"];
  }

  oid4vciHost(): string {
    return (this.window as any).env?.oid4vciHost;
  }

  sorHost(): string {
    return (this.window as any).env?.sorHost;
  }

  uc2CredentialName(): string {
    return (this.window as any).env?.uc2CredName;
  }

  hostname: string;

  constructor(@Inject(WINDOW) private window: Window) {
    this.hostname = window.location.hostname;
    console.log("hostname: " + this.hostname);
  }

  getAvailableFlows() {

    const envFlows = (this.window as any).env?.flows || {
      default: ["COL_RNEC", "PASSPORT_INPERSON", "FINLAND_MNO"], //we need to redefine here when not running with docker
      hosts: {}
    };


    const availableFlows = envFlows.hosts[this.hostname];

    if(availableFlows === undefined) {
      return envFlows.default;
    }

    return availableFlows;
  }
}
