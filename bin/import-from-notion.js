/* eslint-disable no-console */
const marked = require('marked');
const clc = require('cli-color');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { Client } = require('@notionhq/client')
const { NotionToMarkdown } = require('notion-to-md');

const green = clc.greenBright;
// const white = clc.white;
const grey = clc.blackBright;
const cyan = clc.cyanBright;
const yellow = clc.yellowBright;
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

const assetsDir = path.join(__dirname, '..', 'docs', 'assets');
const assetsRelative = './docs/assets';

const mimeTypeFor = ext => {
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/png';
  }
};

// Scan markdown for image URLs, download each one to ./docs/assets and
// return a map of { originalUrl: relativeLocalPath } so we can rewrite the
// markdown / HTML to point at the local copies instead of the Notion S3
// links that embed short-lived access tokens.
const extractImages = async function(mdSource) {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const urlToLocal = {};
  const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = imageRegex.exec(mdSource)) !== null) {
    const rawUrl = match[1].trim().replace(/\s+".*"$/, '');
    if (!/^https?:\/\//i.test(rawUrl) || urlToLocal[rawUrl]) {
      continue;
    }

    const cleanUrl = rawUrl.split('?')[0];
    const hash = crypto.createHash('md5').update(cleanUrl).digest('hex').substring(0, 16);
    const extMatch = cleanUrl.match(/\.([a-zA-Z0-9]{2,4})$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
    const filename = `${hash}.${ext}`;
    const localPath = path.join(assetsDir, filename);

    if (!fs.existsSync(localPath)) {
      const displayUrl = cleanUrl.replace(/^https?:\/\//, '');
      const shortUrl = displayUrl.length > 70 ? displayUrl.substring(0, 67) + '...' : displayUrl;
      console.log(`  ${cyan('↓')} ${yellow(filename)} ${grey('← ' + shortUrl)}`);
      try {
        const response = await fetch(rawUrl);
        if (!response.ok) {
          console.log(`    ${clc.redBright('✗')} ${grey('HTTP ' + response.status)}`);
          continue;
        }
        const buffer = await response.buffer();
        fs.writeFileSync(localPath, buffer);
      } catch (err) {
        console.log(`    ${clc.redBright('✗')} ${grey(err.message)}`);
        continue;
      }
    }

    urlToLocal[rawUrl] = `${assetsRelative}/${filename}`;
  }

  return urlToLocal;
};

const parseMarkdownWithImages = async function(mdSource) {
  const urlToLocal = await extractImages(mdSource);
  let markdown = mdSource;
  for (const [originalUrl, localPath] of Object.entries(urlToLocal)) {
    markdown = markdown.split(originalUrl).join(localPath);
  }
  return { markdown, html: marked.parse(markdown) };
};

const inlineAssetsAsBase64 = htmlSource => {
  const assetRegex = /\.\/docs\/assets\/([A-Za-z0-9_-]+\.[A-Za-z0-9]{2,4})/g;
  return htmlSource.replace(assetRegex, (full, filename) => {
    const localPath = path.join(assetsDir, filename);
    if (!fs.existsSync(localPath)) {
      return full;
    }
    const ext = path.extname(filename).slice(1);
    const base64 = fs.readFileSync(localPath).toString('base64');
    return `data:${mimeTypeFor(ext)};base64,${base64}`;
  });
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
    const { markdown: safeMd, html: htmlSource } = await parseMarkdownWithImages(mdSource);

    // write markdown locally (with image URLs rewritten to ./docs/assets)
    fs.writeFileSync(nodesDocsDir + '/' + node.nodeType + '.md', safeMd, 'utf8');

    const titleMatch = safeMd.match(/^#\s+(.+)$/m);
    const title = titleMatch != null ? titleMatch[1].trim() : node.nodeType;
    docsIndex.push({ nodeType: node.nodeType, title });

    let nodeSource;
    try {
      nodeSource = fs.readFileSync(__dirname + '/../nodes/' + node.nodeFile, 'utf8');
    } catch(e) {
      console.log(`Unable to find file ${node.nodeFile}`);
    }

    const inlinedHtml = inlineAssetsAsBase64(htmlSource);
    const regexp = new RegExp('<script type=\"(text\/x-red|text\/html)\" data-help-name=\"' + node.nodeType + '\">[\\s\\S]*?<\/script>', 'g');
    nodeSource = nodeSource.replace(regexp, (_match, scriptType) => {
      return '<script type="' + scriptType + '" data-help-name="' + node.nodeType + '">' + inlinedHtml + '</script>';
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
