'use strict';

// General bilingual localization integrity. New keys are allowed when present
// in both languages; this test intentionally has no historical key baseline.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2] || path.resolve(__dirname, '..');
const languages = {};
let checks = 0;
const check = (condition, message) => { checks++; assert.ok(condition, message); };
const syntax = /^\s*([\w.]+):\d+ "((?:[^"\\]|\\[nrt"\\])*)"\s*$/;
for (const language of ['english', 'german']) {
  const dir = path.join(root, 'localisation', language);
  const keys = new Map();
  for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.yml'))) {
    const relative = path.join('localisation', language, file);
    const bytes = fs.readFileSync(path.join(dir, file));
    const text = bytes.toString('utf8');
    check(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), `${relative}: UTF-8 BOM`);
    check(!text.includes('\ufffd'), `${relative}: valid UTF-8`);
    let header = false;
    for (const [index, line] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
      if (!line.trim() || /^\s*#/.test(line)) continue;
      if (!header && line.trim() === `l_${language}:`) { header = true; continue; }
      const match = line.match(syntax);
      check(!!match, `${relative}:${index + 1}: valid localization syntax`);
      if (!match) continue;
      check(!keys.has(match[1]), `${language}: unique localization key ${match[1]}`);
      keys.set(match[1], { value: match[2], file: relative });
    }
    check(header, `${relative}: expected ${language} header`);
  }
  languages[language] = keys;
}
assert.deepEqual([...languages.english.keys()].sort(), [...languages.german.keys()].sort(), 'English and German localization keys match; additions are permitted in both'); checks++;
for (const [key, entry] of languages.english) {
  const de = languages.german.get(key);
  const refs = value => (value.match(/\$[^$]+\$/g) || []).sort();
  assert.deepEqual(refs(entry.value), refs(de.value), `${key}: nested localization references match`); checks++;
  for (const ref of refs(entry.value).map(value => value.slice(1, -1)).filter(value => /^(?:epoch_|tr_epoch|trait_epoch|tech_epoch|NAME_EPOCH)/.test(value))) {
    check(languages.english.has(ref) && languages.german.has(ref), `${key}: nested key ${ref} exists in both languages`);
  }
}
console.log(`PASS: ${checks} general localization format, uniqueness, parity and reference checks. New bilingual keys are permitted.`);
