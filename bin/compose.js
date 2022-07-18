/* eslint-disable no-console */
const prompts = require('prompts');
const _ = require('lodash');
const { writeFileSync, existsSync, lstatSync, readFileSync, readdirSync } = require('fs');

const lcd = require('../lib/lcd/index');

const projects = readFileSync(`${__dirname}/../.local-bots`, 'utf8')
  .split('\n')
  .filter(str => !_.isEmpty(str));
const folderExists = dir => existsSync(dir) && lstatSync(dir).isDirectory();

(async () => {
  // eslint-disable-next-line no-console
  console.log(lcd.orange('RedBot Dev Environment') + ': ' + lcd.white('v0.2'));
  // eslint-disable-next-line no-console
  console.log('');
  const response = await prompts(
    {
      type: 'select',
      name: 'value',
      message: 'Project to run',
      choices: [
        ...projects
          .map((item) => {
            const [name, dir, projects, beEnvironment, feEnvironment] = item.split(',');
            return {
              title: name,
              description: `${dir} (${projects === 'PROJECTS' ? 'projects' : 'standalone'}) - BE:${beEnvironment}/FE:${feEnvironment}`,
              value: item
            }
          }),
        { title: 'New', value: 'new' },
        { title: 'Quit', value: 'quit' }
      ],
      initial: 0
    }
  );

  if (response.value === 'quit') {
    // eslint-disable-next-line no-console
    console.log('Quitting.');
    // eslint-disable-next-line no-console
    console.log('');
    process.exit(1);
  } else if (response.value === 'new') {

    const dirs = readdirSync(__dirname + '/../mc_plugins', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    const response = await prompts([
      {
        type: 'text',
        name: 'name',
        message: 'Project name',
        validate: value => {
          if (_.isEmpty(value)) {
            return 'Project name cannot be empty.';
          } else if (value.includes(',')) {
            return 'Please don\'t include commas in the project name';
          }
          return true;
        }
      },
      {
        type: 'text',
        name: 'dir',
        message: 'Project path',
        description: 'Please create an empty dir',
        validate: value => {
          if (!folderExists(value)) {
            return 'Path is invalid or is not a folder.';
          }
          return true;
        }
      },
      {
        type: 'select',
        name: 'projects',
        message: 'Enable Node-RED projects',
        choices: [
          { title: 'Yes', value: 'PROJECTS' },
          { title: 'No', value: 'STANDALONE' }
        ],
        initial: 0
      },
      {
        type: 'select',
        name: 'frontendEnvironment',
        message: 'Select backend environment',
        choices: [
          { title: 'Development', value: 'development' },
          { title: 'Production', value: 'production' }
        ],
        initial: 0
      },
      {
        type: 'select',
        name: 'backendEnvironment',
        message: 'Select backend environment',
        choices: [
          { title: 'Development', value: 'development' },
          { title: 'Plugin Mode', value: 'plugin' },
          { title: 'Production', value: 'production' }
        ],
        initial: 0
      },
      {
        type: prev => prev === 'development' ? 'multiselect' : null,
        name: 'plugins',
        message: 'Select local plugins to include',
        choices: dirs.map(({ name }) => ({ title: name, color: '#0336699' })),
        hint: '- Space to select. Return to submit',
        format: value => value.map(idx => dirs[idx].name)
      }
    ]);

    // update local bots
    writeFileSync(
      `${__dirname}/../.local-bots`,
      [...projects, `${response.name},${response.dir},${response.projects},${response.backendEnvironment},${response.frontendEnvironment},${(response.plugins || []).join('|')}`].join('\n'),
      'utf8'
    );
    let developmentMode = 'false';
    if (response.frontendEnvironment === 'development') {
      developmentMode = 'true';
    } else if (response.frontendEnvironment === 'plugin') {
      developmentMode = 'plugin';
    }
    // update .env file
    const env = [
      'REDBOT_DIR=.',
      'REDBOT_ENABLE_MISSION_CONTROL=true',
      `REDBOT_DEVELOPMENT_MODE=${developmentMode}`,
      `DATA_DIR=${response.dir}`,
      `NODE_RED_ENABLE_PROJECTS=${projects === 'PROJECTS' ? 'true' : 'false'}`,
      `ENVIRONMENT=${response.backendEnvironment}`,
      `REDBOT_DEVELOPMENT_PLUGINS=${(response.plugins || []).join(',')}`
    ];
    writeFileSync(`${__dirname}/../.env`, env.join('\n'));

    // eslint-disable-next-line no-console
    console.log('');
    console.log(`Starting "${response.name}" -> (${response.dir})`);
    console.log('');
  } else {
    const [name, dir, projects, backendEnvironment, frontendEnvironment, plugins = ''] = response.value.split(',');

    // eslint-disable-next-line no-console
    console.log(`Starting ${name} (${dir})`);

    if (!folderExists(dir)) {
      // eslint-disable-next-line no-console
      console.log(`Folder ${dir} doesn't exist or it's not a folder.`);
      process.exit(1);
    }
    let developmentMode = 'false';
    if (frontendEnvironment === 'development') {
      developmentMode = 'true';
    } else if (frontendEnvironment === 'plugin') {
      developmentMode = 'plugin';
    }
    const env = [
      'REDBOT_DIR=.',
      'REDBOT_ENABLE_MISSION_CONTROL=true',
      `REDBOT_DEVELOPMENT_MODE=${developmentMode}`,
      `DATA_DIR=${dir}`,
      'NODE_RED_ENABLE_PROJECTS=' + (projects === 'PROJECTS' ? 'true' : 'false'),
      `ENVIRONMENT=${backendEnvironment}`,
      `REDBOT_DEVELOPMENT_PLUGINS=${plugins.replaceAll('|', ',')}`
    ];

    writeFileSync(`${__dirname}/../.env`, env.join('\n'));
  }
})();