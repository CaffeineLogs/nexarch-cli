const fs = require('fs');

let initTs = fs.readFileSync('./src/commands/init.ts', 'utf-8');

// Replace the v3 installation and config with v4
const oldViteSetup = `      spinner.text = 'Setting up Tailwind CSS...';
      await execAsync(\`\${installDevCmd} tailwindcss@^3 postcss autoprefixer\`);
      await execAsync(\`\${execCmd} tailwindcss init -p\`);
      
      const tailwindConfigPath = path.join(cwd, 'tailwind.config.js');
      await fs.writeFile(tailwindConfigPath, \`/** @type {import('tailwindcss').Config} */\\nexport default {\\n  content: [\\n    "./index.html",\\n    "./src/**/*.{js,ts,jsx,tsx}",\\n  ],\\n  theme: {\\n    extend: {},\\n  },\\n  plugins: [],\\n}\\n\`);

      const appPath = path.join(cwd, 'src', 'App.tsx');
      await fs.writeFile(appPath, \`export default function App() {\\n  return (\\n    <div className="min-h-screen p-8">\\n      <h1 className="text-2xl font-bold">Nexarch Clean Architecture</h1>\\n    </div>\\n  );\\n}\\n\`);
      
      const cssPath = path.join(cwd, 'src', 'index.css');
      await fs.writeFile(cssPath, \`@tailwind base;\\n@tailwind components;\\n@tailwind utilities;\\n\`);`;

const newViteSetup = `      spinner.text = 'Setting up Tailwind CSS v4...';
      await execAsync(\`\${installCmd} tailwindcss @tailwindcss/vite\`);
      
      const viteConfigPath = path.join(cwd, 'vite.config.ts');
      if (await fs.pathExists(viteConfigPath)) {
        let viteConfig = await fs.readFile(viteConfigPath, 'utf-8');
        viteConfig = viteConfig.replace(
          /import react from '@vitejs\\/plugin-react'/,
          \`import react from '@vitejs/plugin-react'\\nimport tailwindcss from '@tailwindcss/vite'\`
        );
        viteConfig = viteConfig.replace(
          /plugins: \\[react\\(\\)\\]/,
          \`plugins: [tailwindcss(), react()]\`
        );
        await fs.writeFile(viteConfigPath, viteConfig);
      }

      const appPath = path.join(cwd, 'src', 'App.tsx');
      await fs.writeFile(appPath, \`export default function App() {\\n  return (\\n    <div className="min-h-screen p-8">\\n      <h1 className="text-2xl font-bold">Nexarch Clean Architecture</h1>\\n    </div>\\n  );\\n}\\n\`);
      
      const cssPath = path.join(cwd, 'src', 'index.css');
      await fs.writeFile(cssPath, \`@import "tailwindcss";\\n\`);`;

initTs = initTs.replace(oldViteSetup, newViteSetup);

fs.writeFileSync('./src/commands/init.ts', initTs);
console.log('init.ts updated to Tailwind CSS v4');
