import {Component, OnInit, ViewChild} from '@angular/core';
import {Router, UrlSerializer} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatSelectModule} from '@angular/material/select';
import { RestControllerService } from '../../services/rest-controller.service';
import {MatTableModule} from '@angular/material/table';
import { fromBER,Integer,OctetString } from 'asn1js';
import { User, MRZData } from '../dtc-users/dtc-users.component';
import { DictionaryElement, ModelDictionary, TranscationModel } from '../../models/CreateTranscationModel';
import { environment } from "../../../environments/environment"
import {v4 as uuidv4} from 'uuid';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import {ChangeDetectionStrategy, inject} from '@angular/core';
import { ResponseParser } from '../../utils/ResponseParser';
import { LocalStorageService } from '../../services/local-storage.service';
import { AdditionalAttributes, DocumentDetail, IdentityDetail, SubmitAttribute } from '../../models/SubmitAttributeModel';
import { ConfigService } from '../../services/config-service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'dtc-transaction',
  templateUrl: './dtc-transaction.component.html',
  styleUrls: ['./dtc-transaction.component.scss'],
  imports: [CommonModule, MatTableModule,FormsModule],
  standalone: true
})
export class DtcTransactionComponent implements OnInit {

  displayedColumns = ['action','documentNumber', 'firstName', 'lastName', 'documentType','dob','doe','dg1'];
  readonly dialog = inject(MatDialog);
  user: User
  image: any;
  jpegImageBase64:any='bdsfjddfj';
  constructor(private router:Router,private _rest: RestControllerService,
    private _storage: LocalStorageService, private configs:ConfigService) {
    this.user=this.router.getCurrentNavigation().extras.state as User; // should log out 'bar'
  }
  
  
  ngOnInit() {
    this.jpegImageBase64=this.decodeDG2(this.base64ToArrayBuffer(this.user.dg2));
  }
  

  decodeDG2(buffer: ArrayBuffer): string{
    const result = fromBER(buffer);
    if (result.offset === -1) throw new Error('Failed to parse DG1');

    const dg2Element = result.result;
        // Check [APPLICATION 2] IMPLICIT OCTET STRING
    if (dg2Element.idBlock.tagClass !== 2 || dg2Element.idBlock.tagNumber !== 21) {
      throw new Error("Invalid DG2: Expected [APPLICATION 2]");
    }
    const bioInfoHdr = (dg2Element.valueBlock as any).value[0];
    if (bioInfoHdr.idBlock.tagNumber !== 97) {
      throw new Error('Expected [APPLICATION 97] Bio info header element');
    }

    const bioInfo = (bioInfoHdr.valueBlock as any).value[1];
    if (bioInfo.idBlock.tagNumber !== 96) {
      throw new Error('Expected [APPLICATION 96] Bio info element');
    }

    const templateData=(bioInfo.valueBlock as any).value[1]
    if (templateData.idBlock.tagNumber !== 46) {
      throw new Error('Expected [APPLICATION 46] Bio data element');
    }
    // Since it's IMPLICIT, it won't be parsed — manually wrap in OctetString
    const octetString = new OctetString({ valueHex: templateData.valueBlock.valueHex });
    const imageBytes = new Uint8Array(octetString.valueBlock.valueHex);
    return this.arrayBufferToBase64(imageBytes);
  }
  
  findImageStart(bytes: any) {
    const jpegSig = [0xFF, 0xD8, 0xFF];
    const jp2Sig = [0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20];
    
    for (let i = 0; i < bytes.length - 8; i++) {
      const isJPEG = jpegSig.every((b, j) => bytes[i + j] === b);
      const isJP2 = jp2Sig.every((b, j) => bytes[i + j] === b);
      if (isJPEG || isJP2) {
        return {
          offset: i,
          format: isJPEG ? 'jpeg' : 'jp2'
        };
      }
    }
    
    return null; // not found
  }
  
  arrayBufferToBase64(buffer: Uint8Array): string {
    const result = this.findImageStart(buffer);
    let binary = '';
    buffer.slice(result.offset).forEach(b => binary += String.fromCharCode(b));
    // if(result.format == 'jpeg'){
    //   return btoa(binary);
    // }else{
    //   this._rest.convertJp2(buffer.slice(result.offset)).subscribe(response => {
    //     this.jpegImageBase64 = response.jpegBase64;
    //   });
    // }
    if(result.format == 'jpeg'){
      return `data:image/jpeg;base64,${btoa(binary)}`;
    }else {
      return `data:image/jp2;base64,${btoa(binary)}`;
    }
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
  
  createTxnBody(): string {
    var dataModel = new TranscationModel();
    var dictionary = new ModelDictionary();
    // create a Dictionary element array
    var dcArray = new Array();
    // create a Dictionary element
    var dc = new DictionaryElement();
    dc.name = 'bp';
    dc.value = this.configs.dtcFlowName();
    dcArray.push(dc);
    dictionary.element = dcArray;
    dataModel.businessId = uuidv4();
    dataModel.dictionary = dictionary;
    dataModel.action = 'IDENTITY_REGISTRATION';
    dataModel.source = 'ANDROID';
    dataModel.loa = '2';
    return JSON.stringify(dataModel);
  }

  submitAttributesBody(): string {
    var resp = new SubmitAttribute()

    var documentModel = new DocumentDetail()
    documentModel.documentNumber = this.user.mrz.documentNumber
    documentModel.dateOfExpiry = this.user.mrz.dateOfExpiry
    // this.fillUpDocumentInfoAttributes(documentModel)

    var identityModel = new IdentityDetail()
    identityModel.dateOfBirth = this.convertYYMMDDtoYYYYMMDD(this.user.mrz.yyMMdd)
    identityModel.givenNames = [this.user.mrz.firstName]
    identityModel.nationality = this.user.mrz.nationality
    identityModel.placeOfBirth = this.user.mrz.nationality
    identityModel.surname = this.user.mrz.lastName
    identityModel.gender = this.user.mrz.sex
    // add identity to main model
    resp.identityDetail = identityModel

    // -- add values to add attributes
    identityModel.additionalAttributes = new Array<AdditionalAttributes>();
    this.fill(identityModel,"documentType",this.user.mrz.documentType);
    this.fill(identityModel,"DG1.RawData",this.user.dg1);
    this.fill(identityModel,"DG2.RawData",this.user.dg2);
    this.fill(identityModel,"DG3.RawData",this.user.dg3);
    this.fill(identityModel,"DG4.RawData",this.user.dg4);
    this.fill(identityModel,"DG5.RawData",this.user.dg5);
    this.fill(identityModel,"DG6.RawData",this.user.dg6);
    this.fill(identityModel,"DG7.RawData",this.user.dg7);
    this.fill(identityModel,"DG8.RawData",this.user.dg8);
    this.fill(identityModel,"DG9.RawData",this.user.dg9);
    this.fill(identityModel,"DG10.RawData",this.user.dg10);
    this.fill(identityModel,"DG11.RawData",this.user.dg11);
    this.fill(identityModel,"DG12.RawData",this.user.dg12);
    this.fill(identityModel,"DG13.RawData",this.user.dg13);
    this.fill(identityModel,"DG14.RawData",this.user.dg14);
    this.fill(identityModel,"DG15.RawData",this.user.dg15);
    this.fill(identityModel,"DG16.RawData",this.user.dg16);
    this.fill(identityModel,"DG29.RawData",this.user.sod);
    this.fill(identityModel,"frontPortrait",this.jpegImageBase64.substring(this.jpegImageBase64.indexOf(",")+1));
    
    // convert the data into JSON
    var paramJSON = JSON.stringify(resp);

    // console.log("Param JSON : " + "**" + paramJSON + "**")
    return paramJSON;
  }

  fill(identityModel: IdentityDetail, name: string, value: string) {
    if(value){
      const attr=new AdditionalAttributes();
      attr.name=name;
      attr.value=value;
      identityModel.additionalAttributes.push(attr);
    }
  }
  
  createTransaction() {
    this._rest.createTransacation('transaction/create', this.createTxnBody()).subscribe(
      (data: {}) => {
        if (!data || Object.keys(data).length === 0) {
          this.dialog.open(DialogElementsExampleDialog);
          return;
        }
        var parser = ResponseParser.getParser(this._storage);
        parser.parseCreateTranscationResponse(JSON.stringify(data));
        const txnId = this._storage.getItemFromStorage("identity")
        var paramJSON = this.submitAttributesBody()
        console.log("JSON Params : " + paramJSON)
        var url = "transactions/" + txnId + "/identity"
        this._rest.submitAttribute(url, paramJSON).subscribe(
          (data: {}) => {
            var parser = ResponseParser.getParser(this._storage);
            parser.parseSubmitAttributesResponse(JSON.stringify(data))
            this.router.navigate(['get-transcation']);
          },
          (err:any) => {
            console.log("Exceution Error: " + err.message)
            this.dialog.open(DialogElementsExampleDialog);
          });

      },
      (err) => {
        console.log('Execution Error: ' + err.message);
        this.dialog.open(DialogElementsExampleDialog);
      });
  }

  convertYYMMDDtoYYYYMMDD(yyMMdd: string): string {
    if (!/^\d{6}$/.test(yyMMdd)) {
      throw new Error("Invalid YYMMDD format");
    }
  
    const yy = yyMMdd.slice(0, 2);
    const mm = yyMMdd.slice(2, 4);
    const dd = yyMMdd.slice(4, 6);
    console.log(new Date().getFullYear());
    console.log(new Date().getUTCFullYear());
    if(parseInt(yy) < 25)
      return `20${yy}-${mm}-${dd}`
    return `19${yy}-${mm}-${dd}`
  }
  
}


@Component({
  selector: 'dialog-elements-example-dialog',
  templateUrl: 'error-dialog.html',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogElementsExampleDialog {}

