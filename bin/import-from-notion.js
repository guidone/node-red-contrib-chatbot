/* eslint-disable no-console */
const request = require('request').defaults({ encoding: null });
const marked = require('marked');
const clc = require('cli-color');
const _ = require('underscore');
const fs = require('fs');




const green = clc.greenBright;
const white = clc.white;
const grey = clc.blackBright;
const orange = clc.xterm(214);

const nodeDefinitions = require('./nodes');







const { Client } = require('@notionhq/client')
const { NotionToMarkdown } = require('notion-to-md');

// Initializing a client
const notion = new Client({
  auth: '',
})


// https://www.notion.so/red-bot/Alexa-Card-node-fc89c43d79324c8da2f251e26f638246
// https://www.notion.so/red-bot/Alexa-Card-node-fc89c43d79324c8da2f251e26f638246

//(async () => {
  /*.then(fottiti => console.log(fottiti));*/
//})();

// TODO conversion from url

//const NotionPageToHtml = require('notion-page-to-html');
//const nodes = require('./nodes');

const n2m = new NotionToMarkdown({ notionClient: notion });

/*
  NotionPageToHtml: doesn't support table, faulty with code blocks

*/

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
