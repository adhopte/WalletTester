// {
//     "contactDetail": {
//         "phone": "06669223344",
//             "email": "{{user}}"
//     },
//     "identityDetail": {
//         "givenNames": [
//             "james"
//         ],
//             "surname": "moore",
//                 "placeOfBirth": "coucou",
//                     "dateOfBirth": "11-12-2000",
//                         "nationality": "france",
//                             "additionalAttributes": [
//                                 {
//                                     "value": "azeazeazea",
//                                     "name": "portraitReference"
//                                 }
//                             ]
//     },
//     "identityRef": ""
// }

export class SubmitAttribute {
    contactDetail: ContactDetail;
    //documentDetail: DocumentDetail;
    identityDetail: IdentityDetail;
    // identityRef:string
}

export class ContactDetail {
    email: string
    phone:string
}

export class DocumentDetail {
    documentType: string;
    documentNumber: string;
    personalNumber: string;
    dateOfIssue: string;
    dateOfExpiry: string;
    is18: string;
}

export class IdentityDetail {
    givenNames: Array<string>;
    surname: string;
    gender: string;
    placeOfBirth: string;
    dateOfBirth: string;
    nationality: string;
    familyName: string;
    additionalAttributes: Array<AdditionalAttributes>
}

export class AdditionalAttributes {
    value: string;
    name: string;
}

