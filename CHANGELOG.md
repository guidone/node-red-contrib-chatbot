* **0.18.11** Enable MS Teams nodes 
* **0.18.10** Added nodes for NLP.js, deprecated `Listen node`, breaking changes for `Language node`, added _Is Language ..._ rule to `Rules node` 
* **0.18.9** Support for multiple webhook for Routee 
* **0.18.8** Fix refresh of access token in Routee 
* **0.18.7** Fixed Alexa nodes not properly working with the multi transport framework
* **0.18.6** Added test endpoint for Telegram webhook 
* **0.18.5** Support for Slack events 
* **0.18.4** Fix postback buttons in Telegram using webhooks, fix validation of quick replies in Messenger, fix params for modify message, fix set value in context node  
* **0.18.3** Fix sticker node in Telegram, fix Conversation node and chatId in payload
* **0.18.2** Fix again hassio
* **0.18.1** Fix hassio empty dropdown in conversation node
* **0.18.0** - Moved all platform-specific flags to [[Param node|Params-node]], improved compatibility UI. Some [[breaking changes|Breaking-changes-0.18.0]] in **Telegram** flags (silent messages and reply to)
* **0.17.10** - Added support for Microsoft Teams
* **0.17.9** - Move Discord platform to a separate package [node-red-contrib-chatbot-discord](https://github.com/guidone/node-red-contrib-chatbot-discord)
* **0.17.8** - Routee support, fixed reply to message in Telegram
* **0.17.6** - Improved Dialogflow, removed static configuration from Conversation node
* **0.17.5** - Added animation node, improved runtime validation of `Conversation node`
* **0.17.4** - Fix Voice node
* **0.17.3** - Added Slack Block Kit
* **0.17.2** - Fix conversation node chatId/userId switch 
* **0.17.1** - Fix global configuration 
* **0.17.0** - Multi transport support **[[(breaking changes)|Breaking-Changes-0.16.0]]** 
* **0.16.12** - Improved behaviour of output pin of Universal Connector 
* **0.16.11** - Upgraded to Rivescript 2.0, script can be an external file 
* **0.16.10** - Improved parsing of plain file context store 
* **0.16.9** - Improved console log with validation of Telegram invoice and error in file chat context 
* **0.16.8** - Addedd web hook support for **Telegram**
* **0.16.6** - Added OAuth token to Slack config (dowload private files) 
* **0.16.5** - Fix on **Twilio** connector to support **Whatsapp**
* **0.16.4** - Support for **Discord**
* **0.16.3** - Fixed un-needed token in Alexa 
* **0.16.2** - Added Slack extensions (username, icon_emoji) 
* **0.16.1** - Fixed "+" for Twilio numbers
* **0.16.0** - Alexa support, refactored [[intent message|Intent-message]], changed format of event message, message chaining. See [[all changes in 0.16.0|all-changes-in-0.16.0]]
* **0.15.13** - Support for Slack commands 
* **0.15.12** - Broadcast API support for Facebook Messenger 
* **0.15.11** - Upgrade Facebook API to 3.*, enable long messages (> 4096) for Telegram
* **0.15.10** - Enable small talk for Dialogflow.com
* **0.15.9** - Fix parsing of Dialogflow.com responses 
* **0.15.8** - DialogFlow node updated to API v2 
* **0.15.7** - Silent messages for Telegram
* **0.15.6** - Upgraded Slack lib, removed restriction of configuration name === bot name 
* **0.15.5** - Fix issue with send picture in Facebook
* **0.15.4** - Fixed some issues with the [[Extend node|Extend-node]], added support for platform with different names, added [[Support Table|Support-table]] node
* **0.15.3** - Fixed Facebook permission "locale"
* **0.15.2** - Better support of message types registration
* **0.15.1** - Support for _optin.ref_ in Facebook Messenger
* **0.15.0** - Twilio connector 
* **0.14.6** - Added `pending` variable to chat context (supported by `Dialogflow node` and `Recast.ai node`) 
* **0.14.5** - Removed unused fields from Facebook Profile that were causing permissions problem
* **0.14.4** - `Universal Receiver node` now receives thw whole message, not just the payload 
* **0.14.3** - Fixed bug with params resolving in `Message node`  
* **0.14.2** - Fix message for inline buttons in **Viber** 
* **0.14.0** - Added `Universal Connector node`
* **0.13.6** - Added support for nested menu in `Messenger Menu node` via `Function node`
* **0.13.5** - Some cleanup 
* **0.13.4** - Added [[Extend node|Extend-node]]
* **0.13.3** - Fixed a bug with _track_ option and plain file context, added pass through option to `Sender node` to make the outpin pin optional 
* **0.13.1** - All sender nodes have output pin enabled (w/o track option), in order to chain more messages and keep the order. Fixed parsing of numeric _chatId_ in `Conversation node`, fixed filename in `Document node` for **Telegram** 
* **0.13.0** - Viber support
* **0.12.8** - Improve url regular expression, detect mistaken buffer in `Image node` 
* **0.12.7** - Fixed upload image in Slack with missing _filename_ param
* **0.12.6** - Fix incorrect payload for `Message node`
* **0.12.5** - Added events **new-user**, **referral**, filter by event in `Rules node`, now `Dialogflow node` and `Recast node` can be connected directly to a `Message node` if they provide and `answer`
* **0.12.4** - Fix docs for `Keyboard Buttons node`
* **0.12.3** - Added support for Facebook _messaging_referrals_
* **0.12.2** - Added debug flag to all receivers
* **0.12.1** - Fixed send sticker in Telegram
* **0.12.0** - Added `Invoice node` and `Invoice Shipping node` for Telegram 
* **0.10.3** - Fixed concurrency in plain file context provider, improved error logging 
* **0.10.2** - Improved detect command and fixed error in Telegram postback
* **0.10.1** - Dialogflow and React can store the intent in any variable, `Rules node` can now check the value of a variable 
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