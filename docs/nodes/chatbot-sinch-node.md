
**Sinch Conversation API** talks to **RedBot** via an HTTPS callback (a self-signed certificate is not enough). We'll use [ngrok](https://ngrok.com/) to create an HTTPS tunnel for our local **Node-RED** instance. Install it, then open a shell window and run

```bash
ngrok http 127.0.0.1:1880
```

You should get an HTTPS address like [_https://123123.ngrok.io_](https://123123.ngrok.io/) — this is the base URL that points back to your **Node-RED** instance.

The callback is

```plain text
<https://youraddress.ngrok.io/redbot/sinch>
```

You can verify your **Node-RED** instance is reachable by opening

```plain text
<https://youraddress.ngrok.io/redbot/sinch/test>
```

If you get an _"ok"_ then **Node-RED** is up and running and Sinch can reach it.

## Create a Sinch Conversation API app

Sign in (or sign up) at the [Sinch Customer Dashboard](https://dashboard.sinch.com/). Once inside the dashboard:

1. Pick the project you want to use (or create a new one). Open the project _Overview_ and copy the **Project ID** — it's a UUID like `abc12345-6789-...`. You'll need it later in the `Sinch Receiver` configuration.

2. From the left sidebar go to **Conversation API → Apps** and click **New app**. Give the app a name, choose the region you want to deploy in (United States, Europe or Brazil — pick the one closest to your users) and create it. Open the newly created app and copy the **App ID**.

3. Still inside the app, go to the **Channels** (or _Integrations_) tab and connect every channel you want to use (SMS, WhatsApp, Telegram, Messenger, RCS, Viber, …). Each channel has its own onboarding flow — follow the instructions in the Sinch documentation for the channel you need.

## Create the Access Key (Key ID / Key Secret)

The Conversation API uses OAuth2 _client credentials_. You generate a key pair from your Sinch account, not from the app itself.

4. In the dashboard, open **Settings → Access keys** (top-right user menu, or the project _Settings_ section).

5. Click **Create new key**. Give it a label (e.g. _"RedBot dev"_) and confirm.

6. Sinch will show you the **Key ID** and the **Key Secret** _only once_ — copy both immediately and store them somewhere safe. If you lose the secret you'll have to generate a new key.

> The Key ID and Key Secret are credentials at the _project_ level: a single key pair can be used by multiple Conversation API apps inside the same project.

## Configure the webhook

Back in the Conversation API app (**Conversation API → Apps →** _**your app**_):

7. Open the **Webhooks** section and click **New webhook** (or _Add webhook_).

8. Set the **Target URL** to the ngrok address you grabbed earlier, ending with `/redbot/sinch`, e.g.

	```plain text
	<https://123123.ngrok.io/redbot/sinch>
	```

9. Under **Triggers**, enable at least `MESSAGE_INBOUND` so that messages coming from end users are delivered to RedBot. You can also enable `MESSAGE_DELIVERY`, `EVENT_INBOUND`, `EVENT_DELIVERY`, `CONVERSATION_START` and `CONVERSATION_STOP` if your flow needs them.

10. Save the webhook.

> If you change the ngrok address (which happens every time you restart ngrok on the free plan), remember to update the webhook target URL accordingly.

## Configure the node in Node-RED

Open **Node-RED**, drop and connect a `Sinch Receiver` node, a `Text` node and a `Sinch Sender` node:

```plain text
[ Sinch Receiver ] → [ Text ] → [ Sinch Sender ]
```

Configure the `Text` node with something like _"Hello world!"_, then double-click the `Sinch Receiver` and create a new bot configuration using the values you saved earlier:

- **Project ID** — the Sinch project that owns the Conversation API app.

- **App ID** — the Conversation API app id.

- **Key ID** / **Key Secret** — the access key pair you generated.

- **Region** — must match the region of the Conversation API app (`us`, `eu` or `br`).

Select the same bot configuration in the `Sinch Sender` node, then deploy.

Send a message from any connected channel to your Sinch app — you should get _"Hello world!"_ back on the same channel.

## Channel priority order

The `Sinch Sender` node exposes the `channelPriorityOrder` parameter, which maps to the Conversation API field `channel_priority_order`. It's a comma-separated list of channels the platform should try, in order, when delivering an outbound message (e.g. _"try Telegram first, fall back to SMS"_).

```plain text
TELEGRAM,SMS
```

Valid channel codes: `WHATSAPP`, `RCS`, `SMS`, `MMS`, `MESSENGER`, `VIBER`, `VIBERBM`, `KAKAOTALK`, `KAKAOTALKCHAT`, `LINE`, `WECHAT`, `TELEGRAM`, `INSTAGRAM`, `APPLEBC`. See the [Sinch channel support](https://developers.sinch.com/docs/conversation/channel-support/) docs for the full list.

## Development vs Production

`Sinch Receiver` and `Sinch Sender` nodes have a double bot configuration for _development_ and _production_. By default the _development_ configuration is used. To switch to _production_, edit the **Node-RED** settings file (`settings.js`) and set the `environment` global variable to `"production"`. See [Deploying RedBot](https://www.notion.so/c0c2de46b48a4def837753c7e284b356) for more details.

## Troubleshooting

- **No inbound messages reach Node-RED** — open `https://youraddress.ngrok.io/redbot/sinch/test` in a browser. If you don't get `ok`, ngrok or Node-RED isn't reachable. If you do get `ok` but messages still don't arrive, double-check that the webhook in the Sinch dashboard points to `/redbot/sinch` (not `/redbot/sinch/test`) and that the `MESSAGE_INBOUND` trigger is enabled.

- **Sinch auth failed (401)** — the Key ID / Key Secret are wrong or have been revoked. Generate a new access key and update the node configuration.

- **Sinch API /messages:send failed (403 / 404)** — the App ID doesn't belong to the project (Project ID) you configured, or the region of the app doesn't match the region selected in the node.
