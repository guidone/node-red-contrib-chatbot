var request = require('request').defaults({ encoding: null });
var marked = require('marked');
var clc = require('cli-color');
var _ = require('underscore');
var fs = require('fs');
var green = clc.greenBright;
var white = clc.white;
var grey = clc.blackBright;
var orange = clc.xterm(214);

var tasks = new Promise(function(resolve) {
  resolve();
});

var mappings = {
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
  'Listen-node.md': 'chatbot-listen.html',
  'Location-node.md': 'chatbot-location.html',
  'Context-node.md': 'chatbot-context.html',
  'Sticker-node.md': 'chatbot-sticker.html',
  'Animation-node.md': 'chatbot-animation.html',
  'Waiting-node.md': 'chatbot-waiting.html',
  'Listen-Lexicon-node.md': 'chatbot-listen-lexicon.html',
  'Slack-Receiver-node.md': 'chatbot-slack-receive.html|chatbot-slack-node',
  'Telegram-Receiver-node.md': 'chatbot-telegram-receive.html|chatbot-telegram-node',
  'Facebook-Receiver-node.md': 'chatbot-facebook-receive.html|chatbot-facebook-node',
  'Alexa-Receiver-node.md': 'chatbot-alexa-receive.html|chatbot-alexa-node',
  'Twilio-Receiver-node.md': 'chatbot-twilio-receive.html|chatbot-twilio-node',
  'Routee-Receiver-node.md': 'chatbot-routee-receive.html|chatbot-routee-node',
  'Microsoft-Teams-Receiver-node.md': 'chatbot-msteams-receive.html|chatbot-msteams-node',
  'Viber-Receiver-node.md': 'chatbot-viber-receive.html|chatbot-viber-node',
  'Switch-node.md': 'chatbot-rules.html',
  'Inline-Query-node.md': 'chatbot-inline-query.html',
  'Dialog-node.md': 'chatbot-dialog.html',
  'Rules-node.md': 'chatbot-rules.html',
  'Recast-node.md': 'chatbot-recast.html|chatbot-recast',
  'Recast-token-node.md': 'chatbot-recast.html|chatbot-recast-token',
  'Dialogflow-node.md': 'chatbot-dialogflow.html|chatbot-dialogflow',
  'Dialogflow-token-node.md': 'chatbot-dialogflow.html|chatbot-dialogflow-token',
  'Invoice-node.md': 'chatbot-invoice.html',
  'Invoice-Shipping-node.md': 'chatbot-invoice-shipping.html',
  'Chat-Context.md': 'chatbot-context-store.html',
  'Keyboard-node.md': 'chatbot-ask.html',
  'Buttons-node.md': 'chatbot-inline-buttons.html',
  'Extend-node.md': 'chatbot-extend.html',
  'Broadcast-node.md': 'chatbot-broadcast.html',
  'Support-table.md': 'chatbot-support-table.html',
  'Alexa-Card-node.md': 'chatbot-alexa-card.html',
  'Alexa-Speech-node.md': 'chatbot-alexa-speech.html',
  'Alexa-Directive-node.md': 'chatbot-alexa-directive.html',
  'Universal-Connector-node.md': 'chatbot-universal-receive.html|chatbot-universal-receive',
  'Slack-blocks-node.md': 'chatbot-slack-blocks.html',
  'Params-node.md': 'chatbot-params.html',
  'NLPjs-Train.md': 'chatbot-nlp-train.html|chatbot-nlpjs-train',
  'NLPjs-Entity.md': 'chatbot-nlp-entity.html|chatbot-nlpjs-entity',
  'NLPjs-Intent.md': 'chatbot-nlp-intent.html|chatbot-nlpjs-intent',
  'NLPjs-Save.md': 'chatbot-nlp-save.html|chatbot-nlpjs-save',
  'NLPjs-Load.md': 'chatbot-nlp-load.html|chatbot-nlpjs-load',
  'NLPjs-Process.md': 'chatbot-nlp.html|chatbot-nlpjs'
};

function collectImages(html) {
  var found = html.match(/<img src="(.*?)" .*?>/g);
  if (found == null) {
    return [];
  } else {
    return _(found).chain()
      .map(function(img) {
        if (img.indexOf('img.shields.io') !== -1) {
          return null;
        } else {
          var matchUrl = img.match(/src="(.*?)"/);
          return {
            html: img,
            url: matchUrl[1]
          };
        }
      })
      .compact()
      .value();
  }
}

function fetchImageBase64(url) {
  return new Promise(function(resolve, reject) {
    // convert url to github raw
    url = url.replace('github.com', 'raw.githubusercontent.com');
    url = url.replace('/blob/', '/');
    request.get(url, function(err, res, body) {
      resolve('data:image/png;base64,' + body.toString('base64'));
    });
  });
}

function fetchImagesBase64(images) {

  var chain = new Promise(function(resolve) {
    resolve();
  });

  _(images).map(function(image) {
    chain = chain.then(
      function() {
        console.log('    fetching ' + white(image.url));
        return fetchImageBase64(image.url).then(function(base64) {
          console.log(green('    fetched ') + Math.floor(base64.length / 1024) + white('kb'));
          image.base64 = base64;
        });
      }
    );
  });

  return chain.then(function() {
    return images;
  });
}


console.log(orange('Generating inline documentation...'));

_(mappings).map(function(nodeFile, markdownFile) {

  tasks = tasks.then(function() {

    return new Promise(function(resolve, reject) {

      var nodeName = null;
      if (nodeFile.indexOf('|') !== -1) {
        nodeName = nodeFile.split('|')[1];
        nodeFile = nodeFile.split('|')[0];
      } else {
        nodeName = nodeFile.replace('.html', '');
      }
      console.log('- ' + grey(markdownFile) + ' (' + nodeName + ')');

      var markdownSource = fs.readFileSync(__dirname + '/../wiki/' + markdownFile, 'utf8');
      var htmlSource = marked(markdownSource);
      try {
        var nodeSource = fs.readFileSync(__dirname + '/../nodes/' + nodeFile, 'utf8');
      } catch(e) {
        reject(e);
      }

      // reformat tables with dl, dt, dd, Node-RED standard
      // table always 3 cell: name of field, type, description
      htmlSource = htmlSource.replace(/<table>/g, '<dl class="message-properties">');
      htmlSource = htmlSource.replace(/<\/table>/g, '</dl>');
      htmlSource = htmlSource.replace(/<thead>[\s\S]*?<\/thead>/g, '');
      htmlSource = htmlSource.replace(/<tbody>/g, '');
      htmlSource = htmlSource.replace(/<\/tbody>/g, '');
      var matches = htmlSource.match(/<tr>([\s\S]*?)<\/tr>/g);
      _(matches).each(function(row) {
        var cells = row.match(/<td>([\s\S]*?)<\/td>/g);
        cells = _(cells).map(function(cell) {
          return cell.replace('<td>', '').replace('</td>', '');
        });
        var cellName = cells[0];
        var cellType = cells.length >= 3 ? cells[1] : null;
        var cellDescription = cells.length >= 3 ? cells[2] : cells[1];
        htmlSource = htmlSource.replace(row,
          '<dt>' + cellName +
          (cellType != null ? '<span class="property-type">' + cellType +'</span>' : '') +
          '<dd>' + cellDescription + '</dd>'
        );
      });

      // get all images and transform them into base64 (GitHub will deny images in iframe)
      var images = collectImages(htmlSource);

      fetchImagesBase64(images)
        .then(
          function(images64) {

            // now replace all fetched images in base64
            _(images64).each(function(image) {
              htmlSource = htmlSource.replace(image.html, '<img src="' + image.base64 + '">');
            });

            // replace "$" or will mess up with the regular expression
            htmlSource = htmlSource.replace(/\$/g, '&#36;');

            // replace inline documentation
            var newDoc = '<script type="text\/x-red" data-help-name="' + nodeName + '">' + htmlSource + '</script>';
            var regexp = new RegExp('<script type=\"text\/x-red\" data-help-name=\"' + nodeName + '\">[\\s\\S]*?<\/script>', 'g');
            nodeSource = nodeSource.replace(regexp, newDoc);

            fs.writeFileSync(__dirname + '/../nodes/' + nodeFile, nodeSource, 'utf8');
            // finally resolve
            resolve();
          },
          function(error) {
            reject(error);
          }
        );
    });
  });

});


tasks.then(
  function() {
    console.log('Writing changelog ' + grey(__dirname + '/../CHANGELOG.md'));
    var changelog = fs.readFileSync(__dirname + '/../wiki/Changelog.md', 'utf8');
    fs.writeFileSync(__dirname + '/../CHANGELOG.md', changelog, 'utf8');
    console.log(green('All done.'));
  },
  function() {
    clc.red('Something went wrong');
  }
);




