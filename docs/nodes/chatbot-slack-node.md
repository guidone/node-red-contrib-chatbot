
There are two way of connecting to Slack: with WebSockets or with web hooks. The first one is recommended since it doesn’t require any use of reverse proxies like **ngrok.**

## With WebSocket

1. Go to your [Slack apps dashboard](https://api.slack.com/) and click on _Create New App_

2. Select _From app manifest_ and paste this code

```yaml
display_information:
  name: MySlackApp
features:
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: false
  bot_user:
    display_name: MySlackApp
    always_online: true
oauth_config:
  scopes:
    bot:
      - channels:history
      - channels:join
      - chat:write
      - chat:write.customize
      - commands
      - im:history
      - users:write
      - files:read
      - files:write
settings:
  event_subscriptions:
    bot_events:
      - message.channels
      - message.im
  interactivity:
    is_enabled: true
  org_deploy_enabled: false
  socket_mode_enabled: true
  token_rotation_enabled: false
```

then select the Workspace to install the app to, go through all steps and finally click on _Create_

3. Get the **Signing Secret** in section _Basic Information_ under _App Credentials_

4. Get the **Bot Token** in section _OAuth & Permissions_ under _OAuth Tokens for Your Workspace_: click in _Install To Workspace_ and get the generated _Bot User OAuth Token_

5. Check the _Socket Mode_

6. Get the **App-Level Token** in _Basic Information_ under _App-Level Tokens_: click on _Generate Token and Scopes_, pick any name for the token, add the scope _connections:write_ then click on ‘Generate’

## With Web Hooks

7. **Slack** API talks to **Red-Bot** via a https callback (a self signed certificate is not enough). We’ll use [ngrok](https://ngrok.com/) to create a https tunnel for our local **Node-RED** instance. Install it, then open a shell window and run

```plain text
ngrok http 3001
```

You should get something like

![Ngrok](./docs/assets/85244d7050d16048.png)

Grab the https address you get, something like _https://123123.ngrok.io_, this is the base url that points back to your **Node-RED** instance.

**Warning** _Slack API_ libraries are not compatible with the stack of middlewares used by **Node-RED**, for this reason the **Slack** web-hooks in **RedBot** run in a separate _Express_ server on a different port (the default one in 3001). Keep in mind that in production it’s needed to open the firewall in order to expose this port.

8. Go to your [Slack apps dashboard](https://api.slack.com/) and click on _Create New App_

9. Select _From app manifest_ and paste this code

```yaml
display_information:
  name: MySlack WebHook
features:
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: false
  bot_user:
    display_name: MySlack WebHook
    always_online: true
oauth_config:
  scopes:
    bot:
      - channels:history
      - channels:join
      - chat:write
      - commands
      - files:read
      - files:write
      - im:history
      - users:write
      - chat:write.customize
settings:
  event_subscriptions:
    request_url: https://123456.ngrok.io/slack/events
    bot_events:
      - message.channels
      - message.im
  interactivity:
    is_enabled: true
    request_url: https://123456.ngrok.io/slack/events
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

Replace the _123456.ngrok.io_ domain with the one got in _step 1_

10. Get the **Signing Secret** in section _Basic Information_ under _App Credentials_

11. Get the **Bot Token** in section _Oauth & Permissions_ under _OAuth Tokens for Your Workspace_: click in _Install To Workspace_ and get the generated _Bot User OAuth Token_

12. Un-check _Use WebSocket_

13. In order to support _Slack Commands_, use as _Request URL_ the same callback (i.e. https://123456.ngrok.io/slack/events, be sure to replace the url got in _step 1_)

`Slack Receiver` and `Slack Sender` have a double bot configuration for _development_ and _production_. By default is used the _development_ configuration. To use _production_ configuration, edit **Node-RED** settings file (_settings.js_) and set the _environment_ global variable to _“production”_. See [Deploying RedBot](https://www.notion.so/c0c2de46b48a4def837753c7e284b356)  for more details.

**RedBot** also supports **Slack** events, in the chatbot use the [Rules node](https://www.notion.so/4113636f565d4ff4af08bc61a644206b)  to control the flow based on incoming events (the payload of the event will be in `msg.payload`) and use the [Support table](https://www.notion.so/6cfd957b91f642b5894a76e2b15feb05)  to see the list of supported events.
