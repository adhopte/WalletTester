const express = require('express');
const app = express();
const fs = require('fs').promises;
const CredentialNotFoundException = require('./CredentialNotFoundException');
require('dotenv').config();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // or specific origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});;


app.get('/:credentialConfigurationId/sor/:identifier', async (req, res) => {
  const identifier = req.params['identifier'];
  const credentialConfigurationId = req.params['credentialConfigurationId'];
  const credentialId = req.query?.credential_identifier;

  console.log("credentialConfigurationId = " + credentialConfigurationId + " identifier = " + identifier);

  if (credentialId === undefined) {
    await findUserById(credentialConfigurationId, c => c.identifier === identifier, res)
  } else {
    console.log("credential_identifier = " + credentialId);
    await findUserById(credentialConfigurationId, c => c.identifier === identifier && c.credentialId === credentialId, res)
  }
});


app.get('/:credentialConfigurationId/sor/', async (req, res) => {
  try {
    const credentialConfigurationId = req.params['credentialConfigurationId'];
    const pathFile = findPathFile(credentialConfigurationId);
    const jsonData = await loadJson(pathFile);
    res.json(jsonData);
  } catch (e) {
    handleException(e, res);
  }
});

app.listen(process.env.SOR_SERVER_PORT, () => {
  console.log('Backend listening on http://localhost:' + process.env.SOR_SERVER_PORT);
});


function handleException(e, res) {
  console.error("something occurs " + e);
  if (e instanceof CredentialNotFoundException)
    res.status(404).send(e.message);
  else
    res.status(500).send(e.message);
}


async function loadJson(path) {
  console.log("load json file " + path)
  const rawData = await fs.readFile(path, 'utf-8');
  const jsonData = JSON.parse(rawData);
  return jsonData;
}

async function findUserById(credentialConfigId, lambda, res) {
  try {
    const pathFile = findPathFile(credentialConfigId);
    const jsonData = await loadJson(pathFile);
    const found = jsonData.find(lambda);
    if (!found) {
      res.status(404).send('User not found by identifier');
    } else {
      const { credentialConfigurationId, credentialId, walletId, ...clean } = found;
      res.json(clean);
    }
  } catch (e) {
    handleException(e, res);
  }
}

function findPathFile(credentialId) {
  switch (credentialId) {
    case "oid_pid_inp_uc1":
      return process.env.PID_CLAIMS_FILE;
    case "oid_degree_uc1":
      return process.env.DEGREE_CLAIMS_FILE;
    case "oid_birth_certificate_sd_jwt_uc1":
      return process.env.BIRTH_CERTIFICATE_CLAIMS_SD_JWT_FILE;
    case "oid_birth_certificate_mdoc_uc1":
      return process.env.BIRTH_CERTIFICATE_CLAIMS_MDOC_FILE;
    case "sor-hospitality":
      return process.env.BOOKING_REGISTRATION_FILE;
    case "sor-court":
      return process.env.COR_FILE;
    case "sor-health":
      return process.env.HEALTH_FILE;
    case "sor-health_id":
      return process.env.HEALTH_ID_FILE;
    case "sor-bank":
      return process.env.IBAN_FILE;
    case "sor-transport":
      return process.env.MDL_FILE;
    case "sor-telecom":
      return process.env.TELECOM_FILE;
    case "sor-securitysocial":
      return process.env.PDA_FILE;
    case "sor-identity":
      return process.env.PHOTOS_FILE;
    case "sor-residentity":
      return process.env.POR_FILE;
    case "sor-privacy":
      return process.env.PSEUDONYM_FILE;
    case "sor-tax-agency":
      return process.env.TAX_AGENCY_FILE;
    default:
      throw new CredentialNotFoundException("unknown credentialId");
  }
}

