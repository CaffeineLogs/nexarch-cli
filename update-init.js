const fs = require('fs');

const apiContent = fs.readFileSync('../src/shared/providers/api/ApiClientProvider.provider.ts', 'utf-8');
const queryContent = fs.readFileSync('../src/shared/providers/query/QueryClientProvider.provider.tsx', 'utf-8');
const toastContent = fs.readFileSync('../src/shared/providers/toastProvider/ToastProvider.provider.ts', 'utf-8');
const providersContent = fs.readFileSync('../src/app/providers.tsx', 'utf-8');

let initTs = fs.readFileSync('./src/commands/init.ts', 'utf-8');

function escapeStringRegexp(string) {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

// We need to replace the inline strings in init.ts.
// It's safer to just rewrite init.ts in node using standard JSON.stringify for the contents.

initTs = initTs.replace(
  /await fs.writeFile\([\s\S]*?'apiClientProvider\.provider\.ts'\),[\s\S]*?\);/,
  `await fs.writeFile(
    path.join(providersPath, 'api', 'ApiClientProvider.provider.ts'),
    ${JSON.stringify(apiContent)}
  );`
);

initTs = initTs.replace(
  /await fs.writeFile\([\s\S]*?'QueryProvider\.provider\.tsx'\),[\s\S]*?\);/,
  `await fs.writeFile(
    path.join(providersPath, 'query', 'QueryClientProvider.provider.tsx'),
    ${JSON.stringify(queryContent)}
  );`
);

initTs = initTs.replace(
  /await fs.writeFile\([\s\S]*?'ToastProvider\.provider\.tsx'\),[\s\S]*?\);/,
  `await fs.writeFile(
    path.join(providersPath, 'toastProvider', 'ToastProvider.provider.ts'),
    ${JSON.stringify(toastContent)}
  );`
);

initTs = initTs.replace(/await fs\.ensureDir\(path\.join\(providersPath, 'toast'\)\);/, `await fs.ensureDir(path.join(providersPath, 'toastProvider'));`);

// Also install zod
initTs = initTs.replace(
  /setupSpinner\.text = \`Installing axios\.\.\.\`;\s*await execAsync\(\`\$\{installCmd\} axios\`\);/,
  `setupSpinner.text = \`Installing axios & zod...\`;\n    await execAsync(\`\${installCmd} axios zod\`);`
);

fs.writeFileSync('./src/commands/init.ts', initTs);
console.log('init.ts updated!');
