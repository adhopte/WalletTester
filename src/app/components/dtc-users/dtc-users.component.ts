import {Component, OnInit, ViewChild} from '@angular/core';
import {Router, UrlSerializer} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatSelectModule} from '@angular/material/select';
import { RestControllerService } from '../../services/rest-controller.service';
import {MatTableModule} from '@angular/material/table';
import { fromBER,OctetString } from 'asn1js';
@Component({
  selector: 'dtc-users',
  templateUrl: './dtc-users.component.html',
  styleUrls: ['./dtc-users.component.scss'],
  imports: [CommonModule, MatTableModule],
  standalone: true
})
export class DtcUsersComponent implements OnInit {

  displayedColumns = ['action','documentNumber', 'firstName', 'lastName', 'documentType','dob','doe','dg1'];
  dataSet: User[]
  constructor(private router:Router,private _rest: RestControllerService) {
  }


  ngOnInit() {
    this._rest.loadDTCUsers().subscribe( (res : any) => {
      this.dataSet=res;
      this.dataSet.forEach((rec:User)=>{
         rec.mrz=this.processDG1(rec,this.base64ToArrayBuffer(rec.dg1));
        //  rec.photo=this.decodeDG2(this.base64ToArrayBuffer(rec.dg2));
      })
    });
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64); // decode base64 to binary string
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }


  createTransaction(userData:User) {
    this.router.navigate(['dtc-transaction'],{state: userData});
  }

  





  // Parse DG1 buffer and extract MRZ string
  decodeDG1(buffer: ArrayBuffer): string {
    const dg1Result = fromBER(buffer);
    if (dg1Result.offset === -1) throw new Error('Failed to parse DG1');

    const dg1Element = dg1Result.result;
    if (dg1Element.idBlock.tagNumber !== 1 || !dg1Element.idBlock.isConstructed) {
      throw new Error('Not a valid [APPLICATION 1] DG1 structure');
    }

    const mrzElement = (dg1Element.valueBlock as any).value[0];
    if (mrzElement.idBlock.tagNumber !== 31) {
      throw new Error('Expected [APPLICATION 31] MRZ element');
    }

    // Decode inner OCTET STRING (MRZ data)
    const mrzBuffer = mrzElement.valueBlock.valueHex;
    return new TextDecoder().decode(mrzBuffer);
  }

  // Parse TD3 MRZ (used in passports)
   parseMrzTd3(mrz: string): MRZData {
     if(mrz.length !=88)
      throw new Error('Invalid TD3 MRZ format');

    const [line1, line2] = [mrz.substring(0,44),mrz.substring(44)];

    return {
      documentType: line1.slice(0, 1),
      issuingCountry: line1.slice(2, 5),
      lastName: line1.substring(5, line1.indexOf('<<')).replace(/</g, ' ').trim(),
      firstName: line1.substring(line1.indexOf('<<') + 2).replace(/</g, ' ').trim(),
      documentNumber: line2.slice(0, 9).replace(/</g, ''),
      nationality: line2.slice(10, 13),
      dateOfBirth: this.convertYYMMDDtoDDMMYY(line2.slice(13, 19)),
      yyMMdd:line2.slice(13,19),
      sex: line2.slice(20, 21),
      dateOfExpiry: this.convertYYMMDDtoDDMMYY(line2.slice(21, 27)),
      optionalData: line2.slice(28, 42).replace(/</g, '').trim()
    };
  }

  convertYYMMDDtoDDMMYY(yyMMdd: string): string {
    if (!/^\d{6}$/.test(yyMMdd)) {
      throw new Error("Invalid YYMMDD format");
    }

    const yy = yyMMdd.slice(0, 2);
    const mm = yyMMdd.slice(2, 4);
    const dd = yyMMdd.slice(4, 6);

    return `${dd}-${mm}-${yy}`;
  }


  // Example usage (DG1 input as ArrayBuffer)
   processDG1(user:User,rawBytes: ArrayBuffer) {
    try {
      const mrzString = this.decodeDG1(rawBytes);
      user.mrzRaw=mrzString;
      const mrzData = this.parseMrzTd3(mrzString);
      console.log('Parsed MRZ Data:', mrzData);
      return mrzData;
    } catch (err) {
      console.error('Error:', err);
    }
    return null;
  }

}
export interface User {
  dg1: string;
  dg2: string;
  dg3: string;
  dg4: string;
  dg5: string;
  dg6: string;
  dg7: string;
  dg8: string;
  dg9: string;
  dg10: string;
  dg11: string;
  dg12: string;
  dg13: string;
  dg14: string;
  dg15: string;
  dg16: string;
  sod: string;
  photo: string;
  mrz: MRZData;
  mrzRaw: string;
}
export interface MRZData {
  documentType: string;
  issuingCountry: string;
  lastName: string;
  firstName: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth: string;
  yyMMdd: string;
  sex: string;
  dateOfExpiry: string;
  optionalData?: string;
}