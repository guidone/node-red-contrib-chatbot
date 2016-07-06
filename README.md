# node-red-contrib-chatbot
Build a full featured chat bot with Node Red and Telegram

/under construction/

## Available nodes
* *Message*: sends a text message from the chat bot, supports templating (variable like /{{firstName}}/, etc), tracking of response and quoting a previous comment
* *Waiting*: sets the waiting status on the chat client (something like _your_chatbot is typing_ )
* *Command*: listen to a command type message (for example `/command1`, `/my-command`, etc)
* *Image*: takes the `msg.payload` binary and sends out as image to the chat (for example connected to a http node or file node), can track response
* *Request*: request special information from the chat client like the current location or the phone numbers (Telegram).
* *Ask*: request information to the chat user using buttons using a predefined list (Telegram)
* *Parse*: Parse the incoming message searching for some type of data (string, number, date, location, contact, etc)
* *Log*: Convert a chat message (inbound or outbound) to a single line string suitable to be sent to a log file
* *Location*: Send a location type message that will be shown with a map by the chat client (Telegram)
* *Listen*:
* *Analyze*:

## Tracking answers
tbd

## Credits
tbd

## License
tbd
