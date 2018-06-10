import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as open from 'opn';
import * as path from 'path';
import { pri } from '../../node';
import { log } from '../../utils/log';
import { findNearestNodemodulesFile } from '../../utils/npm-finder';
import { testsPath, tsBuiltPath } from '../../utils/structor-config';
import text from '../../utils/text';
import { tsPlusBabel } from '../../utils/ts-plus-babel';

export const CommandTest = async (instance: typeof pri) => {
  log(`Build typescript files`);
  execSync(`${findNearestNodemodulesFile('/.bin/rimraf')} ${tsBuiltPath.dir}`, { stdio: 'inherit' });

  await tsPlusBabel(tsBuiltPath.dir);

  execSync(
    [
      findNearestNodemodulesFile('/.bin/nyc'),
      `--reporter lcov`,
      `--reporter text`,
      `--reporter json`,
      `--exclude ${tsBuiltPath.dir}/${testsPath.dir}/**/*.js`,
      `${findNearestNodemodulesFile('/.bin/ava')}`,
      `--files ${path.join(instance.projectRootPath, `${tsBuiltPath.dir}/${testsPath.dir}/**/*.js`)}`,
      `--failFast`
    ].join(' '),
    {
      stdio: 'inherit',
      cwd: instance.projectRootPath
    }
  );

  // remove .nyc_output
  execSync(`${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(instance.projectRootPath, '.nyc_output')}`);

  // Open test html in brower
  open(path.join(instance.projectRootPath, 'coverage/lcov-report/index.html'));

  process.exit(0);
};

export default async (instance: typeof pri) => {
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath.startsWith(testsPath.dir);
  });

  instance.commands.registerCommand({
    name: 'test',
    description: text.commander.init.description,
    action: async () => {
      await instance.project.lint();
      await instance.project.checkProjectFiles();
      await CommandTest(instance);

      // For async register commander, process will be exit automatic.
      process.exit(0);
    }
  });
};
