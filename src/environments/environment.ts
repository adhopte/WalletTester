// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  gipsHost: "https://api.mid-lab-dev.eu.identity-stg.idemia.io",
  gipsBasePath: "/gips",

  // run app to target local oid4vci-adapter. CHeck Readme.md
  //oid4vciBasePath: "/oid-vci-adapter/v1",
  oid4vciBasePath: "",

  // use Sor in local
  // sorHost: "http://localhost:8082",
  sorBasePath: "/api",
  useSorServer: false
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
