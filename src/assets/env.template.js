(function(window) {
    window.env = window.env || {};

    // Environment variables
    window["env"]["ipvHost"] = "${IPV_HOST}";
    window["env"]["ipvBasePath"] = "${IPV_BASE_PATH}";
    window["env"]["oid4vciHost"] = "${OID_4_VCI_HOST}";
    window["env"]["sorHost"] = "${SOR_HOST}";
    window["env"]["uc2CredName"] = "${UC2_CRED_NAME}";
    window.env.flows = {
      default: ${DEFAULT_FLOWS},
      hosts: ${HOST_SPECIFIC_FLOWS},
      supportedUseCases: ${SUPPORTED_USE_CASES},
      DTC_FLOW_NAME: "${DTC_FLOW_NAME}",
      DTC_DATA_FILE: "${DTC_DATA_FILE}",
      USER_PID_CLAIMS_FILE: "${USER_PID_CLAIMS_FILE}",
      USER_DEGREE_CLAIMS_FILE: "${USER_DEGREE_CLAIMS_FILE}",
      USER_BIRTH_CERTIFICATE_CLAIMS_SD_JWT_FILE: "${USER_BIRTH_CERTIFICATE_CLAIMS_SD_JWT_FILE}",
      USER_BIRTH_CERTIFICATE_CLAIMS_MDOC_FILE: "${USER_BIRTH_CERTIFICATE_CLAIMS_MDOC_FILE}"
   };


})(this);
