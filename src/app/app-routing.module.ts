import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateTranscationComponent } from './components/create-transcation/create-transcation.component';
import { SubmitNetherlandsAttributesComponent } from './components/submit-Netherlands-attributes/submit-Netherlands-attributes.component';
import { SubmitFinlandAttributesComponent } from './components/submit-Finland-attributes/submit-Finland-attributes.component';
import { SubmitColombiaAttributesComponent } from './components/submit-Colombia-attributes/submit-Colombia-attributes.component';
import { GetTranscationComponent } from './components/get-transcation/get-transcation.component';
import { HomeComponent } from './components/home/home.component';
import { DtcUsersComponent } from './components/dtc-users/dtc-users.component';
import { DtcTransactionComponent } from './components/dtc-transaction/dtc-transaction.component';
import { PreAuthCodeFlowComponent } from './components/pre-auth-code-flow/pre-auth-code-flow.component';
import { DisplayOid4vciOfferComponent } from './components/display-oid4vci-offer/display-oid4vci-offer.component';


export const routes: Routes = [
  { path: '',   redirectTo: '/home', pathMatch: 'full' },
  { path: 'create-transcation', component: CreateTranscationComponent },
  { path: 'submit-Netherlands-attributes', component: SubmitNetherlandsAttributesComponent },
  { path: 'submit-Finland-attributes', component: SubmitFinlandAttributesComponent },
  { path: 'submit-Colombia-attributes', component: SubmitColombiaAttributesComponent },
  { path: 'get-transcation', component: GetTranscationComponent },
  { path: 'home', component: HomeComponent },
  { path: 'dtc-users', component: DtcUsersComponent },
  { path: 'dtc-transaction', component: DtcTransactionComponent },
  { path: 'pre-auth-code-flow/:useCaseId', component: PreAuthCodeFlowComponent },
  { path: 'display-oid4vci-offer', component: DisplayOid4vciOfferComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
