const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const licenses = new Set([
  'A1B2C3D4E5F6', // Example keys
  // ...load from DB or file
]);
const usedLicenses = new Map();

app.post('/api/validate-license', (req, res) => {
  const { licenseKey, deviceId } = req.body;
  if (!licenseKey || !deviceId) return res.status(400).json({ valid: false, message: 'Missing data' });
  if (!licenses.has(licenseKey)) return res.json({ valid: false, message: 'Invalid license' });
  if (usedLicenses.has(licenseKey) && usedLicenses.get(licenseKey) !== deviceId) {
    return res.json({ valid: false, message: 'License already used on another device' });
  }
  usedLicenses.set(licenseKey, deviceId);
  return res.json({ valid: true, token: 'some-activation-token' });
});

app.listen(10000, () => console.log('License server running on port 10000'));