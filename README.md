# node-red-contrib-chatbot
Build a full featured chat bot with Node Red and Telegram

/under construction/

## Available nodes
* **Message**: sends a text message from the chat bot, supports templating (variable like `{{firstName}}`, etc), tracking of response and quoting a previous comment
* **Waiting**: sets the waiting status on the chat client (something like _your_chatbot is typing_ )
* **Command**: listen to a command type message (for example `/command1`, `/my-command`, etc)
* **Image**: takes the `msg.payload` binary and sends out as image to the chat (for example connected to a http node or file node), can track response
* **Request**: request special information from the chat client like the current location or the phone numbers (Telegram).
* **Ask**: request information to the chat user using buttons using a predefined list (Telegram)
* **Parse**: Parse the incoming message searching for some type of data (string, number, date, location, contact, etc)
* **Log**: Convert a chat message (inbound or outbound) to a single line string suitable to be sent to a log file
* **Location**: Send a location type message that will be shown with a map by the chat client (Telegram)
* **Listen**:
* **Analyze**:

## Tracking answers
tbd

## Examples
Here are some examples connecting the ChatBot blocks

### Collect Email
![Example Collect Email](./docs/images/example-collect-email.png)
This is an example of how to parse the user input. The first **Email** block after the receiver just show a prompt message, note that this block tracks the user answer, that means that next message from the user will start from here and will be re-routed to the second output to the **Parse Email** block.

If a valid email is found then the parsed value will be routed to the first output otherwise the second. The parsed email is available as payload or can be stored in the flow context,  for example in the `email` variable.

The **Show Email** is just a simple message block that uses templating to show variables store in flow context (or global): `Your email is {{email}}`
### Log Chats
tbd
### Send Email
tbd
### Send a Location
tbd
### Buttons
tbd


## Credits
tbd

## License
tbd
