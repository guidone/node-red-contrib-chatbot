var markdown = require( "markdown" ).markdown;
var marked = require('marked');

var _ = require('underscore');
var fs = require('fs');

var mappings = {
  'Buttons-node.md': 'chatbot-inline-buttons.html'
};



console.log('Generating inline documentation...');
_(mappings).map(function(nodeFile, markdownFile) {
  console.log('- ' + markdownFile);

  var markdownSource = fs.readFileSync(__dirname + '/../wiki/' + markdownFile, 'utf8');
  var htmlSource = marked(markdownSource);
  var nodeSource = fs.readFileSync(__dirname + '/../' + nodeFile, 'utf8');
  var nodeName = nodeFile.replace('.html', '');

  var newDoc = '<script type="text\/x-red" data-help-name="' + nodeName + '">' + htmlSource + '</script>';
  var regexp = new RegExp('<script type=\"text\/x-red\" data-help-name=\"' + nodeName + '\">[\\s\\S]*<\/script>', 'g');

  // replace
  //nodeSource = nodeSource.replace(/<script type=\"text\/x-red\" data-help-name=\"chatbot-inline-buttons\">[\s\S]*<\/script>/g, newDoc);
  nodeSource = nodeSource.replace(regexp, newDoc);

  fs.writeFileSync(__dirname + '/../' + nodeFile, nodeSource, 'utf8');
});





