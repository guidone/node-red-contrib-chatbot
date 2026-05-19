
Used to send a message to OpenAI's [Responses API](https://platform.openai.com/docs/api-reference/responses/create) and receive a generated answer back into the flow. The node also supports **function calling**, **conversation state** and **image / file attachments**.

The text sent to ChatGPT is taken from the upstream `Message` payload (`msg.payload.content`), the response is forwarded out of the first pin and can be sent back to the user as a regular `Message`.

The prompt design (model, instructions, tools, variables, …) is **not** configured field by field in the editor: instead the JSON exported from the [Prompts Playground](https://platform.openai.com/playground/prompts?models=gpt-4.1) is pasted in the `Prompt` text area. Any change made in the Playground (a new tool, a different model, a longer instruction) is therefore propagated by simply copying and pasting the updated JSON.

The example flow `ChatGPT example.json` ships a working setup with one function tool (`get_temperature`), a Telegram receiver / sender pair and a typing indicator.

## Using ChatGPT tools

ChatGPT Responses dynamically grows its output pins based on the `tools` array declared in the `Prompt` JSON: one pin per `function` tool is created, plus the standard _response_ pin (first) and _error_ pin (last).

![](./docs/assets/36bb8f5f5b7ad6e8.png)

In the screenshot above:

- the **Telegram Receiver** forwards the incoming message both to the `ChatGPT Responses` node and to a `Waiting…` message that gives the user immediate feedback while the model is thinking

- the `ChatGPT Responses` node exposes three pins because the prompt declares one function tool named `get_temperature`:

	- **pin 1 — ChatGPT response**: emits the text answer produced by the model, routed to a `Message` / `Params` / `Telegram Sender` chain

	- **pin 2 — Function call** **`get_temperature`**: fires whenever the model decides to call the `get_temperature` tool. The downstream `Get temperature` function node resolves the value (for example by calling an external weather API) and **loops the result back into the input of** **`ChatGPT Responses`** so the model can produce the final natural-language answer

	- **pin 3 — ChatGPT error**: emits the error returned by the OpenAI API (rate limits, invalid prompt, network errors, …)

To answer a function call, the downstream node must:

1. compute the result and place it on `msg.payload` (any JSON-serializable value)

2. **leave** **`msg['chatgpt-function-call']`** **untouched** — it carries the `call_id` and `previous_response_id` the node needs to resume the conversation with the model

3. wire its output back into the **input** of the same `ChatGPT Responses` node

For example, the `Get temperature` function node reads the city argument provided by the model and writes the temperature back:

```javascript
// msg.payload contains the arguments parsed from the model, e.g. { city: 'Milan' }
const city = msg.payload.city;

msg.payload = { city, temperature: 21, unit: 'C' };
return msg;
```

The same pattern scales to any number of tools: declare them in the prompt JSON, wire one branch per tool and loop each branch back to the `ChatGPT Responses` input.

## Conversation state

ChatGPT Responses keeps the conversation alive across messages by storing the `response.id` of the latest OpenAI call into the flow context, scoped by `chatId`. The next call automatically reuses it as `previous_response_id`, so the model sees the full history without the chatbot having to resend it.

If the upstream message does not carry a `chatId` (for example a broadcast or a manual `Inject`), the node will log a warning and the conversation will be stateless.

To inject extra context at runtime (without changing the saved prompt) use `msg.context`:

```javascript
msg.context = {
  system: 'The user is a premium customer',
  assistant: ['Previously the user asked about shipping costs'],
  user: 'My order number is #12345'
};
return msg;
```

Each key accepts a single string or an array of strings. The strings are appended to the `input` array of the OpenAI request as additional turns.

---

## Prompt variables

If the prompt declares variables (using the `{{variable}}` syntax in the Playground), they can be filled at runtime from `msg.variables`:

```javascript
msg.variables = {
  firstName: 'John',
  productName: 'REDBot'
};
return msg;
```

The values are merged into the `prompt.variables` field of the OpenAI request, overriding any value stored in the saved prompt.

## Attachments

When `msg.attachments` is set (typically by an upstream `Image` or `Document` receiver), each attachment is uploaded to OpenAI via the [Files API](https://platform.openai.com/docs/api-reference/files/create) with `purpose: 'assistants'` and then attached to the user turn as `input_image`. This enables vision use-cases (let the user send a photo and ask ChatGPT to describe it).

`msg.attachments` can be a single attachment or an array; each item must expose `.content` (Buffer) and `.filename`.

## Configuration

| Name       | Type        | Description                                                                                                                                                                                      |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OpenAI key | config node | API key created on the [OpenAI dashboard](https://platform.openai.com/api-keys). Stored as a `chatbot-open-ai-key` credential and reusable across nodes                                          |
| Name       | string      | Optional label shown in the editor                                                                                                                                                               |
| Prompt     | JSON        | JSON exported from the [Prompts Playground](https://platform.openai.com/playground/prompts?models=gpt-4.1). Contains model, instructions, tools, variables and any other Responses API parameter |

## Input

Available parameters for `msg`:

| Name                    | Type                         | Description                                                                                                |
| ----------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `payload.content`       | string                       | Text message to send to the model. Usually populated by the platform receiver node                         |
| `attachments`           | object / array               | Optional file or image attachments. Each item must have `content` (Buffer) and `filename`                  |
| `context.system`        | string / array of \[string\] | Additional `system`-flavoured turns injected before the user message                                       |
| `context.assistant`     | string / array of \[string\] | Additional `assistant`-flavoured turns injected before the user message                                    |
| `context.user`          | string / array of \[string\] | Additional `user`-flavoured turns injected before the user message                                         |
| `variables`             | object                       | Values for the variables declared in the saved prompt. Merged into `prompt.variables`                      |
| `chatgpt-function-call` | object                       | Set by the node itself on the tool pins. Must be left untouched when looping the response back to the node |

## Output

The node exposes a dynamic number of output pins, calculated from the `tools` declared in the prompt JSON:

| Pin   | Name                 | Description                                                                                                                                                                        |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | ChatGPT response     | Text answer produced by the model. `msg.payload = { message: '…' }` — ready to be fed into a `Message` node                                                                        |
| 2 … N | Function call _name_ | One pin per `function` tool. `msg.payload` holds the parsed arguments produced by the model. `msg['chatgpt-function-call']` carries the metadata needed to resume the conversation |
| Last  | ChatGPT error        | Emitted only when the OpenAI API returns an error. `msg.payload` holds the original error object                                                                                   |

If the model produces both a text answer and one or more function calls in the same turn, all the relevant pins fire in parallel.

## Example

The `ChatGPT example.json` flow shipped with REDBot wires a minimal Telegram chatbot with one function tool:

4. import the flow from the _Examples_ menu of Node-RED

5. open the `OpenAI key` config node and paste a valid API key

6. open the `Telegram Receiver` / `Telegram Sender` nodes and connect them to a Telegram bot token

7. deploy and chat with the bot — asking for example _"What is the temperature in Milan?"_ will trigger the `get_temperature` tool, the result is fed back to the model and the final natural-language answer is sent to the user
