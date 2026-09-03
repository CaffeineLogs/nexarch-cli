const fs = require('fs');

let initTs = fs.readFileSync('./src/commands/init.ts', 'utf-8');

initTs = initTs.replace(
  /\$\{installDevCmd\} tailwindcss postcss autoprefixer/,
  '${installDevCmd} tailwindcss@^3 postcss autoprefixer'
);

fs.writeFileSync('./src/commands/init.ts', initTs);
console.log('init.ts patched for tailwindcss v3');
