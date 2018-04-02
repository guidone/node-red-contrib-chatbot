* **0.10.0** - [[Global Configuration|Global-Configuration]]
* **0.9.29** - Fixed a bug where unused chatbots where launched even if not used (causing some polling error in Telegram)
* **0.9.28** - Deprecated `Transport node` in favour of `Rules node`, fixed blank context dropdown, Facebook upload doesn't use temporary file anymore, fixed Dialogflow.com/Recast.ai second output
* **0.9.27** - ...and another deprecation in Telegram lib
* **0.9.26** - Update Telegram api library
* **0.9.25** - Deprecated `Switch Node`, added message type rules to `Rules node`, relaxed some verification checks with Facebook Messenger, fixed small bugs with Dialogflow and Recast  
* **0.9.24** - Fixed button labels for `Request node`
* **0.9.23** - Added nodes for Recast.ai and Dialogflow.com, improved debugging in system console
* **0.9.22** - Now `Node keyboard` can remove a previously sent keyboard
* **0.9.21** - **[breaking changes]** Refactored `Node keyboard`, aligned the payload to other buttons ([[see here|Keyboard-node]])
* **0.9.20** - Fixed `Log node` payload, fixed second pin output of `Rivescript node`
* **0.9.19** - Added rule 'environment' to `Rules node`
* **0.9.18** - Added rule 'any command' to `Rules node`
* **0.9.17** - Support for Node-RED projects. Telegram, Slack and Facebook nodes have multiple configuration for production and development, now the same flow runs in different environments. Deprecated `API.ai node`
* **0.9.15** - Added `Rules node`, fixed messages being broadcasted multiple times, fixed `Conversation node` for Facebook
* **0.9.14** - Fixed startup error on Facebook Messenger 
* **0.9.13** - Fixed dropdown "parse mode" for Telegram
* **0.9.12** - New context engine available for Facebook Messenger 
* **0.9.11** - Fix context provider drop down in hosted environments 
* **0.9.10** - If no context provider is specified, defaults to "memory". Fix error 409 with Telegram
* **0.9.9** - Fix blocking bug with memory context provider and Telegram or Slack
* **0.9.8** - Added support for client dialogs in Slack with `Dialog node`
* **0.9.7** - `Generic template node` works also in Slack, fixed empty payload in `Conversation node`
* **0.9.6** - Fix firstName, lastName, authorized in Telegram
* **0.9.5** - New context engine available for Telegram, added support for inline queries in Telegram, added `Switch node`
* **0.9.4** - Fixed bug with `Message node` + `Conversation node`, update libraries 
* **0.9.3** - Added support to buttons for Slack 
* **0.9.2** - Fixed regression and reverted **0.9.1** 
* **0.9.1** - Slack: listen messages from other bots 
* **0.9.0** - Added support for Slack, added persistent chat storage (json file), open architecture to implement third party chat context provider 
* **0.8.7** - Bug fixing
* **0.8.6** - Moved *parse mode* parameter to `Message node` to `Telegram Sender node`. Parsing is now also available in `Inline Buttons node` and `Keyboard node`
* **0.8.5** - Added `Listen Lexicon node` for `Listen node`
* **0.8.4** - Added CHANGELOG.md
* **0.8.3** - Added `Sticker node` for Telegram
* **0.8.2** - Fixed API.ai node
* **0.8.1** - Added delete and disable input box in `Messenger menu node`
* **0.8.0** - [[[breaking changes]|Breaking-Changes-0.8.0]] completely redesigned `Button node`, `Messenger Menu node` configuration, support for url, postback, login, logout, call button, added support for Generic Template (with carousel), Inline Template in Facebook and Quick Replies, deprecated `Account Link node`, improved documentation and parameters passed with `msg.payload`
* **0.7.5** - Fix inbound audio files in Facebook Messenger
* **0.7.4** - Rivescript node and Listen node no longer tries to parse command-like messages, Rivescript editor now resizes correctly, debug flag in Rivescript node
* **0.7.3** - Video node for Telegram and Facebook
* **0.7.2** - Fix upload image and audio in Telegram
* **0.7.1** - Fixed deprecated params in telegram-bot-api
* **0.7.0** - Added Analytics node (Dashbot.io)
* **0.6.25** - Edit message in Telegram
* **0.6.24** - Fix document node filename in upstream payload
* **0.6.23** - Added document node for Telegram and Facebook, minor bug fix 
* **0.6.22** - Added node for Facebook external account linking
* **0.6.21** - Added node for Facebook Messenger persistent menu
* **0.6.20** - Fixed breaking error in Messenger, improved docs, parse node now parses numbers written in plain english
* **0.6.19** - **[breaking changes]** Improved Listen node, better NLP and variables extraction. Previous special tokens like *{email}*, *{url}* are no longer valid
* **0.6.18** - Fix catch all node with Telegram, parse integer number, improved debug node
* **0.6.17** - Fix bug on node message (multiple content)
* **0.6.16** - Added multiple content versions for the message node (random pick)
* **0.6.15** - Fixed incorrect "from" information answering inline buttons in Telegram
* **0.6.14** - Fixed use of {{payload}} in message template
* **0.6.13** - **[breaking changes]** The previous "Buttons" node was renamed in "Keyboards", this feature is only available in Telegram. The previous "Inline Buttons" node was renamed "Buttons" and enabled for Telegram, Facebook and Smooch (with some additional options like value, label, urls)
* **0.6.12** - Fix bug with Slack receive node (node still needs huge refactoring)
* **0.6.11** - Fix error with the second output of the Rivescript node
* **0.6.10** - Conversation node now accepts parameters also from the upstream node
* **0.6.9** - Fixed RiveScript node (parser reloaded after deploy, better handling of syntax errors, status message), updated Telegram inline buttons (URL button, multi line buttons), minor bugs
* **0.6.8** - Fixed bug missing .chat() in conversation node
* **0.6.7** -  Fixed bug with missing global context
* **0.6.5** - Added topic node, fixed command node in multi chat, added Api.ai node, minor fixes
* **0.6.4** - Added chat context node, refactored transport node
* **0.6.3** - Cleanup
* **0.6.2** - Added support for Smooch.io
* **0.5.14** - **[breaking changes]** moved Facebook endpoint to the same address/port of Node-Red: http://localhost:1880/redbot/facebook (this allows to use it on Heroku for example)
* **0.5.13** - added language node
* **0.5.11** - cache Rivescript and enable follow up
* **0.5.10** - In conversation node it's possible to select the transport
* **0.5.9** - **[breaking changes]** chat context is now stored in global and available in sub flows, parse node now stores parsed data in chat context, fixed a side effect in Rivescript
* **0.5.7** - Sender nodes now can log to file
* **0.5.6** - Telegram polling interval
- **0.5.4** - Fixed exception on restarting flows. Added quad code node
* **0.5.3** - Added RiveScript node
* **0.5.2** - Added markdown and html formatting to Telegram message node
- **0.5.1** - **[breaking changes]**: moved the tracking option to the sender node, this will break previous flows where the tracking output was in the message node. If errors on saving the flow occurs after the upgrade, export the whole flow and import it again. Added debug node.