import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { environment } from "../../../environments/environment"
import { ConfigService } from '../../services/config-service';
import { AuthorizationDetail, CodeRequest, Offer, useCaseMap } from '../../models/Oid4vciModels';
import { RestControllerService } from '../../services/rest-controller.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, MatSelectModule],
  standalone: true
})
export class HomeComponent implements OnInit {
  useCases: [string, string][];
  selected: string;
  restService = inject(RestControllerService);
  configs = inject(ConfigService)

  constructor(private router: Router) {
  }

  ngOnInit() {
    var map = new Map();
    this.configs.supportedUseCases().forEach((element: string) => {
      map.set(element, useCaseMap[element]);
    });
    this.useCases = Array.from(map.entries());
    this.selected = this.useCases[0][0];
    console.log(this.useCases);
  }

  onSubmit() {
    switch (this.selected) {
      case 'classic':
        this.router.navigate(['create-transcation']);
        break;
      case 'dtc_type1_inp':
        this.router.navigate(['dtc-users']);
        break;
      case 'oid_pid_inp_uc1':
        this.router.navigate(['pre-auth-code-flow/' + this.selected]);
        break;
      case 'oid_degree_uc1':
        this.router.navigate(['pre-auth-code-flow/' + this.selected]);
        break;
      case 'oid_birth_certificate_sd_jwt_uc1':
        this.router.navigate(['pre-auth-code-flow/' + this.selected]);
        break;
      case 'oid_birth_certificate_mdoc_uc1':
        this.router.navigate(['pre-auth-code-flow/' + this.selected]);
        break;
      case 'oid_pid_idp_uc2':
        this.submitOfferRequest();
        break;
    }
  }

  submitOfferRequest(): void {
    const createOfferRequest = {
      "identifier": "xyz-198772",
      "walletIdentifier": "w-001",
      "authorization_details": []
    } as CodeRequest;
    createOfferRequest.authorization_details.push(this.createAuthorizationDetail());
    this.restService.generateOffer('/offer', JSON.stringify(createOfferRequest)).subscribe(
      (offertRequest: Offer) => {
          this.router.navigate(['display-oid4vci-offer'], { state: offertRequest });
      })
  }

  createAuthorizationDetail(): AuthorizationDetail {
    var authDetail = {
      "type": "openid_credential",
      "credential_configuration_id": this.configs.uc2CredentialName()
    } as AuthorizationDetail;
    return authDetail;
  }
}

