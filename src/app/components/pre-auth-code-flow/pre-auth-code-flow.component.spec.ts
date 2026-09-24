import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreAuthCodeFlowComponent } from './pre-auth-code-flow.component';
import { RestControllerService } from '../../services/rest-controller.service';
import { Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UseCaseId, UserAttributes } from '../../models/Oid4vciModels';
import { Router } from  '@angular/router';

const useCaseIdSelected = UseCaseId.oid_degree_uc1
const offer = {
      qr_code: "qr_code",
      uri: "openid-credential-offer://?credential_offer=%7B%22credenti...",
      tx_code: "MFCKev",
      authorization_code: "c0caf2fd-7715-4179-8cf4-a6faf3c45d13"
    };
class MockRestService {
  generateOffer(url: string): Observable<any> {
    return of(offer);
  }
  loadOidDataUser(useCaseId: string): Observable<any> {
    expect(useCaseId).toBe(useCaseIdSelected)
    return of([
      { identifier: "one identifier", attributes: [{ name: "firstname", "value": "bob" }] },
      { identifier: "two identifier", attributes: [{ name: "firstname", "value": "roger" }] }
    ])
  }
}

export function mockActivatedRoute(params?: any): Partial<ActivatedRoute> {
  return {
    params: of(params || {}),
  };
}

describe('PreAuthCodeFlowComponent', () => {
  let component: PreAuthCodeFlowComponent;
  let fixture: ComponentFixture<PreAuthCodeFlowComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);

    await TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: RestControllerService, useClass: MockRestService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute({ useCaseId: useCaseIdSelected }) }
      ],
      imports: [PreAuthCodeFlowComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PreAuthCodeFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build displayed columns with different Use Case Id', () => {
    component.buildDisplayedColumns(UseCaseId.oid_pid_inp_uc1)
    expect(component.displayedColumns).toEqual(jasmine.arrayContaining(['action', 'identifier', 'firstName', 'lastName']))

    component.buildDisplayedColumns(UseCaseId.oid_degree_uc1)
    expect(component.displayedColumns).toEqual(jasmine.arrayContaining(['action', 'identifier', 'student_given_name', 'degree_level',]))

  });

  it('should failed the build of displayed columns on unknown Use Case Id', () => {
    expect(() => component.buildDisplayedColumns(UseCaseId.oid_pid_idp_uc2)).toThrowError("no use case id found for oid_pid_idp_uc2")
  });

  it('should get the attribute value for a given attribute name', () => {
    const json = { identifier: "one identifier", attributes: [{ name: "firstname", "value": "bob" }] } as UserAttributes
    expect(component.getAttributeValue(json, "firstname")).toBe("bob")

    expect(component.getAttributeValue(json, "unknown")).toBe("")
  });

  it('should create an offer from rest service and browse to display-oid4vci-offer', () => {
    const json = { identifier: "one identifier", attributes: [{ name: "firstname", "value": "bob" }] } as UserAttributes
    component.createOffer(json);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['display-oid4vci-offer'],{state: offer});
  });

});
