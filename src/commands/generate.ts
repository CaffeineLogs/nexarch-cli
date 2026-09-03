import chalk from 'chalk';
import { generateFeature } from '../generators/feature';
import { generateItem } from '../generators/item';

export interface GenerateOptions {
  component?: boolean;
  hook?: boolean;
  store?: boolean;
  type?: boolean;
  util?: boolean;
  api?: boolean;
  all?: boolean;
  silent?: boolean;
}

const VALID_TYPES = ['feature', 'component', 'hook', 'store', 'type', 'util', 'api'];

export async function generateCommand(
  typeOrFeature: string | undefined,
  names: string[],
  options: GenerateOptions
): Promise<void> {
  if (!typeOrFeature) {
    console.log(chalk.red('Please provide a type or feature name.'));
    return;
  }

  const isFlagsEmpty =
    !options.component &&
    !options.hook &&
    !options.store &&
    !options.type &&
    !options.util &&
    !options.api;

  let isTypeExplicit = VALID_TYPES.includes(typeOrFeature);
  let type = isTypeExplicit ? typeOrFeature : 'feature'; // Default to feature if it's implicitly a feature name
  let targetNames = isTypeExplicit ? names : [typeOrFeature, ...names];

  if (type === 'feature' || (!isTypeExplicit && !isFlagsEmpty)) {
    // Treat as feature generation or implicit feature generation with flags
    if (isFlagsEmpty) {
      options.all = true;
    }

    for (const name of targetNames) {
      console.log(chalk.blue(`Generating for feature: ${name}`));
      await generateFeature(name, options);
    }
  } else {
    // Explicit item generation (e.g., nexarch g component auth LoginForm)
    const featureName = targetNames[0];
    if (!featureName) {
      console.log(chalk.red(`Please provide a feature name. Example: nexarch g ${type} auth`));
      return;
    }

    const itemName = targetNames[1]; // might be undefined

    await generateItem(type, featureName, itemName);
  }
}
