![RedBot](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/logo/RedBot_logo_small.png)

With **RedBot** you can visually build a full featured chat bot for **Telegram**, **Facebook Messenger** and **Slack** with Node-RED. ~~Almost~~ no coding skills required.

![Release](https://img.shields.io/npm/v/node-red-contrib-chatbot.svg)
![npm](https://img.shields.io/npm/dm/node-red-contrib-chatbot.svg)
![Build](https://travis-ci.org/guidone/node-red-contrib-chatbot.svg?branch=master)
[![Slack](https://img.shields.io/badge/Join-Slack%20group-orange.svg)](https://join.slack.com/t/red-bot/shared_invite/enQtMzEyMjM5NDUwNTAwLWZiMWU2OWIzYzBlOGRlZjcwNjFhODcxMTQzMDY4YzVmNjQ1NTdmOWQwOTNkNzk1OWYxYzRlZDgxMTUyMDZiMGQ)
[![Telegram](https://img.shields.io/badge/Join-Telegram%20channel-blue.svg)](https://t.me/redbotnode)

> Node-RED is a tool for wiring together hardware devices, APIs and online services in new and interesting ways.

Maintaining **RedBot** is very time-consuming, if you like it, please consider:

<a target="blank" href="https://www.paypal.me/guidone"><img src="https://img.shields.io/badge/Donate-PayPal-blue.svg"/></a>
<a target="blank" href="https://blockchain.info/payment_request?address=17tWsZgb8CsCVZ4ZWEqRz4ekz7KjUPVagz"><img src="https://img.shields.io/badge/Donate-Bitcoin-green.svg"/></a>

![RedBot](https://github.com/guidone/node-red-contrib-chatbot/blob/master/docs/images/node-red-screenshot.png)

## Documentation

1. [RedBot nodes](https://github.com/guidone/node-red-contrib-chatbot/wiki/RedBot-nodes)
2. [Examples](https://github.com/guidone/node-red-contrib-chatbot/wiki#examples)
3. [Advanced examples](https://github.com/guidone/node-red-contrib-chatbot/wiki#advanced-examples)
4. [Chat context](https://github.com/guidone/node-red-contrib-chatbot/wiki/Chat-Context)
5. [Changelog](https://github.com/guidone/node-red-contrib-chatbot/wiki/Changelog)

## Getting started

First of all install [Node-RED](http://nodered.org/docs/getting-started/installation)

```
$ sudo npm install -g node-red
```

Then open  the user data directory  `~/.node-red`  and install the package

```
$ cd ~/.node-red
$ npm install node-red-contrib-chatbot
```

Then run

```
node-red
```

The next step is to create a chat bot, I recommend to use **Telegram** since the setup is easier ( **Telegram** allows polling to receive messages, so it's not necessary to create a https certificate).
Use **@BotFather** to create a chat bot, [follow instructions here](https://core.telegram.org/bots#botfather) then copy you access **token**.

Then open your **Node-RED** and add a `Telegram Receiver`, in the configuration panel, add a new bot and paste the **token**

![Telegram Receiver](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-telegram-receiver.png)

Now add a  `Message`  node and connect to the  `Telegram Receiver`

![Simple Message](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-simple-message.png)

Finally add a `Telegram Sender` node, don't forget to select in the configuration panel the same bot of the `Telegram Receiver`, this should be the final layout

![Example Simple](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-simple.png)

Now you have a useful bot that answers *"Hi there!"* to any received message. We can do a lot better.


## Credits
* Inspired by the Karl-Heinz Wind work [node-red-contrib-telegram](https://github.com/windkh/node-red-contrib-telegrambot)
* [Telegram Bot API for NodeJS](https://github.com/yagop/node-telegram-bot-api)
* [NLP Compromise](https://github.com/nlp-compromise/compromise)

## The MIT License
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Coded with :heart: in :it:

