
In order to create a chatbot in **Viber**, you have to register at the partners site [here](http://partners.viber.com/), then click on _“Create Bot account”_. Fill in the form then grab the **access token**.

Like other platforms, **Viber** requires a callback URL (web hook) to send messages to and must be accessible from internet (not just your local network), in order to test in your local environment, you can use ngrok to create a bridge between a public address and your local instance of **RedBot**:

```bash
ngrok http localhost:1880
```

You should get something like

![Ngrok](./docs/assets/0ac635b315396cab.png)

Grab the https address you, something like https://123123.ngrok.io, this is the base url that points back to your **Node-RED** instance.

The callback is

```bash
https://youraddress.ngrok.io/redbot/viber
```

A **Viber** bot needs at least the access token and a working web hook in order to work. Note that unless other platforms that requires a callback (like **Slack** or **Facebook Messenger**), the web hook is required in the **RedBot** configuration (in **Node-RED**) and not in the **Viber** backend. P.S. After a chatbot is created in the **Viber** platform, it will not be possible to send a message in any client until a valid web-hook is set in the configuration.
