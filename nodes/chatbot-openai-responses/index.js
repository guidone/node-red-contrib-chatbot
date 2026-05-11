const OpenAI = require('openai');

const { getChatId, isValidMessage, message: messageUtils } = require('../../lib/helpers/utils');
const tryParse = require('./helper/try-parse');
const isFunctionResponse = require('./helper/is-function-response');
const processOutputs = require('./helper/process-outputs');
const processError = require('./helper/process-error');
const updateTokens = require('./helper/update-tokens');
const GPTContext = require('./helper/gpt-context');
const formatContext = require('./helper/format-context');
const isAttachment = require('./helper/is-attachment');
const bufferToStream = require('./helper/buffer-to-stream');

// DOCS:
// UI element for dialog
// https://nodered.org/docs/creating-nodes/edit-dialog
//
// OpenAPI function calls
// https://platform.openai.com/docs/guides/function-calling?api-mode=responses&strict-mode=enabled#function-calling-steps
//
// OpenAPI responses API
// https://platform.openai.com/docs/api-reference/responses/create
//
// OpenAPI conversation state
// https://platform.openai.com/docs/guides/conversation-state?api-mode=responses
//
// OpenAPI upload file
// https://platform.openai.com/docs/api-reference/files/create

const buildEffectiveTools = (promptDesign, configuredFunctions) => {
  if (Array.isArray(promptDesign?.tools) && promptDesign.tools.length > 0) {
    return promptDesign.tools;
  }
  return (configuredFunctions ?? []).map(f => ({ type: 'function', name: f.name }));
};

module.exports = function(RED) {

  RED.httpAdmin.post(
    '/chatbot-openai-responses/probe',
    RED.auth.needsPermission('chatbot.write'),
    async (req, res) => {
      const { apiKeyNodeId, promptId, version } = req.body || {};
      if (!promptId) {
        return res.status(400).json({ error: 'missing prompt id' });
      }
      const creds = apiKeyNodeId ? RED.nodes.getCredentials(apiKeyNodeId) : null;
      if (!creds || !creds.apiKey) {
        return res.status(400).json({ error: 'missing or invalid OpenAI API key' });
      }
      try {
        const client = new OpenAI({ apiKey: creds.apiKey });
        const response = await client.responses.create({
          prompt: { id: promptId, ...(version ? { version: String(version) } : {}) },
          input: [{ role: 'user', content: 'ping' }],
          tool_choice: 'none',
          max_output_tokens: 16,
          store: false
        });
        const functions = (response.tools || [])
          .filter(t => t.type === 'function')
          .map(t => ({ name: t.name, description: t.description }));
        return res.json({ functions });
      } catch (e) {
        return res.status(500).json({ error: e.message || String(e) });
      }
    }
  );

  function ChatGPTResponses(config) {
    RED.nodes.createNode(this,config);
    const node = this;
    node.prompt = config.prompt;
    node.functions = Array.isArray(config.functions) ? config.functions : [];
    let openai;

    // Retrieve the config node
    this.openAIKey = RED.nodes.getNode(config.openAIKey);
    // Init openai
    if (this.openAIKey && this.openAIKey.credentials?.apiKey) {
      openai = new OpenAI({
        apiKey: this.openAIKey.credentials.apiKey
      });
    } else {
      node.error('Invalid or missing OpenAI API key');
      return;
    }

    node.on('input', async function(msg, send, done) {
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }

      const promptDesign = tryParse(node.prompt);
      if (!promptDesign) {
        node.error('Invalid prompt');
        return;
      }

      const effectiveTools = buildEffectiveTools(promptDesign, node.functions);

      const sessionId = getChatId(msg);
      const inputMessage = messageUtils.isMessage(msg) ? msg.payload.content : undefined;
      console.log('Resolved content: sessionId: ', sessionId, 'message: ', inputMessage);

      const context = GPTContext({ context: this.context().flow, sessionId });

      console.log('default sessionId', msg?.['chatgpt-function-call']?.sessionId);
      console.log('sessionId', sessionId);
      console.log('inputMessage', inputMessage);

      // Warn if empty session id
      if (!sessionId) {
        node.warn('Was not possible to extract a session id from msg payload, a session will not be created it will not be possible to follow up messages with ChatGPT');
      }

      const session = await context.getSession(sessionId);
      console.log('current session', session);

      // prepare the call to openAI
      let response;
      if (isFunctionResponse(msg)) {

        // HAMDLE MESSAGE RESPONSE
        console.log('answering to ', msg['chatgpt-function-call']);
        console.log('');

        const gptRequest = {
          ...promptDesign,
          input: [
            {
              type: 'function_call_output',
              call_id: msg['chatgpt-function-call'].call_id,
              output: msg.payload != null ? JSON.stringify(msg.payload) : ''
            }
          ],
          previous_response_id: msg['chatgpt-function-call'].previousId,
          // override store flag
          store: true,
          tool_choice: 'auto',
          parallel_tool_calls: false
        };

        // merge variables from msg.variables into stored prompt
        if (msg.variables != null && typeof msg.variables === 'object') {
          gptRequest.prompt = {
            ...(gptRequest.prompt || {}),
            variables: { ...(gptRequest.prompt?.variables || {}), ...msg.variables }
          };
        }

        // execute call
        try {
          response = await openai.responses.create(gptRequest);
        } catch(e) {
          send(processError(e, effectiveTools, msg, sessionId));
          done();
          return;
        }

      } else {

        const contextSystem = formatContext(msg.context?.system);
        const contextAssistant = formatContext(msg.context?.assistant);
        const contextUser = formatContext(msg.context?.user);

        const userPrompt = {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: inputMessage
            }
          ]
        };

        // upload attachments if any
        const attachments = Array.isArray(msg.attachments) ? msg.attachments : [msg.attachments];
        if (attachments.every(isAttachment)) {

          let idx;
          for(idx = 0; idx < attachments.length; idx++) {

            const stream = bufferToStream(attachments[idx].content);
            stream.path = attachments[idx].filename;

            try {
              const file = await openai.files.create({
                file: stream,
                purpose: 'assistants'
              });
              userPrompt.content.push({
                type: 'input_image',
                file_id: file.id
              });
            } catch (e) {
              console.error('Error uploading file:', e);
            }
          }
        }

        const gptRequest = {
          ...promptDesign,
          input: [
            ...(promptDesign.input ? promptDesign.input : []),
            ...contextSystem,
            ...contextAssistant,
            ...contextUser,
            userPrompt
          ],
          // override store flag
          store: true,
          tool_choice: 'auto',
          parallel_tool_calls: false
        };

        // set previous
        if (session) {
          gptRequest.previous_response_id = session.previousId;
        }

        // merge variables from msg.variables into stored prompt
        if (msg.variables != null && typeof msg.variables === 'object') {
          gptRequest.prompt = {
            ...(gptRequest.prompt || {}),
            variables: { ...(gptRequest.prompt?.variables || {}), ...msg.variables }
          };
        }

        console.log('Bare gptRequest', gptRequest);
        // execute call
        try {
          response = await openai.responses.create(gptRequest);
        } catch(e) {
          send(processError(e, effectiveTools, msg, sessionId));
          done();
          return;
        }
      }

      // update status
      updateTokens(node, response);

      // create or update current session
      if (!session) {
        // if no session identifier, do nothing
        if (sessionId) {
          await context.createSession({
            sessionId,
            previousId: response.id
          });
        }
      } else {
        // session exists, update it
        await context.updateSession(sessionId, { previousId: response.id });
      }

      send(processOutputs(response.output, effectiveTools, msg, response, sessionId));
      done();
    });
  }

  RED.nodes.registerType('chatbot-openai-responses', ChatGPTResponses);
};
