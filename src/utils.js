const path = require('path');

const relativePath = (p) => path.join(__dirname, p);
const throwOnFailed = (p) => p.then(err => { if (err) throw new Error(err) });

module.exports = {
    relativePath,
    throwOnFailed,
};
