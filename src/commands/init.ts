import inquirer from 'inquirer';
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
      await execAsync(`npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-${pkgManager}`);
      
      const pagePath = path.join(cwd, 'src', 'app', 'page.tsx');
      await fs.writeFile(pagePath, `export default function Home() {\n  return (\n    <main className="min-h-screen p-8">\n      <h1 className="text-2xl font-bold">Nexarch Clean Architecture</h1>\n    </main>\n  );\n}\n`);
      
      const cssPath = path.join(cwd, 'src', 'app', 'globals.css');
      await fs.writeFile(cssPath, `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`);
      
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
      await execAsync(`${pkgManager} install`);
      
      spinner.text = 'Setting up Tailwind CSS v4...';
      await execAsync(`${installCmd} tailwindcss @tailwindcss/vite`);
      
      const viteConfigPath = path.join(cwd, 'vite.config.ts');
      if (await fs.pathExists(viteConfigPath)) {
        let viteConfig = await fs.readFile(viteConfigPath, 'utf-8');
        viteConfig = viteConfig.replace(
          /import react from '@vitejs\/plugin-react'/,
          `import react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'`
        );
        viteConfig = viteConfig.replace(
          /plugins: \[react\(\)\]/,
          `plugins: [tailwindcss(), react()]`
        );
        await fs.writeFile(viteConfigPath, viteConfig);
      }

      const appPath = path.join(cwd, 'src', 'App.tsx');
      await fs.writeFile(appPath, `export default function App() {\n  return (\n    <div className="min-h-screen p-8">\n      <h1 className="text-2xl font-bold">Nexarch Clean Architecture</h1>\n    </div>\n  );\n}\n`);
      
      const cssPath = path.join(cwd, 'src', 'index.css');
      await fs.writeFile(cssPath, `@import "tailwindcss";\n`);
      
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
    "import axios, { AxiosInstance } from \"axios\";\nimport { ZodType } from \"zod\";\nimport { useAuthStore } from \"../../../features/auth/store/auth.store\";\n\nclass ApiClient {\n  private static instance: ApiClient;\n  private constructor(axiosInstance: AxiosInstance) {\n    this.axiosInstance = axiosInstance;\n    this.axiosInstance.interceptors.request.use(\n      (config) => {\n        const token = useAuthStore.getState().token;\n        if (token) {\n          config.headers.Authorization = `Bearer ${token}`;\n        }\n        return config;\n      },\n      (error) => Promise.reject(error),\n    );\n  }\n  private axiosInstance: AxiosInstance | undefined;\n  \n  public static getInstance(): ApiClient {\n    if (!ApiClient.instance) {\n      // NOTE: If this is a React app (e.g. Vite), use import.meta.env.VITE_BASE_URL. \n      // Since this is a Next.js app, we use process.env.NEXT_PUBLIC_BASE_URL.\n      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || \"http://localhost:8000\";\n      \n      ApiClient.instance = new ApiClient(\n        axios.create({\n          baseURL: `${baseURL}/api/v1`,\n          withCredentials: true,\n          headers: {\n            \"Content-Type\": \"application/json\",\n          },\n        }),\n      );\n    }\n    return ApiClient.instance;\n  }\n\n  get axios() {\n    return this.axiosInstance;\n  }\n\n  async get(endPoint: string, schema: ZodType, isArray: boolean = true) {\n    const result = await this.axiosInstance?.get(endPoint);\n    const parsedResult = isArray\n      ? schema.array().safeParse(result?.data)\n      : schema.safeParse(result?.data);\n\n    if (result?.status === 200 || result?.status === 304) {\n      if (parsedResult.success) {\n        return parsedResult.data;\n      } else {\n        console.error(\"Zod Parse Error Details:\", {\n          endpoint: endPoint,\n          errors: parsedResult.error.issues,\n          rawData: result?.data,\n          problemResource: isArray\n            ? result?.data?.[parsedResult.error.issues[0]?.path?.[0]]\n            : result?.data,\n        });\n        console.error(\"Full Zod Error:\", parsedResult.error);\n        throw new Error(\"Parse Error\");\n      }\n    } else {\n      return result;\n    }\n  }\n  async post(\n    endPoint: string,\n    schema: ZodType,\n    payload?: unknown,\n    isArray: boolean = false,\n  ) {\n    const result = await this.axiosInstance?.post(endPoint, payload);\n    const parsedResult = isArray\n      ? schema.array().safeParse(result?.data)\n      : schema.safeParse(result?.data);\n    if (result?.status === 201 || result?.status === 200) {\n      if (parsedResult.success) {\n        return parsedResult.data;\n      } else {\n        throw new Error(\"Parse Error\");\n      }\n    } else {\n      return result;\n    }\n  }\n  async patch(\n    endPoint: string,\n    schema: ZodType,\n    payload?: unknown,\n    isArray: boolean = false,\n  ) {\n    const result = await this.axiosInstance?.patch(endPoint, payload);\n    const parsedResult = isArray\n      ? schema.array().safeParse(result?.data)\n      : schema.safeParse(result?.data);\n    if (result?.status === 200) {\n      if (parsedResult.success) {\n        return parsedResult.data;\n      } else {\n        throw new Error(\"Parse Error\");\n      }\n    } else {\n      return result;\n    }\n  }\n\n  async put(\n    endPoint: string,\n    schema: ZodType,\n    payload?: unknown,\n    isArray: boolean = false,\n  ) {\n    const result = await this.axiosInstance?.put(endPoint, payload);\n    const parsedResult = isArray\n      ? schema.array().safeParse(result?.data)\n      : schema.safeParse(result?.data);\n    if (result?.status === 200) {\n      if (parsedResult.success) {\n        return parsedResult.data;\n      } else {\n        throw new Error(\"Parse Error\");\n      }\n    } else {\n      return result;\n    }\n  }\n  async delete(endPoint: string, schema: ZodType, payload?: any) {\n    let result;\n    if (payload) {\n      result = await this.axiosInstance?.delete(endPoint, { data: payload });\n    } else {\n      result = await this.axiosInstance?.delete(endPoint);\n    }\n    const parsedResult = schema.safeParse(result?.data);\n    if (result?.status === 200) {\n      if (parsedResult.success) {\n        return {\n          status: result?.status,\n          data: parsedResult.data,\n        };\n      } else {\n        throw new Error(\"Parse Error\");\n      }\n    } else {\n      return result;\n    }\n  }\n}\n\nexport const apiClient = ApiClient.getInstance();\n"
  );

  if (answers.framework !== 'None (Existing Project)') {
    setupSpinner.text = `Installing axios and zod...`;
    await execAsync(`${installCmd} axios zod`);
  }

  if (answers.tanstack) {
    await fs.ensureDir(path.join(providersPath, 'query'));
    await fs.writeFile(
      path.join(providersPath, 'query', 'QueryClientProvider.provider.tsx'),
      "\"use client\";\n\nimport {\n  QueryCache,\n  QueryClient,\n  QueryClientProvider as TanstackQueryClientProvider\n} from '@tanstack/react-query';\nimport { AxiosError } from 'axios';\nimport { toast, Toaster } from 'react-hot-toast';\nimport { useState } from 'react';\nimport { toastService } from '../toastProvider/ToastProvider.provider';\n\nexport function QueryClientProvider({ children }: { children: React.ReactNode }) {\n  const [queryClient] = useState(() => new QueryClient({\n    defaultOptions: {\n      queries: {\n        retry: (failureCount, error: unknown) => {\n          const err = error as AxiosError;\n          if (\n            err?.response?.status === 400 ||\n            err?.response?.status === 401\n          ) {\n            return false;\n          }\n          return failureCount <= 3;\n        },\n        refetchOnWindowFocus: false,\n      },\n    },\n    queryCache: new QueryCache({\n      onError: async (error: unknown) => {\n        const err = error as AxiosError;\n        if (err?.response?.status === 401) {\n          toast.dismiss();\n          toastService.errorToast('Your session has expired', 'SESSION_EXPIRY');\n          return;\n        }\n      },\n    }),\n  }));\n\n  return (\n    <TanstackQueryClientProvider client={queryClient}>\n      <Toaster />\n      {children}\n    </TanstackQueryClientProvider>\n  );\n}\n"
    );
    if (answers.framework !== 'None (Existing Project)') {
      setupSpinner.text = `Installing @tanstack/react-query...`;
      await execAsync(`${installCmd} @tanstack/react-query`);
    }
  }

  if (answers.toast) {
    await fs.ensureDir(path.join(providersPath, 'toastProvider'));
    await fs.writeFile(
      path.join(providersPath, 'toastProvider', 'ToastProvider.provider.ts'),
      "import { toast } from \"react-hot-toast\";\n\nclass ToastService {\n  status: Record<string, { isDisplayed: boolean }> = {\n    SESSION_EXPIRY: {\n      isDisplayed: false,\n    },\n  };\n  private static instance: ToastService;\n  private constructor() {}\n\n  public static getInstance(): ToastService {\n    if (!ToastService.instance) {\n      ToastService.instance = new ToastService();\n    }\n    return ToastService.instance;\n  }\n\n  successToast(message: string, key?: string) {\n    if (key && !this.status[key].isDisplayed) {\n      toast.success(message, {\n        duration: 2000,\n      });\n      this.status[key].isDisplayed = true;\n      this.displayedTimeOut(key);\n    }\n  }\n\n  errorToast(message: string, key?: string) {\n    if (key && !this.status[key].isDisplayed) {\n      toast.error(message, {\n        duration: 2000,\n      });\n      this.status[key].isDisplayed = true;\n      this.displayedTimeOut(key);\n    }\n    // } else {\n    //   toast.error(message, {\n    //     duration: 2000,\n    //   });\n    // }\n  }\n\n  displayedTimeOut(key: string) {\n    setTimeout(() => {\n      this.status[key].isDisplayed = false;\n    }, 5 * 1000);\n  }\n}\n\nexport const toastService = ToastService.getInstance();\n"
    );
    if (answers.framework !== 'None (Existing Project)') {
      setupSpinner.text = `Installing react-hot-toast...`;
      await execAsync(`${installCmd} react-hot-toast`);
    }
  }

  // Scaffold Global Providers Wrapper if requested
  if (answers.framework !== 'None (Existing Project)' && (answers.tanstack || answers.toast)) {
    const isNext = answers.framework === 'Next.js (App Router)';
    const globalProvidersPath = path.join(srcPath, isNext ? 'app' : '', 'providers.tsx');
    
    let imports = ``;
    let wrappersStart = ``;
    let wrappersEnd = ``;

    if (answers.tanstack) {
      imports += `import { QueryClientProvider as CustomQueryClientProvider } from '@/shared/providers/query/QueryClientProvider.provider';\n`;
      wrappersStart += `    <CustomQueryClientProvider>\n`;
      wrappersEnd = `    </CustomQueryClientProvider>\n` + wrappersEnd;
    }

    const providersContent = `${isNext ? '"use client";\n\n' : ''}${imports}
type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
${wrappersStart}        {children}
${wrappersEnd}  );
}
`;
    const finalProvidersContent = isNext 
      ? providersContent 
      : providersContent.replace(/@\/shared/g, './shared');

    await fs.writeFile(globalProvidersPath, finalProvidersContent);

    if (isNext) {
      const layoutPath = path.join(srcPath, 'app', 'layout.tsx');
      if (await fs.pathExists(layoutPath)) {
        let layoutContent = await fs.readFile(layoutPath, 'utf-8');
        if (!layoutContent.includes('Providers')) {
          layoutContent = layoutContent.replace(
            /export default function RootLayout/,
            `import Providers from './providers';\n\nexport default function RootLayout`
          );
          layoutContent = layoutContent.replace(/{children}/g, `<Providers>{children}</Providers>`);
          await fs.writeFile(layoutPath, layoutContent);
        }
      }
    } else {
      const mainPath = path.join(srcPath, 'main.tsx');
      if (await fs.pathExists(mainPath)) {
        let mainContent = await fs.readFile(mainPath, 'utf-8');
        if (!mainContent.includes('Providers')) {
          mainContent = mainContent.replace(
            /import App from '.\/App.tsx'/,
            `import App from './App.tsx'\nimport Providers from './providers.tsx'`
          );
          mainContent = mainContent.replace(
            /<App \/>/g,
            `<Providers>\n      <App />\n    </Providers>`
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
    featureSpinner.succeed(`Generated features: ${features.join(', ')}`);
  } else {
    console.log(chalk.yellow('ℹ No features requested. The src/features/ folder is ready.'));
  }

  console.log(chalk.blue('\nSetup complete! You can now start building your app.'));
}
