import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { LocalStorageService } from '../../services/local-storage.service';
import { RestControllerService } from '../../services/rest-controller.service';
import { GetTranscationComponent } from './get-transcation.component';

class MockRestService {
  getTranscation(url:string):Observable<any>{
    return of({status:{
      global: "EXPECTING_INPUT",
      expectedData: [
        "GENERIC_OTP"
      ],
      states: {
        "IDENTITY_ATTRIBUTES": "ACCEPTED",
        "GENERIC_OTP": "NOT_SET"
      }
    },qrCode:"qr-code"});
  }
}

describe('GetTransactionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers:[
        {provide:RestControllerService,useClass:MockRestService}
      ]
    }).compileComponents();
    (window as any).qrcode = {
      decode(str:string){
        expect(str).toBe('data:image/jpeg;base64,qr-code');
      }
    };
  });

  it('should create get transaction component', () => {
    const fixture = TestBed.createComponent(GetTranscationComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });

  it(`should get the qrcode`, () => {
    const fixture = TestBed.createComponent(GetTranscationComponent);
    const app = fixture.componentInstance;
    let storageService:LocalStorageService= TestBed.inject(LocalStorageService);
    storageService.saveToStorage("identity","abcd");
    app.ngOnInit();
  });

});
