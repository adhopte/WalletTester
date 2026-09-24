import { Component, OnInit } from '@angular/core';
import { RestControllerService } from '../../services/rest-controller.service';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Offer } from '../../models/Oid4vciModels';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardModule  } from '@angular/cdk/clipboard';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  imports: [ClipboardModule , MatIconModule, NgIf],
  selector: 'display-oid4vci-offer',
  templateUrl: './display-oid4vci-offer.component.html',
  styleUrl: './display-oid4vci-offer.component.scss',
  standalone: true,
})
export class DisplayOid4vciOfferComponent implements OnInit {

  offer: Offer;
  decodedUri: string;
  base64QrCode: string = "data:image/jpeg;base64,";

  constructor(private clipboard: Clipboard, private router: Router, private _rest: RestControllerService) {
    this.offer = this.router.getCurrentNavigation().extras.state as Offer; // should log out 'bar'
    this.decodedUri = this.getCredentialOffer(this.offer.uri)
    this.base64QrCode += this.offer?.qr_code
  }

  copyDeeplink() {
    this.clipboard.copy(this.offer.uri);
    alert('Deeplink copied to clipboard!');
  }


  getCredentialOffer(uri: string) {
    const queryString = uri.split('?')[1];
    const params = new URLSearchParams(queryString);
    const credentialOfferType = uri.match(/^[^:]+/)?.[0];

    // Extract encoded credential_offer
    const encoded = params.get("credential_offer");

    // Decode URL encoding
    const decoded = decodeURIComponent(encoded);

    return credentialOfferType + "://?" + decoded;
  }

  ngOnInit(): void {

  }

}
