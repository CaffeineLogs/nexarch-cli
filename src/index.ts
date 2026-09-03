import { Command } from 'commander';
import { CLI_NAME } from './constants';
import { initCommand } from './commands/init';
import { generateCommand } from './commands/generate';
import chalk from 'chalk';

const program = new Command();

program
  .name(CLI_NAME)
  .description(chalk.cyan('CLI to scaffold Clean Architecture for Frontend Projects'))
  .version('1.0.0', '-v, --version')
  .addHelpText('after', `
${chalk.bold.blue('Example Usage:')}
  $ ${chalk.green('nexarch init')}
  $ ${chalk.green('nexarch g feature auth profile')}
  $ ${chalk.green('nexarch g feature orders -cs')}

${chalk.bold.blue("Generate Options (use with 'nexarch generate' or 'nexarch g'):")}
  ${chalk.yellow('-c, --component')}    Generate a React component
  ${chalk.yellow('-h, --hook')}         Generate a custom React hook
  ${chalk.yellow('-s, --store')}        Generate a state management store
  ${chalk.yellow('-t, --type')}         Generate TypeScript types/interfaces
  ${chalk.yellow('-u, --util')}         Generate utility/rules functions
  ${chalk.yellow('-a, --api')}          Generate an API client file

${chalk.dim('Note: You can combine flags! e.g., ')}${chalk.cyan("'nexarch g feature dashboard -chs'")}
`);

// Init Command
program
  .command('init')
  .description('Initialize the clean architecture project and features')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      console.error(chalk.red('Initialization failed:'), error);
      process.exit(1);
    }
  });

// Generate Command
program
  .command('generate')
  .alias('g')
  .description('Generate feature modules or specific items within a feature (e.g., components, hooks, stores)')
  .argument('[type]', 'Type to generate (feature, component, hook, store, type, util, api). If omitted, inferred from flags.')
  .argument('[names...]', 'Names of the features or items (space separated)')
  .option('-c, --component', 'Generate a React component in the feature')
  .option('-h, --hook', 'Generate a custom React hook in the feature')
  .option('-s, --store', 'Generate a state management store in the feature')
  .option('-t, --type', 'Generate TypeScript types/interfaces in the feature')
  .option('-u, --util', 'Generate utility/rules functions in the feature')
  .option('-a, --api', 'Generate an API client file in the feature')
  .action(async (type, names, options) => {
    try {
      await generateCommand(type, names, options);
    } catch (error) {
      console.error(chalk.red('Generation failed:'), error);
      process.exit(1);
    }
  });

program.parse(process.argv);
