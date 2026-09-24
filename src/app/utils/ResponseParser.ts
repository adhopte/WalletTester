import { IdentityDetail } from '../models/SubmitAttributeModel';
import { Status } from '../models/ResponseModel';
import { LocalStorageService } from './../services/local-storage.service';
import { Parser } from '@angular/compiler';
import { throwError } from 'rxjs';

export class ResponseParser {

    private static parser:ResponseParser
    private storage:LocalStorageService

    private constructor(_storgae:LocalStorageService){
      this.storage = _storgae
      console.log("Response Parser constructer called")
    }

    public static getParser(storage:LocalStorageService):ResponseParser{
      if(ResponseParser.parser!=null){
        return ResponseParser.parser
      }else{
          ResponseParser.parser = new ResponseParser(storage)
        return ResponseParser.parser
      }
    }

    /**
     * This parses the response from create transcation and saves it to sessionstorage
     * @param response
     */
    parseCreateTranscationResponse(response:string){
      var respObject = JSON.parse(response)
      if(respObject!=null){
        // save the response into session storage
        this.storage.saveToStorage("create-transaction-response", response)
        // get values from response
        var txnId = respObject.identifier
        var accessToken = respObject.accessToken

        // save values in local storage
        this.storage.saveToStorage("identity", txnId)

        // save new access token in local storage
        this.storage.saveToStorage("accessToken", accessToken)
       }else{
         throwError(
           "CreateTransactionAPI Parser :  Invalid JSON to parse"
         )
       }
    }

    parseAccessTokenResponse(response:string){
      var respObject = JSON.parse(response)
      if(respObject!=null){
        this.storage.saveToStorage("get-access-token-response", response)
        var accessToken = respObject.accessToken
        this.storage.saveToStorage("accessToken", accessToken)
        return accessToken
      }else{
        throwError("GetAccessTokenAPI Parser :  Invalid JSON to parse")
      }
    }


    /**
     * Parses the submit attributes response and saves the output in session storage
     * @param response
     */
    parseSubmitAttributesResponse(response: string){
      var respObject = JSON.parse(response)
      if (respObject != null) {
        // save the response into session storage
        this.storage.saveToStorage("submit-attributes-response", response)

        // get values from response

        // save values in local storage

      } else {
        throwError(
            "SubmitAttributesAPI Parser :  Invalid JSON to parse"
        )
      }
    }

    /**
     * This parse the Get Transaction response and saves the required data into session storage
     * @param response
     */
    parseGetTranscationResponse(response:string):Status{
      var model:Status = new Status()
      var respObject = JSON.parse(response)
      if (respObject != null) {
        // save the response into session storage
        this.storage.saveToStorage("get-transaction", response)
        model.identityStatus = respObject.status.states.IDENTITY_ATTRIBUTES
        model.identityValidityStatus = respObject.status.states.IDENTITY_ATTRIBUTES_VALIDITY
        model.id = respObject.id
        model.email = respObject.email
        model.qrcode = respObject.qrCode
        // save values in local storage
      } else {
        throwError(
          "GetTransactionAPI Parser :  Invalid JSON to parse"
        )
      }
      return model
    }
}
