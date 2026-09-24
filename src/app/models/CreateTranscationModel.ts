export class TranscationModel {
// {
//     "businessId": "default",
//         "loa": "2",
//             "dictionary": {
//         "element": [
//             {
//                 "value": "IN_PERSON",
//                 "name": "bp"
//             }
//         ]
//     },
//     "source": "iOS demo",
//         "action": "IDENTITY_REGISTRATION"
// }
    businessId: string = 'default'
    loa: string = '2'
    dictionary: ModelDictionary
    source: string = 'iOS demo'
    action: string = 'IDENTITY_REGISTRATION'
}

export class ModelDictionary{
    element: Array<DictionaryElement>
}

export class DictionaryElement{
    value:string=""
    name:string="bp"
}

export class AccessTokenRequestBody {
  registrationID: string
  audienceID: string
  serviceProvider: string
  clientVersion: string
}
