const path = require('path');

const relativePath = (p) => path.join(__dirname, p);
const throwOnFailed = (p) => p.then(err => { if (err) throw new Error(err) });

const gcd = (a, b) => (b) ? gcd(b, a % b) : a;

const decimalToFraction = (decimal) => {
  if (decimal > 1) return decimal

  const top = decimal.toString().replace(/\d+[.]/, '');
  const bottom = Math.pow(10, top.length);
  const x = gcd(top, bottom);

  return `${top / x}/${bottom / x}`
};

const capitalize = (word) => word[0].toUpperCase() + word.slice(1).toLowerCase();

module.exports = {
  relativePath,
  throwOnFailed,
  decimalToFraction,
  capitalize,
};
