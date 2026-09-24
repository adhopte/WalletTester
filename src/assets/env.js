(function(window) {
  window["env"] = window["env"] || {};

  // Environment variables
  window["env"]["ipvHost"] = "";
  window["env"]["ipvBasePath"] = "";
  window["env"]["oid4vciHost"] = "https://issuer.mid-lab-dev.eu.identity-stg.idemia.io";
  window["env"]["sorHost"] = "https://issuer.mid-lab-dev.eu.identity-stg.idemia.io";
  window["env"]["flows"]={};
  window["env"]["flows"]["supportedUseCases"] = ["classic","dtc_type1_inp","oid_pid_inp_uc1","oid_degree_uc1", "oid_birth_certificate_sd_jwt_uc1", "oid_birth_certificate_mdoc_uc1", "oid_pid_idp_uc2"];
  window["env"]["flows"]["DTC_FLOW_NAME"] = "ICAO_INPERSON-DTC";
  window["env"]["flows"]["DTC_DATA_FILE"] = "/assets/jsons/dtc_type1_data.json";
  window["env"]["flows"]["USER_PID_CLAIMS_FILE"] = "/assets/jsons/user_pid_claims.json";
  window["env"]["flows"]["USER_DEGREE_CLAIMS_FILE"] = "/assets/jsons/user_degree_claims.json";
  window["env"]["flows"]["USER_BIRTH_CERTIFICATE_CLAIMS_SD_JWT_FILE"] = "/assets/jsons/birth_certificate_claims_sd_jwt.json";
  window["env"]["flows"]["USER_BIRTH_CERTIFICATE_CLAIMS_MDOC_FILE"] = "/assets/jsons/birth_certificate_claims_mdoc.json";
  window["env"]["uc2CredName"] = "eu.europa.ec.eudi.tax_sd_jwt_vc";

  })(this);
