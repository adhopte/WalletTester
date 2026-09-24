import {ResponseParser} from './../../utils/ResponseParser';
import {LocalStorageService} from './../../services/local-storage.service';
import {TranscationModel, ModelDictionary, DictionaryElement} from '../../models/CreateTranscationModel';
import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, FormBuilder, Validators, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {RestControllerService} from '../../services/rest-controller.service';
import {AccessTokenRequestBody} from '../../models/CreateTranscationModel';
import {ChangeDetectorRef} from '@angular/core';
import {Observable} from 'rxjs';
import {ConfigService} from '../../services/config-service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-create-transcation',
  templateUrl: './create-transcation.component.html',
  styleUrls: ['./create-transcation.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class CreateTranscationComponent implements OnInit {

  transcationForm: FormGroup;
  BusinessID: FormControl;
  LOA: FormControl;
  flowName: FormControl;
  flowType: FormControl;
  source: FormControl;
  action: FormControl;
  errorResponse: string;
  registrationId: FormControl;
  audienceId: FormControl;
  serviceProvider: FormControl;
  clientVersion: FormControl;
  accessToken: FormControl;
  flows = ['COL_RNEC', 'PASSPORT_INPERSON', 'FINLAND_MNO'];

  constructor(private _formbuilder: FormBuilder, private _router: Router,
              private _rest: RestControllerService,
              private _storage: LocalStorageService,
              private _configService: ConfigService,
              public _changeDetector: ChangeDetectorRef) {
  }

  /*
   creates the form elements
   */
  createFormControls() {
    this.BusinessID = new FormControl('6tvgavv67r2vqsfsad52dvahdsad-3baavsd', Validators.required);
    this.LOA = new FormControl('2', Validators.required);
    this.flowName = new FormControl('bp', Validators.required);
    this.flowType = new FormControl(this.flows[0], Validators.required);
    this.source = new FormControl('iOS Demo App', Validators.required);
    this.action = new FormControl('IDENTITY_REGISTRATION', Validators.required);
    this.registrationId = new FormControl('cYm_MPhse0s:APA91bE4m-FdIsbtD46LpRcI05yqnrXSLfwRPV_aLqn9775vK5fA_NuclyD7ZKh_xSOLvjh6ni1SZv6M3kFJhB_8kWIxjDjFO0gtAR0vvYsK0xD7X7IP2ogFKgTnTM7Qgw4dspRZ5JrO', Validators.required);
    this.audienceId = new FormControl('VID', Validators.required);
    this.serviceProvider = new FormControl('ANDROID', Validators.required);
    this.clientVersion = new FormControl('1.0', Validators.required);
    this.accessToken = new FormControl({value: this._storage.getItemFromStorage('accessToken'), disabled: true});
  }

  /*
   Maps the created form with the formgroup
   */
  createForm() {
    this.transcationForm = new FormGroup({
      BusinessID: this.BusinessID,
      LOA: this.LOA,
      FlowName: this.flowName,
      FlowType: this.flowType,
      Source: this.source,
      Action: this.action,
      OperatingSystem: this.serviceProvider,
      AccessToken: this.accessToken,
    });
  }

  ngOnInit() {
    this.flows = this._configService.getAvailableFlows();
    this._storage.clearStorage();
    this.createFormControls();
    this.createForm();
  }

  onSubmit() {
    if (this.transcationForm.valid) {
      console.log('Form Submitted!');
      console.log(this.transcationForm.value);
      var response: string = this.generateModelResponse();
      console.log('Model to JSON : ' + response);
      this.errorResponse = '';
      this._rest.createTransacation('transaction/create', response).subscribe(
        (data: {}) => {
          if (!data || Object.keys(data).length === 0) {
            this.errorResponse = 'An error occurred during transaction creation. Please try again.';
            return;
          }
          var parser = ResponseParser.getParser(this._storage);
          parser.parseCreateTranscationResponse(JSON.stringify(data));
          if (this.flowType.value == this.flows[2]) {
            this._router.navigate(['submit-Finland-attributes']);
          } else if (this.flowType.value == this.flows[1]) {
            this._router.navigate(['submit-Netherlands-attributes']);
          } else {
            this._router.navigate(['submit-Colombia-attributes']);
          }

        },
        (err) => {
          console.log('Execution Error: ' + err.message);
          this.errorResponse = 'Error : \n' + err.message;
        });
    } else {
      // Form is invalid, show validation message
      this.errorResponse = 'Please fill in all required fields correctly.';
    }

  }

  doGetToken(): Observable<any> {
    var accessTokenRequestBody = this.generateAccessTokenJSONParams();
    return this._rest.setUpAccessToken(accessTokenRequestBody);
  }

  getTokenEvent(event: any): void {
    this.doGetToken().subscribe((observable) => {
      console.log('token: ' + this._storage.getItemFromStorage('accessToken'));
      console.log('pre update value ' + this.accessToken.value);
      this.accessToken.setValue(this._storage.getItemFromStorage('accessToken'));
      console.log('post update value ' + this.accessToken.value);
      this._changeDetector.detectChanges();
    });
  }

  /**
   *  This creates the json response to be send as params
   */
  generateModelResponse(): string {
    var dataModel = new TranscationModel();
    var dictionary = new ModelDictionary();
    // create a Dictionary element array
    var dcArray = new Array();
    // create a Dictionary element
    var dc = new DictionaryElement();
    dc.name = this.flowName.value;
    dc.value = this.flowType.value;
    dcArray.push(dc);
    dictionary.element = dcArray;
    dataModel.businessId = this.BusinessID.value;
    dataModel.dictionary = dictionary;
    dataModel.action = this.action.value;
    dataModel.source = this.action.value;
    dataModel.loa = this.LOA.value;
    return JSON.stringify(dataModel);
  }

  private generateAccessTokenJSONParams(): string {
    var requestBody = new AccessTokenRequestBody();
    requestBody.registrationID = this.registrationId.value;
    requestBody.audienceID = this.audienceId.value;
    requestBody.serviceProvider = this.serviceProvider.value;
    requestBody.clientVersion = this.clientVersion.value;
    var paramJSON = JSON.stringify(requestBody);
    return paramJSON;
  }
  selectFlow(flow: string, event: Event) {
    event.preventDefault();
    this.flowType.setValue(flow);
  }


}
