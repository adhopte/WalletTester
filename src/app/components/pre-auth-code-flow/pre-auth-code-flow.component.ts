import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject } from '@angular/core';
import { NgForOf } from '@angular/common';
import { RestControllerService } from '../../services/rest-controller.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { CodeRequest, Offer, UseCaseId, UserAttributes } from '../../models/Oid4vciModels';
import { v4 as uuidv4 } from 'uuid';



@Component({
  selector: 'pre-auth-code-flow',
  imports: [MatTableModule, MatSelectModule, NgForOf, TranslatePipe],
  templateUrl: './pre-auth-code-flow.component.html',
  styleUrl: './pre-auth-code-flow.component.scss',
  standalone: true
})
export class PreAuthCodeFlowComponent implements OnInit {
  route = inject(ActivatedRoute);
  dataSet: UserAttributes[] = [];

  staticColumns = ['action'];
  dynamicColumnsPid = ['given_name', 'family_name', 'birthdate', 'email_address', 'mobile_phone_number', 'issuance_date', 'expiry_date'];
  dynamicColumnsDegrees = ['student_given_name', 'student_family_name', 'degree_level', 'degree_subject', 'institution_name', 'graduation_year', 'issuing_authority'];
  dynamicColumnsBirthCertificateSdJwt = ['given_name', 'family_name', 'birthdate', 'doctor', 'hospital', 'issuance_date', 'expiry_date'];
  dynamicColumnsBirthCertificateMdoc = ['given_name', 'family_name', 'birth_date', 'doctor', 'hospital', 'issuance_date', 'expiry_date'];

  dynamicColumns :string[];
  displayedColumns :string[];
  useCaseId = "";

  constructor(private router: Router, private _rest: RestControllerService) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.useCaseId = params["useCaseId"];
    });
    this.buildDisplayedColumns(this.useCaseId);
    this._rest.loadOidDataUser(this.useCaseId).subscribe((res: any) => {
      this.dataSet = res;
    });
  }

  buildDisplayedColumns(useCaseId: string) {
    switch(useCaseId){
      case UseCaseId.oid_pid_inp_uc1:
        this.dynamicColumns = this.dynamicColumnsPid;
        this.displayedColumns = [...this.staticColumns, ...this.dynamicColumnsPid];
        break;
      case UseCaseId.oid_degree_uc1:
        this.dynamicColumns = this.dynamicColumnsDegrees;
        this.displayedColumns = [...this.staticColumns, ...this.dynamicColumnsDegrees];
        break;
      case UseCaseId.oid_birth_certificate_sd_jwt_uc1:
        this.dynamicColumns = this.dynamicColumnsBirthCertificateSdJwt;
        this.displayedColumns = [...this.staticColumns, ...this.dynamicColumnsBirthCertificateSdJwt];
        break;
      case UseCaseId.oid_birth_certificate_mdoc_uc1:
        this.dynamicColumns = this.dynamicColumnsBirthCertificateMdoc;
        this.displayedColumns = [...this.staticColumns, ...this.dynamicColumnsBirthCertificateMdoc];
        break;
      default:
        throw new Error("no use case id found for " + useCaseId)
    }
  }

  getAttributeValue(element: UserAttributes, column: string): string {
    const attribute = element.attributes.find(c => c.name === column);
    return attribute ? attribute.value : '';
  }

  createOffer(user: UserAttributes) {
    var createOfferRequest = {
      "identifier": user.identifier,
      "businessId": uuidv4(),
      "walletIdentifier": user.walletId,
      "authorization_details": [{
        "type": "openid_credential",
        "credential_configuration_id": user.credentialConfigurationId ,
      }]
    } as CodeRequest;
    if(user.credentialId){
      createOfferRequest.authorization_details[0].credential_identifiers = [user.credentialId];
    }
    this._rest.generateOffer('/offer', JSON.stringify(createOfferRequest)).subscribe(
      (offertRequest: Offer) => {
        this.router.navigate(['display-oid4vci-offer'], { state: offertRequest });
      })
  }


}



