1: 
2: <p align="center">
3:   <img src="https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/logo/redbot-logo.svg">
4:   <br/>
5:   :heavy_exclamation_mark: <strong>New!</strong> RedBot 2.0 is out, see the <a href="CHANGELOG.md">changelog</a>
6:   <br />
7: </p>
8: <p align="center">
9:   <a href="https://www.npmjs.com/package/node-red-contrib-chatbot"><img src="https://img.shields.io/npm/v/node-red-contrib-chatbot.svg" alt="Release"></a>
10:   <a href="https://www.npmjs.com/package/node-red-contrib-chatbot"><img src="https://img.shields.io/npm/dm/node-red-contrib-chatbot.svg" alt="Downloads"></a>
11:   <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
12:   <a href="https://github.com/guidone/node-red-contrib-chatbot/issues"><img src="https://img.shields.io/github/issues/guidone/node-red-contrib-chatbot" alt="Issues"></a>
13: </p>
14: <br />
15: 
16: With **RedBot** you can visually build a full featured chat bot for **Telegram**, **Facebook Messenger**, **WhatsApp**, **Viber** and **Slack** with Node-RED. ~~Almost~~ no coding skills required.
17: 
18: > Node-RED is a tool for wiring together hardware devices, APIs and online services in new and interesting ways.
19: 
20: Maintaining **RedBot** is very time-consuming, if you like it, please consider:
21: 
22: <a target="blank" href="https://www.paypal.me/guidone"><img src="https://img.shields.io/badge/Donate-PayPal-blue.svg"/></a>
23: 
24: ![RedBot](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/node-red-screenshot.png)
25: 
26: ## Documentation
27: 
28: 1. [RedBot documentation](https://redbot.notion.site/RedBot-Documentation-1de27db692114f4db163f10e1586dc71)
29: 2. [Nodes index](docs/nodes.md)
30: 3. [Examples](https://www.notion.so/redbot/Examples-5c2c1d6bd49641499c97b65d9f46d4ba)
31: 4. [Advanced examples](https://www.notion.so/redbot/Advanced-Topics-18a43568eaf14ee4a442ea4cf2f44068)
32: 5. [Chat context](https://www.notion.so/redbot/Chat-Context-3460c588cf234344974936acd05f8c16)
33: 6. [Changelog](CHANGELOG.md)
34: 
35: ## Getting started
36: 
37: RedBot requires **Node.js >= 18** and **Node-RED >= 2.0**.
38: 
39: First of all install [Node-RED](http://nodered.org/docs/getting-started/installation)
40: 
41: ```bash
42: sudo npm install -g node-red
43: ```
44: 
45: Then open the user data directory `~/.node-red` and install the package
46: 
47: ```bash
48: cd ~/.node-red
49: npm install node-red-contrib-chatbot
50: ```
51: 
52: Then run
53: 
54: ```bash
55: node-red
56: ```
57: 
58: The next step is to create a chat bot, I recommend to use **Telegram** since the setup is easier (**Telegram** allows polling to receive messages, so it's not necessary to create a https certificate).
59: Use **@BotFather** to create a chat bot, [follow instructions here](https://core.telegram.org/bots#botfather) then copy your access **token**.
60: 
61: Then open your **Node-RED** and add a `Telegram Receiver`, in the configuration panel, add a new bot and paste the **token**
62: 
63: ![Telegram Receiver](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-telegram-receiver.png)
64: 
65: Now add a `Message` node and connect it to the `Telegram Receiver`
66: 
67: ![Simple Message](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-simple-message.png)
68: 
69: Finally add a `Telegram Sender` node, don't forget to select in the configuration panel the same bot of the `Telegram Receiver`, this should be the final layout
70: 
71: ![Example Simple](https://github.com/guidone/node-red-contrib-chatbot/raw/master/docs/images/example-simple.png)
72: 
73: Now you have a useful bot that answers *"Hi there!"* to any received message. We can do a lot better.
74: 
75: ## Credits
76: * Inspired by the Karl-Heinz Wind work [node-red-contrib-telegram](https://github.com/windkh/node-red-contrib-telegrambot)
77: * [Telegram Bot API for NodeJS](https://github.com/yagop/node-telegram-bot-api)
78: 
79: ## The MIT License
80: 
81: Copyright (c) 2026 Guidone
82: 
83: Permission is hereby granted, free of charge, to any person obtaining a copy
84: of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
85: 
86: The above copyright notice and this permission notice shall be included in
87: all copies or substantial portions of the Software.
88: 
89: THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
90: AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
91: 
92: Coded with :heart: in :it:
