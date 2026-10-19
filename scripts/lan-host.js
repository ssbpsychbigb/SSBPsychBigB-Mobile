/**
 * Picks this PC's Wi-Fi IPv4 so a physical phone can reach the API without USB.
 */

const os = require('os');

/**
 * @param {string} ip
 */
function isPrivateIpv4(ip) {
  if (!ip || ip.includes(':')) {
    return false;
  }
  if (ip.startsWith('127.') || ip.startsWith('169.254.')) {
    return false;
  }
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip);
}

/**
 * @param {NodeJS.Dict<os.NetworkInterfaceInfo[]>} [interfaces]
 * @returns {string}
 */
function pickLanHost(interfaces = os.networkInterfaces()) {
  const preferred = [];
  const other = [];

  for (const rows of Object.values(interfaces)) {
    for (const row of rows || []) {
      const family = String(row.family);
      const isV4 = family === 'IPv4' || family === '4';
      if (row.internal || !isV4 || !isPrivateIpv4(row.address)) {
        continue;
      }
      if (row.address.startsWith('192.168.')) {
        preferred.push(row.address);
      } else {
        other.push(row.address);
      }
    }
  }

  return preferred[0] || other[0] || '';
}

module.exports = { pickLanHost };
