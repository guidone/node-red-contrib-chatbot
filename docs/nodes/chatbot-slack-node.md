
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

![Ngrok](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/b33faf56-5fdb-4bb5-892c-bb137a31c541/facebook-1-1.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667JGTWECW%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122953Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIFjLFzsni4r2lf6hGHTnCV43kL8gQu4oqSyU%2FNnqxM12AiEA8%2BA3gc6UMMSZYkUE%2FKRIBc9ADSewnTau3ETFGltsEHkq%2FwMILRAAGgw2Mzc0MjMxODM4MDUiDMzXgoD1gurmuuVQoCrcAwtDM2AKovjNRVItfSFnyhyvZk5Cf%2B5oE5wP7J4sbFcZ%2FBdjWvQfcSRS2rNQTdK5ZdnK5BuiO8%2Bbzu%2Bdm%2BOlFB8zhkbblPrMqd8AFG814DjTbBQFAicTdDq9iqeBg1g0LQrzuY7jGxN7BzL2%2F7sIw6yPFo6joG5aIHjXvtVr3G4smBBmTM2L%2F%2BEdOl%2BOZ2R1%2FWxkKKJv9Yy%2FPudMptp38hOURVb4MenU9z9PBWShjSTDqzYifNYUqBmI6MSSdoB1pXCXhEcyuUNXJmrXr8YSMoH%2BOtGWcw6jOLqNa0KkUpF1qRspk4GbUqgDrSK6CtHZVzBQxFtSetL2CKD3CPM8POFcDyzcoBLgjwB1w5SA%2F04%2Fmh4Us%2BI6j8stkPhQ0K7tjvXhkdZbZ2gPDUqitMPHNII1QHylJbRfS9Hdv%2BacXRmYDuWK6BYA6erMXwYKJIiIsVvhqlbiVQqhf3%2F35tQssKpm%2B5eIuGaVJgqqaXKLwt5v0UBtwnp%2B2Os0jkwyHKz%2FQtStsE1C1Xkv5YbO%2FSzrbnwmYc%2FSGUL5q5u5feaV%2BJLHCiMjrwoHGyZJtYQia1INIXRccKWHc6OrRQi3IjWK%2FNp21tzU3vEoutsQlwbQQN%2BmHf2s8ObDjLPROpleMLGdjNAGOqUBXgqU9ui%2B4dzXnECgMwW8RFwvbhd%2FKV7tlvrK3F3XdTez3sD4KcpUw3MzY7pDhEbv%2FdMZSmQaii5qePs47Zji%2F0VR0d9m0uzwEac80TWkrJzIc%2FjhxdeirkW%2F0RNsm%2FkKTLEGFmJJeCspz5%2FpNzil2xoiJ7UEEc2aHTKpwjAzJfskIlN62NFZ85dw3gFaaDJpO0DbX5Ail8CUH64mxCX8iVZNah6k&X-Amz-Signature=58f98a50dfdf34a6b32f4f5380b936b920a95a95ac95e266c70528fd9ebaa48a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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
