import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { generateItem } from './item';
import { GenerateOptions } from '../commands/generate';
import { toPascalCase } from '../utils/string';

export async function generateFeature(featureName: string, options: GenerateOptions): Promise<void> {
  const srcPath = path.join(process.cwd(), 'src', 'features', featureName);
  await fs.ensureDir(srcPath);

  if (options.all || options.api) {
    await generateItem('api', featureName, featureName, options.silent);
  }
  if (options.all || options.component) {
    await generateItem('component', featureName, `${toPascalCase(featureName)}View`, options.silent);
  }
  if (options.all || options.hook) {
    await generateItem('hook', featureName, `use${toPascalCase(featureName)}`, options.silent);
  }
  if (options.all || options.store) {
    await generateItem('store', featureName, featureName, options.silent);
  }
  if (options.all || options.type) {
    await generateItem('type', featureName, featureName, options.silent);
  }
  if (options.all || options.util) {
    await generateItem('util', featureName, featureName, options.silent);
  }

  // Generate index.ts for the public API
  const indexPath = path.join(srcPath, 'index.ts');
  if (!(await fs.pathExists(indexPath))) {
    let indexContent = '// Public API for this feature\n';
    if (options.all || options.component) {
      indexContent += `export * from './components/${toPascalCase(featureName)}View';\n`;
    }
    if (options.all || options.hook) {
      indexContent += `export * from './hooks/use${toPascalCase(featureName)}';\n`;
    }
    if (options.all || options.type) {
      indexContent += `export * from './types/${featureName.toLowerCase()}.types';\n`;
    }
    
    await fs.writeFile(indexPath, indexContent);
    if (!options.silent) console.log(chalk.green(`✔ Created index.ts: ${indexPath}`));
  }
}
