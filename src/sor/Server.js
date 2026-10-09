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
    // ID numbers are used to verify the citizen, so the list only exposes
    // the last characters of one of them, never the numbers themselves.
    res.json(jsonData.map(listView));
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
    const entered = normalize(req.body?.npi);
    const idOk = entered !== '' && idNumbers(user).some(id => normalize(id) === entered);
    const birthDateOk = !!birthDate && String(req.body?.birthDate || '').trim() === String(birthDate);
    if (idOk && birthDateOk) {
      return res.json({ verified: true });
    }
    res.status(401).json({ verified: false, reason: 'mismatch' });
  } catch (e) {
    handleException(e, res);
  }
});

// Claims that identify the citizen and are accepted as "ID number" for verification,
// in the order used for the masked hint (NPI first).
const ID_CLAIMS = ['personal_administrative_number', 'document_number', 'birth_record_reference'];

function idNumbers(user) {
  const fromClaims = ID_CLAIMS
    .map(name => (user.attributes || []).find(a => a.name === name)?.value)
    .filter(v => v !== undefined && v !== null && v !== '');
  return user.npi ? [user.npi, ...fromClaims] : fromClaims;
}

function listView(user) {
  const { npi, attributes, ...rest } = user;
  const ids = idNumbers(user);
  return {
    ...rest,
    attributes: (attributes || []).filter(a => !ID_CLAIMS.includes(a.name)),
    ...(ids.length ? { npiHint: mask(ids[0]) } : {})
  };
}

// Case, spaces and dashes are ignored when comparing ID numbers
function normalize(value) {
  return String(value ?? '').replace(/[\s-]+/g, '').toUpperCase();
}

function mask(id) {
  const value = String(id);
  return '•'.repeat(Math.max(value.length - 4, 0)) + value.slice(-4);
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

