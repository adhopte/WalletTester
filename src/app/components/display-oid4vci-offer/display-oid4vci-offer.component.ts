import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Offer } from '../../models/Oid4vciModels';
import { ClipboardModule  } from '@angular/cdk/clipboard';
import { Clipboard } from '@angular/cdk/clipboard';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  imports: [ClipboardModule, NgIf, TranslatePipe, QRCodeComponent, RouterLink],
  selector: 'display-oid4vci-offer',
  templateUrl: './display-oid4vci-offer.component.html',
  styleUrl: './display-oid4vci-offer.component.scss',
  standalone: true,
})
export class DisplayOid4vciOfferComponent {

  private translate = inject(TranslateService);
  offer: Offer | undefined;
  decodedUri = "";
  // QR image returned by the issuer; when absent or unreadable the QR code is
  // generated in the browser from offer.uri instead.
  issuerQrCode: string | null = null;

  constructor(private clipboard: Clipboard, private router: Router) {
    this.offer = this.router.getCurrentNavigation()?.extras.state as Offer | undefined;
    if (this.offer?.uri) {
      this.decodedUri = this.getCredentialOffer(this.offer.uri);
    }
    this.issuerQrCode = this.toImageSrc(this.offer?.qr_code);
  }

  copyDeeplink() {
    this.clipboard.copy(this.offer.uri);
    alert(this.translate.instant('offer.copied'));
  }

  onIssuerQrError() {
    this.issuerQrCode = null;
  }

  private toImageSrc(qrCode: string | undefined): string | null {
    if (!qrCode) {
      return null;
    }
    if (qrCode.startsWith('data:')) {
      return qrCode;
    }
    // Bare base64: browsers detect the actual image type (PNG/JPEG) themselves
    return 'data:image/png;base64,' + qrCode;
  }

  getCredentialOffer(uri: string) {
    const queryString = uri.split('?')[1] ?? '';
    const params = new URLSearchParams(queryString);
    const credentialOfferType = uri.match(/^[^:]+/)?.[0];

    // Offer passed by value (credential_offer) or by reference (credential_offer_uri)
    const offer = params.get("credential_offer") ?? params.get("credential_offer_uri");
    if (offer === null) {
      return decodeURIComponent(uri);
    }
    return credentialOfferType + "://?" + offer;
  }

}
