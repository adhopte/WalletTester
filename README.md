# CivicQrCodeGenerator

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.1.2.

## Development angular js server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/in-person-portal`. The app will automatically reload if you change any of the source files.
If in environment.ts `useSorServer` is true then you need to start the node js server to deliver data from the server. 

## Development node js server

Go to ./src/sor
Run `node Server.js` for a dev server. 
 * On your browser call `http://localhost:8082/sor/user-0000?credential_identifier=loyalty`. You query the server by identifier to get one user
 * On your browser call `http://localhost:8082/sor/loyalty`. You query the server by credential identifier to get all the users on a specific credential.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Set up app to target local oic-4-vci adapter 

To run app to target local oid4vci-adapter, update env.js as 
   * window["env"]["oid4vciHost"] = "http://localhost:8080";
   * window["env"]["sorHost"] = "https://localhost:8082";
Also in environment.ts file
   * `oid4vciBasePath: "/oid-vci-adapter/v1"`
   
   
## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Docker build

Docker container consist of prod dist in nginx server. It is necessary to provide separate proxy in front of it to forward traffic fo either this portal or IPV depending on the path.
To build docker we run docker-build.sh 

## Deployment in AWS or on premise

While `ng serve` is a proper choice for developer purposes, in other cases it is possible that we would like to run app in AWS or just anywhere in docker container.
It would require proxy mentioned before in most cases, however in AWS we can use already existing services provided by Amazon: AWS S3 for hosting static content (dist, not docker container)
and API Gateway as a proxy. If we choose to use docker container we can use any proxy of our choice as this app is not provided with any proxy.


## Using env variables

To use env variables perform `ng build --prod` this will build this project with production environment file, containing env variables. Next build docker image using dockerfile and run it with variables `docker run --env IPV_HOST="HOST" --env IPV_BASE_PATH="/ipv" -p 80:80 in-person-portal`

defaults:
`IPV_HOST = ""` <- points to localhost
`IPV_BASE_PATH = "/gips"`
## Localization

The portal UI is available in English, French and Polish, using [ngx-translate](https://github.com/ngx-translate/core).

- Translations live in `src/assets/i18n/{en,fr,pl}.json` and are loaded at runtime.
- Users switch language with the EN / FR / PL buttons in the header. The choice is saved in `localStorage`; on first visit the browser language is used if supported, otherwise English.
- In templates use the `translate` pipe (`{{ 'home.selectUseCase' | translate }}`); in code use `TranslateService.instant(...)`.
- To add a string, add the same key to all three JSON files. Missing keys fall back to English.
- To add a language, add a JSON file and register it in `LanguageService.languages` (`src/app/services/language.service.ts`).

## Deploying to Render.com

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/adhopte/WalletTester/tree/civic-portal)

`Dockerfile.render` builds a self-contained image: it compiles the Angular app, serves it with nginx under `/in-person-portal/`, and runs the SOR server (`src/sor/Server.js`). nginx takes over the routing that Istio does in Kubernetes. The existing `Dockerfile` (Jenkins/Helm) is unchanged apart from the PID mDoc data file.

1. In Render, choose **New → Blueprint** and select this GitHub repo. Render reads `render.yaml` and creates the `civic-portal` web service from the `civic-portal` branch.
2. Environment variables (all have defaults in the image):
   - `ISSUER_URL`: the OID4VCI credential issuer. Default `https://issuer.eu-wallet.prep.smartid.nuagein.io` (metadata at `/.well-known/openid-credential-issuer`). The portal's `POST /offer` and metadata requests go through this service's nginx, so the issuer does not need CORS for the Render domain. Takes precedence over the older `OID_4_VCI_HOST`.
   - `PORTAL_USE_CASES`: use cases listed on the home page. Default `["oid_pid_mdoc_uc1","oid_birth_certificate_sd_jwt_uc1"]` (PID mDoc and birth certificate SD-JWT). Takes precedence over the older `SUPPORTED_USE_CASES`.
   - `GIPS_UPSTREAM`: base URL of the GIPS API (for the `classic` and DTC use cases). Leave empty if not used.
3. Deploy. The portal is served at `https://<service>.onrender.com/in-person-portal/`, and `/` redirects there.

### Issuance flow (PID mDoc, birth certificate)

1. The agent picks a credential and a pre-authorized citizen record (`src/assets/jsons/pid_mdoc_claims.json`, `birth_certificate_claims_sd_jwt.json`).
2. The citizen's date of birth and NPI are checked by the SOR server (`POST /api/in-person-portal-sor/<use case>/sor/<identifier>/verify`), which simulates a check against the national register. The NPI is never sent to the browser or to the issuer; the record list only shows its last 4 digits. Three failed attempts block the record until the page is reloaded.
3. Only then is the credential offer created and its QR code shown. The `credential_configuration_id` is taken from the issuer's metadata (`src/app/services/credential-config.service.ts`), falling back to the id stored in the record.

Test citizens (date of birth / NPI): Koffi Adjovi 1988-03-14 / 1203456781, Aïcha Dossou 1995-07-22 / 1304567892, Sèna Houngbédji 1979-11-02 / 1405678903, Rachida Bio 2001-01-30 / 1506789014 (PID); Mahougnon Agossou 2026-04-10 / 2504123456, Fifamè Kpadonou 2023-11-17 / 2504234567, Ayaba Zinsou 2025-08-05 / 2504345678 (birth certificate).

To test the image locally: `docker build -f Dockerfile.render -t civic-portal . && docker run -p 10000:10000 civic-portal`, then open http://localhost:10000.
