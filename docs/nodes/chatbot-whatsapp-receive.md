
**Whatsapp Cloud API**  talks to **RedBot** via a https callback (a self signed certificate is not enough). We’ll use [ngrok](https://ngrok.com/) to create a https tunnel for our local **Node-RED** instance. Install it, then open a shell window and run

```bash
ngrok http 127.0.0.1:1880
```

You should get something like

![ngrok](./docs/assets/254e9a9714ed9308.png)

Grab the https address you get, something like _https://123123.ngrok.io_, this is the base url that points back to your **Node-RED** instance.

The callback is

```plain text
http://youraddress.ngrok.io/redbot/whatsapp
```

Create new **Facebook** app [https://developers.facebook.com/apps/create/](https://developers.facebook.com/apps/create/), pick up **Business**

In the app _Dashboard_ go to the _“Add products to your app”_ and add Whatsapp (it only appears for **Business** applications).

![](./docs/assets/177c3bbce10a5d64.png)

Switch to the “_Getting started”_ section

![](./docs/assets/81390d53bd6b16f6.png)

Grab _Temporary access token_, _Phone number ID_, _Business Account ID_ and copy them into the configuration panel of `Whatsapp Receiver` node.

Also get the test number, that’s the number you can use to test your chatbot.

Switch to the “Configuration” section, click on _“Edit”_ and add the webhook created with **ngrok** (should be something like _http://123456abc.ngrok.io/redbot/whatsapp_)

![](./docs/assets/e843b71ee12a9c79.png)

Set something in the _“Verify token”_ field (i.e., _“test”_) and click on _“Verify and save”_. 

Finally click on _“Manage”_ and then _“Subscribe”_ to _Message_ entities

![](./docs/assets/0fda8a462f4562c5.png)

Now switch to **Node-RED,** drop and connect a `Whatsapp Receiver` node, `Text` node and `Whatsapp Sender` node and connect like below

![](./docs/assets/cee87a297687e5bf.png)

Don’t forget to configure the `Text` node (i.e., set the text _“Hello world!”_).

Double click on the `Whatsapp Receiver` node and create a new configuration, use the values saved before: _Temporary access token_, _Phone number ID_, _Business Account ID._

![Create a new Whatsapp configuration](./docs/assets/e48d5ed2a75d726c.png)

Select also the newly created configuration in the `Whatsapp Sender` node.

Now send a simple message to the _Whatsapp Test Number_ and you should receive, as response, _“Hello world!”_.
