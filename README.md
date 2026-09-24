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