import { Status } from '../../models/ResponseModel';
import { Component, OnInit } from '@angular/core';
import { RestControllerService } from '../../services/rest-controller.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { Router } from '@angular/router';
import { ResponseParser } from '../../utils/ResponseParser';
// import { formArrayNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { environment } from '../../../environments/environment';
import { QRCodeComponent } from 'angularx-qrcode';

declare const qrcode: any;

@Component({
  selector: 'app-get-transcation',
  templateUrl: './get-transcation.component.html',
  styleUrls: ['./get-transcation.component.scss'],
  imports:[ReactiveFormsModule,QRCodeComponent]
})
export class GetTranscationComponent implements OnInit {

   key_identity: string = "";
   errorResponse:string = "";
   statusModel: Status = new Status();
   base64QrCode: string ="data:image/jpeg;base64,";
   base64Url: string = environment.gipsHost;
   domainValue: string = environment.gipsHost;

   transcationForm: FormGroup;
   domain: FormControl;

   private qrCodeImage:Blob;

  constructor(public _rest: RestControllerService,
    public _storage: LocalStorageService) {
    this.key_identity = _storage.getItemFromStorage("identity")
    console.log("IDENTITY_KEY IN Get Transcation : " + this.key_identity);
   }

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.submitRequest();
  }

  createFormControls() {
    this.domain = new FormControl(this.domainValue, Validators.required);
  }


  createForm() {
    this.transcationForm = new FormGroup({
      domain :this.domain,
    })
  }

  onSubmit() {
    this.domainValue = this.domain.value;
    var self = this;
    qrcode.callback = function(decodedInformation:any){
      self.base64Url = self.domainValue + "/enrollment?data=" + btoa(decodedInformation).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };
    qrcode.decode(this.base64QrCode);
  }

  submitRequest(){
    var url = "transactions/" + this.key_identity;
    console.log("Url calling is : " + url);
    this._rest.getTranscation(url).subscribe(
      (data: {}) => {
        console.log("GET TRANSCATION : " + JSON.stringify(data));
        var parser = ResponseParser.getParser(this._storage);
        this.statusModel = parser.parseGetTranscationResponse(JSON.stringify(data))
        if(this.statusModel.identityStatus == "ACCEPTED"){
          this.base64QrCode+=this.statusModel.qrcode;
          var self = this;
          qrcode.callback = function(decodedInformation:any){
            self.base64Url += "/enrollment?data=" + btoa(decodedInformation).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          };
          qrcode.decode(this.base64QrCode);
        }
        else if(this.statusModel.identityStatus == "REJECTED"){
          this.statusModel = null;
          alert("There was an issue with the identity attributes entered. Kindly re-check and try again.")
          window.location.href = "/create-transcation"
        }else if(this.statusModel.identityValidityStatus == "REJECTED"){
          this.statusModel = null;
          alert("There was  an issue with Email/Document entered. Kindly re-check and try again.")
          window.location.href = "/create-transcation"
        }
        else{
          setTimeout(() =>{
            this.statusModel = null
            this.submitRequest(),
            200
          });
        }
        // var test: Blob = this.dataURItoBlob(this.statusModel.qrcode)
        // this.qrCodeImage =  test;
      },
      (err:any) => {
        console.log("Exceution Error: " + err.message)
        this.errorResponse = "Error : \n" + err.message
      });
  }


  dataURItoBlob(dataURI:string):Blob {
    console.log("DATA URI : "+dataURI)
    var binary = atob(dataURI.split(',')[1])
    console.log("Binary : "+binary)
    var array = [];
    for (var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {
      type: 'image/jpg'
    });
  }
}
