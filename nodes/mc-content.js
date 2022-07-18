const _ = require('lodash');
const gql = require('graphql-tag');

const Client = require('../database/client');
const MessageTemplate = require('../lib/message-template-async');
const LIMIT = 100;

const {
  isValidMessage,
  extractValue,
  when,
  getChatbotId
} = require('../lib/helpers/utils');
const {
  variable: isVariable
} = require('../lib/helpers/validators');

const CONTENT = gql`
query(
  $id: Int,
  $slug: String,
  $ids: [Int],
  $slugs: [String],
  $chatbotId: String
) {
  contents(
    id: $id,
    slug: $slug,
    ids: $ids,
    slugs: $slugs,
    chatbotId:
    $chatbotId
  ) {
    id,
    title,
    slug,
    language,
    body,
    categoryId,
    payload,
    json,
    category {
      id,
      name
    }
  }
}`;

const findContent = (contents, { language, contextLanguage, failbackLanguage }) => {
  let content;
  // if not using id but the slug, then apply language logic, try to find the right one
  // matching the chat context language or the one defined in the configuration or the
  // failback language
  if (_.isEmpty(language) && !_.isEmpty(contextLanguage)) {
    content = contents.find(content => content.language === contextLanguage);
  } else if (!_.isEmpty(language)) {
    content = contents.find(content => content.language === language);
  }
  if (content == null && !_.isEmpty(failbackLanguage)) {
    content = contents.find(content => content.language === failbackLanguage);
  }
  return content;
}


module.exports = function(RED) {
  const client = Client(RED);

  function MissionControlContent(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.query = config.query;
    this.language = config.language;
    this.failbackLanguage = config.failbackLanguage;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      const chatbotId = getChatbotId(msg);
      const chat = msg.chat();
      const template = MessageTemplate(msg, node);

      let query = extractValue(['string', 'number', 'array'], 'query', node, msg, false, true);
      const language = extractValue('string', 'language', node, msg, false, true);
      const failbackLanguage = extractValue('string', 'failbackLanguage', node, msg, false, true);

      // if query (from the UI) is comma separated, then convert to array, trim it and try to convert
      if (isVariable(query)) {
        query = await template.evaluate(query);
      }
      // skip to second pin if empty
      if (query == null || query === '') {
        send([null, msg]);
        return;
      }
      if (_.isString(query) && query.includes(',')) {
        query = query
          .split(',')
          .map(item => item.trim())
          .map(item => !isNaN(parseInt(item, 10)) ? parseInt(item, 10) : item);
      }

      // build query variables
      let variables;
      let usingId = false;
      let usingIds = false;
      let usingSlugs = false;
      let usingSlug = false;
      let slugs, ids;
      if (_.isArray(query) && query.every(item => _.isString(item))) {
        slugs = query;
        variables = { slugs };
        usingSlugs = true;
      } else if (_.isArray(query) && query.every(item => _.isNumber(item))) {
        ids = query;
        variables = { ids };
        usingIds = true;
      } else if (!isNaN(parseInt(query, 10))) {
        variables = { id: parseInt(query, 10) };
        usingId = true;
      } else if (_.isNumber(query)) {
        variables = { id: query };
        usingId = true;
      } else if (_.isString(query) && !_.isEmpty(query)) {
        variables = { slug: query, limit: LIMIT };
        usingSlug = true;
      } else {
        done('Invalid or empty slug/id, unable to retrieve content with this query: ' + (query != null ? query.toString() : 'null'));
        return;
      }
      variables.chatbotId = chatbotId;
      // get user's language from context
      const contextLanguage = await when(chat.get('language'));

      try {
        const response = await client.query({ query: CONTENT, variables, fetchPolicy: 'network-only' });
        const { contents } = response.data;

        let content;
        if (usingIds) {
          // sort the same order of ids
          content = _.compact(ids.map(id => contents.find(content => content.id === id)));
        } else if (usingSlugs) {
          // take all articles with the same slug, in the same order the slugs were provided and pass thru
          // the language chooser function
          const filteredContents = slugs.map(slug => findContent(
            contents.filter(content => content.slug === slug),
            { language, contextLanguage, failbackLanguage }
          ));
          content = _.compact(filteredContents);
        } else if (usingSlug) {
          content = contents.find(content => content.language === language);
          if (content == null) {
            content = contents.find(content => content.language === failbackLanguage);
          }
        } else if (usingId) {
          // if using id, then just get the first
          content = !_.isEmpty(contents) ? contents[0] : null;
        } else {
          // from all content with the same slug, take the one with the right language
          content = findContent(contents, { language, contextLanguage, failbackLanguage });
        }

        // error if still empty
        if (content == null) {
          send([null, msg]);
          done(`Content not found for query: ${query}`);
          return;
        }
        const payload = await template(content);
        // store the result in the payload and save the previous content in "previous" key
        // to be used with the "Pop Message" node if needed, store also the result in data
        // in case the "Pop Message" node is used
        send([{
          ...msg,
          data: payload, // TODO remove this?
          payload,
          previous: msg.payload
        }, null]);

        done();
      } catch(error) {
        done(error);
      }
    });
  }

  RED.nodes.registerType('mc-content', MissionControlContent);
};
