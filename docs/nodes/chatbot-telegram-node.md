
Creating a chatbot in **Telegram** is very easy, since it allows polling in order to to receive messages, it doesn’t required a callback url and a https certificate (like **Facebook Messenger**)

**Telegram** is really coherent and you have to use a chat bot to create a chatbot. Connect to **@BotFather** and type `/newbot`, then in the next two steps give the bot a name and username (this will be the real unique address of your chatbot), you’ll get something like this for **@my_new_chat_bot**

![Telegram create chatbot](./docs/assets/7479ea1e9e9b4e85.png)

Copy and paste the access token. For more information [read here](https://core.telegram.org/bots#6-botfather). Then open your **Node-RED** and add a `Telegram Receiver node` , in the configuration panel, add a new bot and paste the token

![Paste Telegram token](./docs/assets/f03fa824ccdc040b.png)

`Telegram Receiver node` also support the connection with web hook, the URL must be secure (https) and should hit the `/redbot/telegram` endpoint of the **Node-RED** instance, for example

```plain text
https://a.secure.url.com/redbot/telegram
```

Use **ngrok** to test the webhook locally during development.

`Telegram Receiver node` and `Telegram Sender node` have a double bot configuration for _development_ and _production_. By default is used the _development_ configuration. To use _production_ configuration, edit **Node-RED** settings file (_settings.js_) and set the _environment_ global variable to _“production”_. See [Deploying RedBot](https://app.notion.com/p/c0c2de46b48a4def837753c7e284b356)  for more details.
