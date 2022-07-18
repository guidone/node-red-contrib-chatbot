/* eslint-disable no-console */
const prompts = require('prompts');
const path = require('path');
const { readdirSync, statSync, mkdirSync, writeFileSync, existsSync } = require('fs');
const { exec } = require('child_process');

const lcd = require('../lib/lcd/index');

const isValidPluginName = pluginName => pluginName.match(/^[A-Za-z0-9-_]*$/);

(async () => {
  console.log(lcd.orange('RedBot Mission Control') + ': Plugin tools ' + lcd.white('v0.2'));
  console.log('');
  const response = await prompts(
    {
      type: 'select',
      name: 'value',
      message: 'Plugins',
      choices: [
        { title: 'Create', description: 'Create a plugin', value: 'create' },
        { title: 'Build', description: 'Build a plugin', value: 'build' },
        { title: 'Quit', value: 'quit' }
      ],
      initial: 0
    }
  );

  if (response.value === 'build') {
    console.log('Quitting.');
    console.log('');
  }

  if (response.value === 'build') {
    const dirs = readdirSync(__dirname + '/../mc_plugins', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());
    const response = await prompts(
      {
        type: 'select',
        name: 'value',
        message: 'Select plugin',
        choices: dirs.map(dir => ({ title: dir.name, value: dir.name })),
        initial: 0
      }
    );
    if (response.value == null) {
      console.log('Aborted.');
      console.log('');
      return;
    }
    console.log(lcd.green('Building plugin: ') + ' ' + response.value);
    exec(`npm run build-plugin -- --env plugin='${response.value}'`, (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }
      const buildFile = `${__dirname}/../mc_plugins/${response.value}/index.js`;
      const stats = statSync(buildFile);
      console.log(lcd.green('Build complete!'));
      console.log(lcd.green('File: ') + ' ' + lcd.grey(path.normalize(buildFile)));
      console.log(lcd.green('Size: ') + ' ' + lcd.grey((stats.size / 1024).toFixed(2) + ' KB'));
      console.log('');
    });
  }

  if (response.value === 'create') {
    const response = await prompts({
      type: 'text',
      name: 'value',
      message: 'Plugin name',
      //validate: value => value != null && value !== '' ? true : `Invalid plugin name, juste letters and numbers or "_", "-"`
      validate: value => {
        if (!isValidPluginName(value)) {
          return 'Invalid plugin name, juste letters and numbers or "_", "-"';
        } else if (existsSync(`${__dirname}/../mc_plugins/${value}`)) {
          return 'Plugin already exists';
        }
        return true;
      }
    });
    const createDir = `${__dirname}/../mc_plugins/${response.value}`;
    mkdirSync(createDir);
    writeFileSync(`${createDir}/index.js`, `import React from 'react';
import { plug } from 'code-plug';

plug('pages', MyPage, {
  url: '/${response.value}',
  title: '${response.value}',
  id: '${response.value}',
});

`);
    writeFileSync(`${createDir}/package.json`, `{
  "name": "${response.value}",
  "version": "0.1.0",
  "description": "",
  "main": "index.js",
  "author": {
    "name": "",
    "email": "",
    "url": ""
  },
  "homepage": "",
  "license": "ISC",
  "repository": "",
  "dependencies": {
  },
  "devDependencies": {
  }
}
`);

    writeFileSync(`${createDir}/README.md`, `# ${response.value}

  `);

    exec('git init', {
      cwd: createDir },
      (err, stdout, stderr) => {
        if (err) {
          console.log(`error: ${err.message}`);
          return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(lcd.green('Plugin created!'));
        console.log(lcd.green('Plugin dir: ') + ' ' + lcd.grey(path.normalize(createDir)));
        console.log('');
      }
    );
  }
})();