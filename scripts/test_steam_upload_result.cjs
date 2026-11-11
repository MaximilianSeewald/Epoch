'use strict';

const assert = require('node:assert/strict');
const { verifySteamUpload } = require('./steam_upload_result.cjs');
const id = '1234567890123';
const vdf = `"workshopitem"\n{\n  "publishedfileid" "${id}"\n}\n`;
const verify = (output, options = {}) => verifySteamUpload({ exitCode: 0, output, configuredWorkshopId: id, resultVdf: vdf, ...options });
let checks = 0;
const check = fn => { fn(); checks++; };

check(() => assert.equal(verify('Success. Published file update: 1234567890123').ok, true));
check(() => assert.equal(verify('[2025-01-01 12:00:00] Success. Published File ID: 1234567890123').ok, true));
check(() => assert.equal(verify('Success. Published file update = 1234567890123').ok, true));
check(() => assert.equal(verify('Success. Workshop item updated: 1234567890123').ok, true));
check(() => assert.equal(verify('Success. Published file update: 1234567890123\nSuccess. Published file update: 1234567890123').ok, true));
check(() => assert.equal(verify('Login to Steam successful').ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890124').ok, false));
check(() => assert.equal(verify('Success. Published File ID: 1234567890123', { exitCode: 1 }).ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890123', { resultVdf: vdf.replace(id, '1234567890124') }).ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890123', { resultVdf: `${vdf} "publishedfileid" "${id}"\n` }).ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890123\nERROR! Upload failed').ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890123', { configuredWorkshopId: '0' }).ok, false));
check(() => assert.equal(verify('Success. Published file update').ok, false));

console.log(`PASS: ${checks} SteamCMD output and ID verification cases; no output contents are emitted.`);
