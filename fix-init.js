const fs = require('fs');

const apiContent = fs.readFileSync('../src/shared/providers/api/ApiClientProvider.provider.ts', 'utf-8');
const queryContent = fs.readFileSync('../src/shared/providers/query/QueryClientProvider.provider.tsx', 'utf-8');
const toastContent = fs.readFileSync('../src/shared/providers/toastProvider/ToastProvider.provider.ts', 'utf-8');

const code = `import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateFeature } from '../generators/feature';

const execAsync = promisify(exec);

export async function initCommand(): Promise<void> {
  console.log(chalk.blue('Welcome to Nexarch - Clean Architecture Setup'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Which framework would you like to scaffold?',
      choices: ['Next.js (App Router)', 'React (Vite)', 'None (Existing Project)'],
    },
    {
      type: 'list',
      name: 'pkgManager',
      message: 'Which package manager do you want to use?',
      choices: ['npm', 'pnpm'],
      when: (answers: any) => answers.framework !== 'None (Existing Project)',
    },
    {
      type: 'input',
      name: 'features',
      message: 'Initial features to generate (space separated, or leave empty):',
    },
    {
      type: 'confirm',
      name: 'tanstack',
      message: 'Do you want to include Tanstack (React) Query provider?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'toast',
      message: 'Do you want to include a Toast provider?',
      default: true,
    },
  ]);

  const cwd = process.cwd();
  const pkgManager = answers.pkgManager || 'npm';
  const installCmd = pkgManager === 'pnpm' ? 'pnpm add' : 'npm install';
  const installDevCmd = pkgManager === 'pnpm' ? 'pnpm add -D' : 'npm install -D';
  const execCmd = pkgManager === 'pnpm' ? 'pnpm dlx' : 'npx';

  // 1. Framework Scaffolding
  if (answers.framework === 'Next.js (App Router)') {
    const spinner = ora('Scaffolding Next.js project...').start();
    try {
      await execAsync(\`npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-\${pkgManager}\`);
      
      const pagePath = path.join(cwd, 'src', 'app', 'page.tsx');
      await fs.writeFile(pagePath, \`export default function Home() {\\n  return (\\n    <main className="min-h-screen p-8">\\n      <h1 className="text-2xl font-bold">Nexarch Clean Architecture</h1>\\n    </main>\\n  );\\n}\\n\`);
      
      const cssPath = path.join(cwd, 'src', 'app', 'globals.css');
      await fs.writeFile(cssPath, \`@tailwind base;\\n@tailwind components;\\n@tailwind utilities;\\n\`);
      
      spinner.succeed('Next.js project scaffolded and cleaned.');
    } catch (error: any) {
      spinner.fail('Failed to scaffold Next.js project.');
      console.error(error.message);
      process.exit(1);
    }
  } else if (answers.framework === 'React (Vite)') {
    const spinner = ora('Scaffolding React (Vite) project...').start();
    try {
      if (pkgManager === 'pnpm') {
        await execAsync('pnpm create vite . --template react-ts');
      } else {
        await execAsync('npx --yes create-vite@latest . --template react-ts');
      }
      
      spinner.text = 'Installing dependencies...';
      await execAsync(\`\${pkgManager} install\`);
      
      spinner.text = 'Setting up Tailwind CSS...';
      await execAsync(\`\${installDevCmd} tailwindcss postcss autoprefixer\`);
      await execAsync(\`\${execCmd} tailwindcss init -p\`);
      
      const tailwindConfigPath = path.join(cwd, 'tailwind.config.js');
      await fs.writeFile(tailwindConfigPath, \`/** @type {import('tailwindcss').Config} */\\nexport default {\\n  content: [\\n    "./index.html",\\n    "./src/**/*.{js,ts,jsx,tsx}",\\n  ],\\n  theme: {\\n    extend: {},\\n  },\\n  plugins: [],\\n}\\n\`);

      const appPath = path.join(cwd, 'src', 'App.tsx');
      await fs.writeFile(appPath, \`export default function App() {\\n  return (\\n    <div className="min-h-screen p-8">\\n      <h1 className="text-2xl font-bold">Nexarch Clean Architecture</h1>\\n    </div>\\n  );\\n}\\n\`);
      
      const cssPath = path.join(cwd, 'src', 'index.css');
      await fs.writeFile(cssPath, \`@tailwind base;\\n@tailwind components;\\n@tailwind utilities;\\n\`);
      
      const appCssPath = path.join(cwd, 'src', 'App.css');
      if (await fs.pathExists(appCssPath)) {
        await fs.remove(appCssPath);
      }

      spinner.succeed('React (Vite) project scaffolded and cleaned.');
    } catch (error: any) {
      spinner.fail('Failed to scaffold React (Vite) project.');
      console.error(error.message);
      process.exit(1);
    }
  }

  await fs.remove(path.join(cwd, 'claude.md'));
  await fs.remove(path.join(cwd, 'agents.md'));

  // 2. Setup Clean Architecture & Providers
  const setupSpinner = ora('Setting up Clean Architecture providers...').start();
  
  const srcPath = path.join(cwd, 'src');
  const providersPath = path.join(srcPath, 'shared', 'providers');

  await fs.ensureDir(path.join(providersPath, 'api'));
  await fs.writeFile(
    path.join(providersPath, 'api', 'ApiClientProvider.provider.ts'),
    ${JSON.stringify(apiContent)}
  );

  if (answers.framework !== 'None (Existing Project)') {
    setupSpinner.text = \`Installing axios and zod...\`;
    await execAsync(\`\${installCmd} axios zod\`);
  }

  if (answers.tanstack) {
    await fs.ensureDir(path.join(providersPath, 'query'));
    await fs.writeFile(
      path.join(providersPath, 'query', 'QueryClientProvider.provider.tsx'),
      ${JSON.stringify(queryContent)}
    );
    if (answers.framework !== 'None (Existing Project)') {
      setupSpinner.text = \`Installing @tanstack/react-query...\`;
      await execAsync(\`\${installCmd} @tanstack/react-query\`);
    }
  }

  if (answers.toast) {
    await fs.ensureDir(path.join(providersPath, 'toastProvider'));
    await fs.writeFile(
      path.join(providersPath, 'toastProvider', 'ToastProvider.provider.ts'),
      ${JSON.stringify(toastContent)}
    );
    if (answers.framework !== 'None (Existing Project)') {
      setupSpinner.text = \`Installing react-hot-toast...\`;
      await execAsync(\`\${installCmd} react-hot-toast\`);
    }
  }

  // Scaffold Global Providers Wrapper if requested
  if (answers.framework !== 'None (Existing Project)' && (answers.tanstack || answers.toast)) {
    const isNext = answers.framework === 'Next.js (App Router)';
    const globalProvidersPath = path.join(srcPath, isNext ? 'app' : '', 'providers.tsx');
    
    let imports = \`\`;
    let wrappersStart = \`\`;
    let wrappersEnd = \`\`;

    if (answers.tanstack) {
      imports += \`import { QueryClientProvider as CustomQueryClientProvider } from '@/shared/providers/query/QueryClientProvider.provider';\\n\`;
      wrappersStart += \`    <CustomQueryClientProvider>\\n\`;
      wrappersEnd = \`    </CustomQueryClientProvider>\\n\` + wrappersEnd;
    }

    const providersContent = \`\${isNext ? '"use client";\\n\\n' : ''}\${imports}
type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
\${wrappersStart}        {children}
\${wrappersEnd}  );
}
\`;
    const finalProvidersContent = isNext 
      ? providersContent 
      : providersContent.replace(/@\\/shared/g, './shared');

    await fs.writeFile(globalProvidersPath, finalProvidersContent);

    if (isNext) {
      const layoutPath = path.join(srcPath, 'app', 'layout.tsx');
      if (await fs.pathExists(layoutPath)) {
        let layoutContent = await fs.readFile(layoutPath, 'utf-8');
        if (!layoutContent.includes('Providers')) {
          layoutContent = layoutContent.replace(
            /export default function RootLayout/,
            \`import Providers from './providers';\\n\\nexport default function RootLayout\`
          );
          layoutContent = layoutContent.replace(/{children}/g, \`<Providers>{children}</Providers>\`);
          await fs.writeFile(layoutPath, layoutContent);
        }
      }
    } else {
      const mainPath = path.join(srcPath, 'main.tsx');
      if (await fs.pathExists(mainPath)) {
        let mainContent = await fs.readFile(mainPath, 'utf-8');
        if (!mainContent.includes('Providers')) {
          mainContent = mainContent.replace(
            /import App from '.\\/App.tsx'/,
            \`import App from './App.tsx'\\nimport Providers from './providers.tsx'\`
          );
          mainContent = mainContent.replace(
            /<App \\/>/g,
            \`<Providers>\\n      <App />\\n    </Providers>\`
          );
          await fs.writeFile(mainPath, mainContent);
        }
      }
    }
  }

  setupSpinner.succeed('Providers and Clean Architecture scaffolded.');

  // 3. Generate Features
  const features: string[] = answers.features
    .split(' ')
    .map((f: string) => f.trim())
    .filter(Boolean);

  await fs.ensureDir(path.join(srcPath, 'features'));

  if (features.length > 0) {
    const featureSpinner = ora('Generating initial features...').start();
    for (const feature of features) {
      await generateFeature(feature, { all: true, silent: true });
    }
    featureSpinner.succeed(\`Generated features: \${features.join(', ')}\`);
  } else {
    console.log(chalk.yellow('ℹ No features requested. The src/features/ folder is ready.'));
  }

  console.log(chalk.blue('\\nSetup complete! You can now start building your app.'));
}
`;

fs.writeFileSync('./src/commands/init.ts', code);
