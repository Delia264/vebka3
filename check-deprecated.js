const fs = require('fs');
const data = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const deprecated = Object.entries(data.packages)
  .filter(([_, details]) => details.deprecated)
  .map(([name, details]) => `${name}:\n${details.deprecated}\n`);
console.log(deprecated.join(''));