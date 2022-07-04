/* eslint-disable no-console */
const marked = require('marked');
const clc = require('cli-color');
const fs = require('fs');
const { Client } = require('@notionhq/client')
const { NotionToMarkdown } = require('notion-to-md');

const green = clc.greenBright;
//const white = clc.white;
const grey = clc.blackBright;
const orange = clc.xterm(214);

const nodeDefinitions = require('./nodes');

if (!fs.existsSync(`${__dirname}/../.env-notion`)) {
  console.log('Missing notion token, skipping');
  process.exit();
}

const notionAuthToken = fs.readFileSync(`${__dirname}/../.env-notion`);

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

const getPage = async function(url) {
  // parse url
  const notionId = extractNotionId(url);

  // TODO check if valid
  const mdblocks = await n2m.pageToMarkdown(notionId);
  const mdString = n2m.toMarkdownString(mdblocks);

  const html = marked.parse(mdString);

  return html;
};

const runner = async function() {

  console.log(orange('Generating inline documentation...'));

  // download all nodes documentation from notion
  let idx = 0;
  for(idx = 0; idx < nodeDefinitions.length; idx++) {

    const node = nodeDefinitions[idx];
    console.log('- ' + grey(node.notionUrl) + ' (' + node.nodeType + ')');

    const htmlSource = await getPage(node.notionUrl);

    let nodeSource;
    try {
      nodeSource = fs.readFileSync(__dirname + '/../nodes/' + node.nodeFile, 'utf8');
    } catch(e) {
      console.log(`Unable to find file ${node.nodeFile}`);
    }

    const newDoc = '<script type="text\/x-red" data-help-name="' + node.nodeType + '">' + htmlSource + '</script>';
    const regexp = new RegExp('<script type=\"text\/x-red\" data-help-name=\"' + node.nodeType + '\">[\\s\\S]*?<\/script>', 'g');
    nodeSource = nodeSource.replace(regexp, newDoc);

    fs.writeFileSync(__dirname + '/../nodes/' + node.nodeFile, nodeSource, 'utf8');
  }

  // end
  console.log(green('All done.'));
  console.log('');
};

runner();
