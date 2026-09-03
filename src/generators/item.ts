import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { toPascalCase, toCamelCase } from '../utils/string';

export async function generateItem(type: string, featureName: string, itemName?: string, silent: boolean = false): Promise<void> {
  const srcPath = path.join(process.cwd(), 'src', 'features', featureName);
  await fs.ensureDir(srcPath);

  // Defaults based on user request: store, types, utils default to featureName
  let finalItemName = itemName;
  if (!finalItemName) {
    if (['store', 'type', 'util', 'api'].includes(type)) {
      finalItemName = featureName;
    } else {
      if (!silent) console.log(chalk.red(`Error: Please provide a name for the ${type}`));
      return;
    }
  }

  const pascalName = toPascalCase(finalItemName);
  const camelName = toCamelCase(finalItemName);
  
  let filePath = '';
  let content = '';

  switch (type) {
    case 'component':
      await fs.ensureDir(path.join(srcPath, 'components'));
      filePath = path.join(srcPath, 'components', `${pascalName}.tsx`);
      content = `export const ${pascalName} = () => {
  return (
    <div>
      ${pascalName} Component
    </div>
  );
};
`;
      break;
    case 'hook':
      await fs.ensureDir(path.join(srcPath, 'hooks'));
      const hookName = finalItemName.startsWith('use') ? finalItemName : `use${pascalName}`;
      filePath = path.join(srcPath, 'hooks', `${hookName}.ts`);
      content = `export const ${hookName} = () => {
  return {};
};
`;
      break;
    case 'api':
      await fs.ensureDir(path.join(srcPath, 'api'));
      filePath = path.join(srcPath, 'api', `${finalItemName.toLowerCase()}.api.ts`);
      content = `import { apiClient } from '@/shared/providers/api/ApiClientProvider.provider';

export const get${pascalName} = async () => {
  const response = await apiClient.get('/api/${finalItemName.toLowerCase()}');
  return response.data;
};
`;
      break;
    case 'store':
      await fs.ensureDir(path.join(srcPath, 'store'));
      filePath = path.join(srcPath, 'store', `${finalItemName.toLowerCase()}.store.ts`);
      content = `export const use${pascalName}Store = () => {
  // Implement store logic
};
`;
      break;
    case 'type':
      await fs.ensureDir(path.join(srcPath, 'types'));
      filePath = path.join(srcPath, 'types', `${finalItemName.toLowerCase()}.types.ts`);
      content = `export interface ${pascalName} {
  id: string;
}
`;
      break;
    case 'util':
      await fs.ensureDir(path.join(srcPath, 'utils'));
      filePath = path.join(srcPath, 'utils', `${finalItemName.toLowerCase()}.rules.ts`);
      content = `export const is${pascalName}Valid = () => {
  return true;
};
`;
      break;
    default:
      if (!silent) console.log(chalk.red(`Error: Unknown type ${type}`));
      return;
  }

  if (await fs.pathExists(filePath)) {
    if (!silent) console.log(chalk.yellow(`Warning: ${filePath} already exists. Skipping.`));
    return;
  }

  await fs.writeFile(filePath, content);
  if (!silent) console.log(chalk.green(`✔ Created ${type}: ${filePath}`));
}
