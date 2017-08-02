var markdown = require( "markdown" ).markdown;
var marked = require('marked');

var _ = require('underscore');
var fs = require('fs');

var mappings = {
  'Buttons-node.md': 'chatbot-inline-buttons.html',
  'Generic-Template-node.md': 'chatbot-generic-template.html',
  'List-Template-node.md': 'chatbot-list-template.html',
  'Quick-Replies-node.md': 'chatbot-quick-replies.html',
  'Messenger-Menu-node.md': 'chatbot-messenger-menu.html',
  'Document-node.md': 'chatbot-document.html',
  'Message-node.md': 'chatbot-message.html',
  'QR-Code-node.md': 'chatbot-qrcode.html',
  'Rivescript-node.md': 'chatbot-rivescript.html',
  'Conversation-node.md': 'chatbot-conversation.html',
  'Command-node.md': 'chatbot-command.html',
  'Analytics-node.md': 'chatbot-analytics.html',
  'Transport-node.md': 'chatbot-transport.html',
  'Topic-node.md': 'chatbot-topic.html',
  'Debug-node.md': 'chatbot-debug.html',
  'Parse-node.md': 'chatbot-parse.html',
  'Request-node.md': 'chatbot-request.html',
  'Video-node.md': 'chatbot-video.html',
  'Audio-node.md': 'chatbot-audio.html',
  'Voice-node.md': 'chatbot-voice.html',
  'Image-node.md': 'chatbot-image.html',
  'Language-node.md': 'chatbot-language.html',
  'Authorized-node.md': 'chatbot-authorized.html',
  'Log-node.md': 'chatbot-log.html',
  'Listen-node.md': 'chatbot-listen.html'
};


console.log('Generating inline documentation...');
_(mappings).map(function(nodeFile, markdownFile) {
  console.log('- ' + markdownFile);

  var markdownSource = fs.readFileSync(__dirname + '/../wiki/' + markdownFile, 'utf8');
  var htmlSource = marked(markdownSource);
  var nodeSource = fs.readFileSync(__dirname + '/../' + nodeFile, 'utf8');
  var nodeName = nodeFile.replace('.html', '');

  // reformat tables with dl, dt, dd, Node-RED standard
  // table always 3 cell: name of field, type, description
  htmlSource = htmlSource.replace(/<table>/g, '<dl class="message-properties">');
  htmlSource = htmlSource.replace(/<\/table>/g, '</dl>');
  htmlSource = htmlSource.replace(/<thead>[\s\S]*<\/thead>/g, '');
  htmlSource = htmlSource.replace(/<tbody>/g, '');
  htmlSource = htmlSource.replace(/<\/tbody>/g, '');
  var matches = htmlSource.match(/<tr>([\s\S]*?)<\/tr>/g);
  _(matches).each(function(row) {
    var cells = row.match(/<td>([\s\S]*?)<\/td>/g);
    cells = _(cells).map(function(cell) {
      return cell.replace('<td>', '').replace('</td>', '');
    });
    htmlSource = htmlSource.replace(row,
      '<dt>' + cells[0] + '<span class="property-type">' + cells[1] +'</span>' +
      '<dd>' + cells[2] + '</dd>'
    );
  });

  // replace inline documentation
  var newDoc = '<script type="text\/x-red" data-help-name="' + nodeName + '">' + htmlSource + '</script>';
  var regexp = new RegExp('<script type=\"text\/x-red\" data-help-name=\"' + nodeName + '\">[\\s\\S]*<\/script>', 'g');
  nodeSource = nodeSource.replace(regexp, newDoc);

  fs.writeFileSync(__dirname + '/../' + nodeFile, nodeSource, 'utf8');
});





