/**
 * Inlines allowlisted keys from `.env` plus this PC's LAN IP (debug API host).
 */

const fs = require('fs');
const path = require('path');
const { pickLanHost } = require('./lan-host');

const ROOT = path.join(__dirname, '..');
const ALLOWLIST = new Set([
  'API_BASE_URL_LOCAL',
  'API_BASE_URL_PRODUCTION',
  'DEV_LAN_HOST',
]);

/**
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  /** @type {Record<string, string>} */
  const out = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 1) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    if (!ALLOWLIST.has(key)) {
      continue;
    }
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * @returns {Record<string, string>}
 */
function loadEnv() {
  const env = parseEnvFile(path.join(ROOT, '.env'));
  env.DEV_LAN_HOST = env.DEV_LAN_HOST || pickLanHost();
  return env;
}

/**
 * @param {import('@babel/core')} babel
 */
module.exports = function inlineAppEnv({ types: t }) {
  const env = loadEnv();

  return {
    name: 'inline-app-env',
    visitor: {
      MemberExpression(memberPath) {
        const object = memberPath.get('object');
        if (!object.isMemberExpression()) {
          return;
        }
        const obj = object.get('object');
        const prop = object.get('property');
        if (!obj.isIdentifier({ name: 'process' }) || !prop.isIdentifier({ name: 'env' })) {
          return;
        }

        let key;
        if (!memberPath.node.computed && memberPath.node.property.type === 'Identifier') {
          key = memberPath.node.property.name;
        } else if (memberPath.get('property').isStringLiteral()) {
          key = memberPath.node.property.value;
        }
        if (!key || !ALLOWLIST.has(key)) {
          return;
        }

        memberPath.replaceWith(t.stringLiteral(env[key] ?? ''));
      },
    },
  };
};
