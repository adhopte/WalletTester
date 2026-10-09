const express = require('express');
const app = express();
const fs = require('fs').promises;
const CredentialNotFoundException = require('./CredentialNotFoundException');
require('dotenv').config();

app.use(express.json());

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
    // The national ID number (NPI) is only used to verify the citizen, so the
    // list exposes its last digits, never the full number.
    res.json(jsonData.map(({ npi, ...user }) => npi ? { ...user, npiHint: maskNpi(npi) } : user));
  } catch (e) {
    handleException(e, res);
  }
});

/*
 * Simulated root-of-trust check: before a credential offer is created, the agent
 * enters the citizen's date of birth and NPI, which must match the record.
 */
app.post('/:credentialConfigurationId/sor/:identifier/verify', async (req, res) => {
  try {
    const pathFile = findPathFile(req.params['credentialConfigurationId']);
    const jsonData = await loadJson(pathFile);
    const user = jsonData.find(c => c.identifier === req.params['identifier']);
    if (!user) {
      return res.status(404).json({ verified: false, reason: 'not_found' });
    }
    const birthDate = (user.attributes || []).find(a => a.name === 'birth_date' || a.name === 'birthdate')?.value;
    const npiOk = normalize(req.body?.npi) !== '' && normalize(req.body?.npi) === normalize(user.npi);
    const birthDateOk = !!birthDate && String(req.body?.birthDate || '').trim() === birthDate;
    if (npiOk && birthDateOk) {
      return res.json({ verified: true });
    }
    res.status(401).json({ verified: false, reason: 'mismatch' });
  } catch (e) {
    handleException(e, res);
  }
});

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, '');
}

function maskNpi(npi) {
  const digits = normalize(npi);
  return '•'.repeat(Math.max(digits.length - 4, 0)) + digits.slice(-4);
}

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
      const { credentialConfigurationId, credentialId, walletId, npi, ...clean } = found;
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
    case "oid_pid_mdoc_uc1":
      return process.env.PID_MDOC_CLAIMS_FILE;
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

