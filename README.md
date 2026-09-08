
<p align="center">
  <img src="https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/logo/redbot-logo.svg">
  <br/>
  :heavy_exclamation_mark: <strong>New!</strong> RedBot 2.0 is out, see the <a href="CHANGELOG.md">changelog</a>
  <br />
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/node-red-contrib-chatbot"><img src="https://img.shields.io/npm/v/node-red-contrib-chatbot.svg" alt="Release"></a>
  <a href="https://www.npmjs.com/package/node-red-contrib-chatbot"><img src="https://img.shields.io/npm/dm/node-red-contrib-chatbot.svg" alt="Downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/guidone/node-red-contrib-chatbot/issues"><img src="https://img.shields.io/github/issues/guidone/node-red-contrib-chatbot" alt="Issues"></a>
</p>
<br />

With **RedBot** you can visually build a full featured chat bot for **Telegram**, **Facebook Messenger**, **WhatsApp**, **Viber** and **Slack** with Node-RED. ~~Almost~~ no coding skills required.

> Node-RED is a tool for wiring together hardware devices, APIs and online services in new and interesting ways.

Maintaining **RedBot** is very time-consuming, if you like it, please consider:

<a target="blank" href="https://www.paypal.me/guidone"><img src="https://img.shields.io/badge/Donate-PayPal-blue.svg"/></a>

![RedBot](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/node-red-screenshot.png)

## Documentation

1. [RedBot documentation](https://redbot.notion.site/RedBot-Documentation-1de27db692114f4db163f10e1586dc71)
2. [Nodes index](docs/nodes.md)
3. [Examples](https://www.notion.so/redbot/Examples-5c2c1d6bd49641499c97b65d9f46d4ba)
4. [Advanced examples](https://www.notion.so/redbot/Advanced-Topics-18a43568eaf14ee4a442ea4cf2f44068)
5. [Chat context](https://www.notion.so/redbot/Chat-Context-3460c588cf234344974936acd05f8c16)
6. [Changelog](CHANGELOG.md)

## Getting started

RedBot requires **Node.js >= 18** and **Node-RED >= 2.0**.

First of all install [Node-RED](http://nodered.org/docs/getting-started/installation)

```bash
sudo npm install -g node-red
```

Then open the user data directory `~/.node-red` and install the package

```bash
cd ~/.node-red
npm install node-red-contrib-chatbot
```

Then run

```bash
node-red
```

The next step is to create a chat bot, I recommend to use **Telegram** since the setup is easier (**Telegram** allows polling to receive messages, so it's not necessary to create a https certificate).
Use **@BotFather** to create a chat bot, [follow instructions here](https://core.telegram.org/bots#botfather) then copy your access **token**.

Then open your **Node-RED** and add a `Telegram Receiver`, in the configuration panel, add a new bot and paste the **token**

![Telegram Receiver](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-telegram-receiver.png)

Now add a `Message` node and connect it to the `Telegram Receiver`

![Simple Message](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-simple-message.png)

Finally add a `Telegram Sender` node, don't forget to select in the configuration panel the same bot of the `Telegram Receiver`, this should be the final layout

![Example Simple](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-simple.png)

Now you have a useful bot that answers *"Hi there!"* to any received message. We can do a lot better.

## Credits
* Inspired by the Karl-Heinz Wind work [node-red-contrib-telegram](https://github.com/windkh/node-red-contrib-telegrambot)
* [Telegram Bot API for NodeJS](https://github.com/yagop/node-telegram-bot-api)

## The MIT License

Copyright (c) 2026 Guidone

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Coded with :heart: in :it:
