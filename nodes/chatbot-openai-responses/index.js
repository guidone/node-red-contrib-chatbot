const OpenAI = require('openai');

const { getChatId, message: messageUtils } = require('../../lib/helpers/utils');
const tryParse = require('./helper/try-parse');
const isFunctionResponse = require('./helper/is-function-response');
const processOutputs = require('./helper/process-outputs');
const processError = require('./helper/process-error');
const updateTokens = require('./helper/update-tokens');
const GPTContext = require('./helper/gpt-context');
const formatContext = require('./helper/format-context');
const isAttachment = require('./helper/is-attachment');
const bufferToStream = require('./helper/buffer-to-stream');

const DEFAULT_SESSION_ID = 'generic-session';

const resolveSessionId = msg => {
  try {
    const chatId = getChatId(msg);
    return chatId != null && chatId !== '' ? chatId : DEFAULT_SESSION_ID;
  } catch (e) {
    return DEFAULT_SESSION_ID;
  }
};

const resolveInputMessage = msg => {
  if (messageUtils.isMessage(msg)) {
    return msg.payload.content;
  }
  if (typeof msg?.payload === 'string') {
    return msg.payload;
  }
  return undefined;
};

// OpenAI's Responses API treats the top-level `prompt` field as a stored-prompt
// reference (`{ id, version, variables }`). Sending a partial `prompt` without
// `id` triggers "400 Missing required parameter: 'prompt.id'", especially on
// continuation requests (with `previous_response_id`). Drop partial references
// before dispatch.
const stripPartialPromptRef = gptRequest => {
  if (gptRequest.prompt && !gptRequest.prompt.id) {
    delete gptRequest.prompt;
  }
};

const mergeVariablesIntoStoredPrompt = (gptRequest, variables) => {
  if (variables == null || typeof variables !== 'object') return;
  if (!gptRequest.prompt?.id) return;
  gptRequest.prompt = {
    ...gptRequest.prompt,
    variables: { ...(gptRequest.prompt.variables || {}), ...variables }
  };
};

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
      const promptDesign = tryParse(node.prompt);
      if (!promptDesign) {
        node.error('Invalid prompt');
        return;
      }

      const effectiveTools = buildEffectiveTools(promptDesign, node.functions);

      const sessionId = resolveSessionId(msg);
      const inputMessage = resolveInputMessage(msg);

      const context = GPTContext({ context: this.context().flow, sessionId });

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

        mergeVariablesIntoStoredPrompt(gptRequest, msg.variables);
        stripPartialPromptRef(gptRequest);

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

        mergeVariablesIntoStoredPrompt(gptRequest, msg.variables);
        stripPartialPromptRef(gptRequest);

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
        await context.createSession({
          sessionId,
          previousId: response.id
        });
      } else {
        await context.updateSession(sessionId, { previousId: response.id });
      }

      send(processOutputs(response.output, effectiveTools, msg, response, sessionId));
      done();
    });
  }

  RED.nodes.registerType('chatbot-openai-responses', ChatGPTResponses);
};
