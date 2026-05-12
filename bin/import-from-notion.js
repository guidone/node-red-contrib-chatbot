/* eslint-disable no-console */
const marked = require('marked');
const clc = require('cli-color');
const fs = require('fs');
const { Client } = require('@notionhq/client')
const { NotionToMarkdown } = require('notion-to-md');

const green = clc.greenBright;
// const white = clc.white;
const grey = clc.blackBright;
// const orange = clc.xterm(214);

const nodeDefinitions = require('./nodes');

// notion api key
let notionAuthToken = process.env.NOTION_API_KEY;
if (fs.existsSync(`${__dirname}/../.env-notion`)) {
  const raw = fs.readFileSync(`${__dirname}/../.env-notion`, 'utf8').trim();
  const match = raw.match(/^\s*(?:NOTION_API_KEY\s*=\s*)?["']?([^"'\s]+)["']?\s*$/m);
  notionAuthToken = match != null ? match[1] : raw;
}
if (notionAuthToken == null || notionAuthToken === '') {
  console.log('Missing notion token, skipping');
  process.exit();
}


// Initializing a client
const notion = new Client({ auth: notionAuthToken });
const n2m = new NotionToMarkdown({ notionClient: notion });

const extractNotionId = url => {
  const matched = url.match(/\-([a-z0-9]{32,32})$/);
  if (matched != null) {
    let notionId = String(matched[1]);

    return notionId.substring(0, 8) + '-'
      + notionId.substring(8, 12) + '-'
      + notionId.substring(12, 16) + '-'
      + notionId.substring(16, 20) + '-'
      + notionId.substring(20, 32);
  }
};

const getMarkdownPage = async function(url) {
  // parse url
  const notionId = extractNotionId(url);

  // TODO check if valid
  const mdblocks = await n2m.pageToMarkdown(notionId);
  const mdString = n2m.toMarkdownString(mdblocks);

  return mdString;
};

const runner = async function() {

  console.log('# ' + grey('Building changelog:'));
  console.log('');

  const mdChangeLog = await getMarkdownPage('https://www.notion.so/redbot/Change-log-b46a94ab6bbc4c7d8a586cbc21af7d78');

  const mdReleases = mdChangeLog.match(/\|(.*)\|/gm);
  let changelog = '';

  mdReleases.forEach(row => {
    const splitted = row.split(' | ');

    if (splitted.length >= 2 && splitted[0].indexOf('------') === -1) {

      const version = splitted[0].replace(/^\|/, '').trim();
      const description = splitted[1].replace(/\\n$/, '').replace(/\|$/, '').trim();

      changelog += `- **${version}** - ${description}\n`;
    }
  });

  fs.writeFileSync(
    __dirname + '/../CHANGELOG.md',
    changelog,
    'utf8'
  );

  console.log('# ' + grey('Downloading nodes help:'));
  console.log('');

  const nodesDocsDir = __dirname + '/../docs/nodes';
  fs.mkdirSync(nodesDocsDir, { recursive: true });

  const docsIndex = [];

  // download all nodes documentation from notion
  let idx = 0;
  for(idx = 0; idx < nodeDefinitions.length; idx++) {

    const node = nodeDefinitions[idx];
    console.log('- ' + grey(node.notionUrl) + ' (' + node.nodeType + ')');

    const mdSource = await getMarkdownPage(node.notionUrl);
    const htmlSource = marked.parse(mdSource);

    fs.writeFileSync(nodesDocsDir + '/' + node.nodeType + '.md', mdSource, 'utf8');

    const titleMatch = mdSource.match(/^#\s+(.+)$/m);
    const title = titleMatch != null ? titleMatch[1].trim() : node.nodeType;
    docsIndex.push({ nodeType: node.nodeType, title });

    let nodeSource;
    try {
      nodeSource = fs.readFileSync(__dirname + '/../nodes/' + node.nodeFile, 'utf8');
    } catch(e) {
      console.log(`Unable to find file ${node.nodeFile}`);
    }

    const regexp = new RegExp('<script type=\"(text\/x-red|text\/html)\" data-help-name=\"' + node.nodeType + '\">[\\s\\S]*?<\/script>', 'g');
    nodeSource = nodeSource.replace(regexp, (_match, scriptType) => {
      return '<script type="' + scriptType + '" data-help-name="' + node.nodeType + '">' + htmlSource + '</script>';
    });

    fs.writeFileSync(__dirname + '/../nodes/' + node.nodeFile, nodeSource, 'utf8');
  }

  docsIndex.sort((a, b) => a.title.localeCompare(b.title));
  const indexContent = '# Nodes\n\n'
    + docsIndex.map(({ nodeType, title }) => `- [${title}](nodes/${nodeType}.md)`).join('\n')
    + '\n';
  fs.writeFileSync(__dirname + '/../docs/nodes.md', indexContent, 'utf8');

  // end
  console.log(green('All done.'));
  console.log('');
};

runner();
