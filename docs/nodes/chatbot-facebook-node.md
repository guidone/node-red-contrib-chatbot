
**Facebook Messenger** API talks to **RedBot** via a https callback (a self signed certificate is not enough). We’ll use [ngrok](https://ngrok.com/) to create a https tunnel for our local **Node-RED** instance. Install it, then open a shell window and run

```bash
ngrok http 127.0.0.1:1880
```

You should get something like

![ngrok](./docs/assets/ef3399937bcddcaa.png)

Grab the https address you get, something like _https://123123.ngrok.io_, this is the base url that points back to your **Node-RED** instance.

The callback is

```plain text
http://youraddress.ngrok.io/redbot/facebook
```

Replace the hostname (_youraddress.ngrok.io_) with what you got above. [Start here](https://developers.facebook.com/apps/create/) to create a new **Facebook** app, select type _None_.

In the app _Dashboard_ go to the _“Add products to your app”_ and add **Messenger** 

![](./docs/assets/58029f8b1899ce8b.png)

Your **Facebook** app must be connected to a _Facebook page_, go to the _Access tokens_ section and click on the _Add or remove Pages_ (or create a page if you don’t have one).

After the page has been linked to the app, click on _Generate token_, then grab it.

![](./docs/assets/b7cfe878bdbc0caf.png)

Go to the _Webhooks_ sections and click on _Add Callback URL_ and put the ngrok URL you got before (i.e., _https://123123.ngrok.io/redbot/facebook_), put anything on _Verify token_ and then click on _Verify an save._

Switch to the _Settings_ → _Basic_ section and grab the _App secret_.

Now switch to **Node-RED,** drop and connect a `Messenger Receiver` node, `Text` node and `Messenger Sender` node and connect like below

![](./docs/assets/dde411ba6ad33c7a.png)

Don’t forget to configure the `Text` node (i.e., set the text _“Hello world!”_).

Double click on the `Messenger Receiver` node and create a new configuration, use the values saved before: _Access token_, _App secret._

![](./docs/assets/735e25cb5fa78c1f.png)

Select also the newly created configuration in the `Messenger Sender` node.

Now open [messenger.com](http://messenger.com/), create a new message and select as recipient the page previously selected, write anything, you should receive an _“Hello world!”_.

If you get an error means that you have used wrong parameters (access token, app secret, etc) or, for some reason, Facebook APIs cannot reach the your callback url.

To exclude the second option and be sure that your **Node-RED** instance works correctly, grab your **ngrok** url and open this address

```plain text
http://youraddress.ngrok.io/redbot/facebook/test
```

If you get an _“ok”_ then **Node-RED** is up and running. 

`Messenger Receiver` and `Messenger Sender` nodes have a double bot configuration for _development_ and _production_. By default is used the _development_ configuration. To use _production_ configuration, edit **Node-RED** settings file (_settings.js_) and set the _environment_ global variable to _“production”_. See [Deploying RedBot](https://www.notion.so/c0c2de46b48a4def837753c7e284b356) for more details.
