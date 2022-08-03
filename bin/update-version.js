const fs = require('fs');

const packageJson = fs.readFileSync(`${__dirname}/../package.json`);

try {
  const json = JSON.parse(packageJson);

  fs.writeFileSync(`${__dirname}/../latest-version.txt`, json.version);
} catch(e) {
  // eslint-disable-next-line no-console
  console.log('Error reading latest version');
  // eslint-disable-next-line no-console
  console.log(e);
}
