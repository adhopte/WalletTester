import { ResponseParser } from '../../utils/ResponseParser';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SubmitAttribute, IdentityDetail, AdditionalAttributes, DocumentDetail } from '../../models/SubmitAttributeModel';
import { LocalStorageService } from '../../services/local-storage.service';
import { RestControllerService } from '../../services/rest-controller.service';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
// import {el} from '@angular/platform-browser/testing/src/browser_util';

@Component({
  selector: 'app-submit-Colombia-attributes',
  templateUrl: './submit-Colombia-attributes.component.html',
  styleUrls: ['./submit-Colombia-attributes.component.scss'],
  imports:[ReactiveFormsModule,CommonModule]
})
export class SubmitColombiaAttributesComponent implements OnInit {

  file: File
  attributeForm: FormGroup;
  documentNumber: FormControl;
  personalNumber: FormControl;
  height: FormControl;
  dateOfExpiry: FormControl;
  bloodType: FormControl;
  givenNames: FormControl;
  surname: FormControl;
  gender: FormControl;
  placeOfBirth: FormControl;
  heightUnit: FormControl;
  dateOfBirth: FormControl;
  nationality: FormControl;
  addAttrKey: FormControl;
  is18: FormControl;
  addAttrValue: FormControl;
  documentType: FormControl;
  issueDate: FormControl;
  firstIssueDatePlace: FormControl;
  signature: FormControl;
  jurisdictionId: FormControl;
  errorResponse: string

  attributeArray = new Array<AdditionalAttributes>()
  urlBase64: any = "";
  fileContent: any = "";
  defaultImage = 'assets/images/default-placeholder.png'
  private key_identity: string = "";

  // form variables
  arrayGivenNames: Array<string> = new Array<string>();

  addImageToAdditionalAttribute(base64Image: string) {
    var portraitAtr = new AdditionalAttributes()
    portraitAtr.name = "frontPortrait"
    portraitAtr.value = this.generateBase64(base64Image)
    this.attributeArray.push(portraitAtr)
  }

  contains(arr:any, itemName:any) : boolean {
    return arr.some(function (item:any) {
      return item.name === itemName;
    });
  }

  isDisabled(): boolean {
    return !this.contains(this.attributeArray, "frontPortrait");
  }

  fileChangeEvent(event: any): void {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.onload = (event: ProgressEvent) => {
        this.urlBase64 = (<FileReader>event.target).result;
        console.log("Portrait Base64 :" + JSON.stringify(this.urlBase64));
        this.addImageToAdditionalAttribute(JSON.stringify(this.urlBase64))
      }
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  /**
   * This gets the base64 from the  string returned by FileReader
   * @param stringToSplit
   */
  generateBase64(stringToSplit: string): string {
    let splitString = stringToSplit.split(",");
    let finalString = splitString[1];
    return finalString.substr(0,(finalString.length-1));
  }


  constructor(private _formbuilder: FormBuilder, private _router: Router,
    private _storage: LocalStorageService,
    private _rest: RestControllerService,
    private _changeDetector: ChangeDetectorRef) {
    this.urlBase64 = this.defaultImage;
    this.key_identity = _storage.getItemFromStorage("identity")
    console.log("IDENTITY_KEY IN SUBMIT ATTRIBUTES : " + this.key_identity);
  }

  /*
   creates the form elements
   */
  createFormControls() {
    this.documentNumber = new FormControl(SubmitColombiaAttributesComponent.randomNumeric(9), Validators.required);
    this.personalNumber = new FormControl(SubmitColombiaAttributesComponent.randomNumeric(10), Validators.required);
    this.dateOfExpiry = new FormControl("2030-11-11", Validators.required);
    this.bloodType = new FormControl("A+");
    this.givenNames = this.buildGivenNames();
    this.surname = new FormControl("FIATTE DU BREUIL HELION DE LA GUERONNIERE", Validators.required);
    this.gender = new FormControl("F");
    this.placeOfBirth = new FormControl("PUERTO LA CRUZ-DISTRITO SOTILLO - ESTADO ANZOATEGU VENEZUELA", Validators.required);
    this.dateOfBirth = new FormControl("1986-02-10", Validators.required);
    this.nationality = new FormControl("COL", Validators.required);
    this.height = new FormControl("153", Validators.required);
    this.heightUnit = new FormControl("si-cm", Validators.required);
    this.addAttrKey = new FormControl("");
    this.addAttrValue = new FormControl("");
    this.documentType = new FormControl("IC", Validators.required);
    this.issueDate = new FormControl("2020-11-11", Validators.required);
    this.firstIssueDatePlace = new FormControl("17-MAY-2013 UNION PANAMERICANA (LAS ANIMAS)", Validators.required);
    this.jurisdictionId = new FormControl("COL", Validators.required);
    this.signature = new FormControl("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", Validators.required);
    this.is18 = this.calculateAgeOverEighteen();
  }


  private buildGivenNames() {
    this.arrayGivenNames.push("CATHARINA");
    this.arrayGivenNames.push("FELICITAS");
    this.arrayGivenNames.push("CHARLOTT");
    this.arrayGivenNames.push("JOHANNA");
    this.arrayGivenNames.push("HENRIETTE");
    this.arrayGivenNames.push("PIA MARIA");
    this.arrayGivenNames.push("RUPERTA");
    return new FormControl("");
  }

  calculateAgeOverEighteen(): FormControl {

    var currentDate: Date = new Date();
    var currentYear: number = currentDate.getFullYear();
    var currentMonth: number = currentDate.getMonth();
    var currentDay:number = currentDate.getDate();

    var birthDate: Date = new Date(this.dateOfBirth.value);
    var birthYear: number = birthDate.getFullYear();
    var birthMonth: number = birthDate.getMonth();
    var birthDay: number = birthDate.getDate();

    if (currentYear - birthYear < 18) {
      return new FormControl("false");
    }
    if (currentYear - birthYear == 18) {
      if (currentMonth < birthMonth) {
        return new FormControl("false");
      }
      if (currentMonth == birthMonth) {
        if (currentDay < birthDay) {
          return new FormControl("false");
        }
      }
    }
    return new FormControl("true");
  }

  static randomNumeric(length:any) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  createForm() {
    this.attributeForm = new FormGroup({
      documentNumber: this.documentNumber,
      personalNumber: this.personalNumber,
      dateOfExpiry: this.dateOfExpiry,
      height: this.height,
      givenNames: this.givenNames,
      surname: this.surname,
      is18: this.is18,
      heightUnit: this.heightUnit,
      gender: this.gender,
      bloodType: this.bloodType,
      placeOfBirth: this.placeOfBirth,
      dateOfBirth: this.dateOfBirth,
      nationality: this.nationality,
      documentType: this.documentType,
      issueDate: this.issueDate,
      firstIssueDatePlace: this.firstIssueDatePlace,
      jurisdictionId: this.jurisdictionId,
      signature: this.signature,
      key: this.addAttrKey,
      value: this.addAttrValue
    });
  }


  ngOnInit() {
    this.createFormControls();
    this.createForm();
  }

  /**
   * Submit form and
   */
  onSubmit() {
    if (this.attributeForm.valid) {
      var paramJSON = this.generateJSONParams()
      console.log("JSON Params : " + paramJSON)
      var url = "transactions/" + this.key_identity + "/identity"
      this.errorResponse = "" // clear the error response before new request
      this._rest.submitAttribute(url, paramJSON).subscribe(
        (data: {}) => {
          var parser = ResponseParser.getParser(this._storage);
          parser.parseSubmitAttributesResponse(JSON.stringify(data))
          this._router.navigate(['get-transcation']);
        },
        (err:any) => {
          console.log("Exceution Error: " + err.message)
          this.errorResponse = JSON.stringify(err)
        });
    } else {
      this.errorResponse = "One or many fields are empty in the Form. Please fill up mandatory fields"
      console.log("Invalid form to submit")
    }
  }

  /**
   *
   * @param event Users can add multiple given names in the list
   */
  addGivenNames() {
    if (this.givenNames.value != "") {
      this.arrayGivenNames.push(this.givenNames.value)
      this.givenNames.patchValue("")
    }
    console.log("Given Names array : " + this.arrayGivenNames);
  }

  /**
   * This deletes the given name user added
   */
  deleteGivenNames(index: number) {
    if (this.arrayGivenNames.length > 0) {
      this.arrayGivenNames.splice(index, 1)
    }
    console.log("Given Names array : " + this.arrayGivenNames);
  }

  signatureChangeEvent(event: any): void {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.onload = (event: ProgressEvent) => {
        this.fileContent = (<FileReader>event.target).result;
        console.log("Signature Base64 :" + JSON.stringify(this.fileContent));
        this.signature.setValue(this.generateBase64(JSON.stringify(this.fileContent)));
      }
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  /**
   * This function is to add more additional attributes
   */
  addAdditionalAttributes() {
    console.log("add additional attributes added ")
    if (this.iterateAttributeArray(this.addAttrKey.value) < 0) {
      var attr = new AdditionalAttributes()
      attr.name = this.addAttrKey.value
      attr.value = this.addAttrValue.value
      this.attributeArray.push(attr)
    }else{
      this.errorResponse ="Value is empty or already exist "

      if(this.iterateAttributeArray(this.addAttrKey.value) < 0){
        this.errorResponse ="if "
      }else{
        this.errorResponse ="else"
      }
    }
  }

  iterateAttributeArray(key: string): number {
    var index: number = -1
    for (var _i = 0; _i < this.attributeArray.length; _i++) {
      if (this.attributeArray[_i].name == "")
        index = _i;
      break;
    }
    console.log("Returning index : "+index)
    return index;
  }


  /**
   * This method deletes the additional attribute added by user
   */
  deleteAttribute(index: number) {
    this.attributeArray.splice(index, 1)
  }

  /**
   * This method generates the json the params field
   */
  private generateJSONParams(): string {
    var resp = new SubmitAttribute()

    var documentModel = new DocumentDetail()
    documentModel.documentNumber = this.documentNumber.value

    documentModel.personalNumber = this.personalNumber.value
    documentModel.dateOfExpiry = this.dateOfExpiry.value
    this.fillUpDocumentInfoAttributes(documentModel)

    var identityModel = new IdentityDetail()
    identityModel.dateOfBirth = this.dateOfBirth.value
    identityModel.givenNames = this.arrayGivenNames
    identityModel.nationality = this.nationality.value
    identityModel.placeOfBirth = this.placeOfBirth.value
    identityModel.surname = this.surname.value
    identityModel.gender = this.gender.value
    // add identity to main model
    resp.identityDetail = identityModel

    // -- add values to add attributes
    identityModel.additionalAttributes = this.attributeArray

    // convert the data into JSON
    var paramJSON = JSON.stringify(resp);

    console.log("Param JSON : " + "**" + paramJSON + "**")
    return paramJSON;
  }

  fillUpDocumentInfoAttributes(documentModel: DocumentDetail) {

    var personalNumber = new AdditionalAttributes()
    personalNumber.name = "personalNumber"
    personalNumber.value = documentModel.personalNumber
    this.attributeArray.push(personalNumber)

    var expiryAtr = new AdditionalAttributes()
    expiryAtr.name = "expireDate"
    expiryAtr.value = documentModel.dateOfExpiry
    this.attributeArray.push(expiryAtr)

    var height = new AdditionalAttributes()
    height.name = "height"
    height.value = this.height.value;
    this.attributeArray.push(height)

    var documentAtr = new AdditionalAttributes()
    documentAtr.name = "documentId"
    documentAtr.value = documentModel.documentNumber
    this.attributeArray.push(documentAtr)

    var bloodType = new AdditionalAttributes()
    bloodType.name = "bloodType"
    bloodType.value = this.bloodType.value
    this.attributeArray.push(bloodType)

    var documentType = new AdditionalAttributes()
    documentType.name = "documentType"
    documentType.value = this.documentType.value
    this.attributeArray.push(documentType)

    var issueDate = new AdditionalAttributes()
    issueDate.name = "issueDate"
    issueDate.value = this.issueDate.value
    this.attributeArray.push(issueDate)

    var firstIssueDatePlace = new AdditionalAttributes()
    firstIssueDatePlace.name = "firstIssueDatePlace"
    firstIssueDatePlace.value = this.firstIssueDatePlace.value
    this.attributeArray.push(firstIssueDatePlace)

    var jurisdictionId = new AdditionalAttributes()
    jurisdictionId.name = "jurisdictionId"
    jurisdictionId.value = this.jurisdictionId.value
    this.attributeArray.push(jurisdictionId)

    var signature = new AdditionalAttributes()
    signature.name = "applicantSignature"
    signature.value = this.signature.value;
    this.attributeArray.push(signature)

    var is18 = new AdditionalAttributes();
    is18.name = "is18";
    is18.value = this.is18.value;
    this.attributeArray.push(is18);

    var lastName1 = new AdditionalAttributes();
    lastName1.name = "lastName1";
    lastName1.value = this.surname.value;
    this.attributeArray.push(lastName1);

    var birthPlace = new AdditionalAttributes();
    birthPlace.name = "birthPlace";
    birthPlace.value = this.placeOfBirth.value;
    this.attributeArray.push(birthPlace);

    var heightUnit = new AdditionalAttributes();
    heightUnit.name = "heightUnit";
    heightUnit.value = this.heightUnit.value;
    this.attributeArray.push(heightUnit);
  }
}
