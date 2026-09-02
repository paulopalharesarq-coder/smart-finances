const fs = require('fs');
const path = require('path');

const iconPath = path.join(__dirname, '../icons/icon-512.png');
const svgPath = path.join(__dirname, '../icons/icon.svg');

const base64 = fs.readFileSync(iconPath).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${base64}" width="512" height="512"/>
</svg>`;

fs.writeFileSync(svgPath, svg, 'utf8');
console.log('icon.svg updated with official wallet artwork!');
