
In order to create a chatbot in **Viber**, you have to register at the partners site [here](http://partners.viber.com/), then click on _“Create Bot account”_. Fill in the form then grab the **access token**.

Like other platforms, **Viber** requires a callback URL (web hook) to send messages to and must be accessible from internet (not just your local network), in order to test in your local environment, you can use ngrok to create a bridge between a public address and your local instance of **RedBot**:

```bash
ngrok http localhost:1880
```

You should get something like

![Ngrok](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/7d009da9-4b7e-412b-81e4-1e3bc3caa564/facebook-1.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4664JIN67EK%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122955Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJIMEYCIQCCu0sko46xg3kFb8E7XzQ4qMgVn2eAuq7MZ5F8QI9tJQIhAJeSBlaEpIU1JplFORu0cxcDxzUOA%2BP0JkxoB8UUbxV%2BKv8DCC0QABoMNjM3NDIzMTgzODA1Igyz7jk08N4CPYcDWi0q3APNGGMyrbTbQ%2FmVDhiTT70w0bcZCIavcuxer8dDS86NqsmvupnkJ4p6cbUEikvebGI26WUgE2CLb8qdD1EnUH%2Bx1zrUP0oZIjDFfiC00BPhLbCrDo7kucETeW25%2Fgqu6alnzPgkHZerGmO55jTZX6VKQEFmMn4AKQ2mtuLLRZWG55C6DG5dTX0945JSrMg%2BiRXXo%2BB8n8TeH01SGCAkFeItjO8M%2FbahQcLFES0OKI0jA46yiB7EJmhtAm66HMbInzZOBYVIvCDTRWO0JekzVvpFMLSrNy0dPXyfCqFVn%2B67nzolg4je8XwXl0qgPEmuWFrvffCoLo%2Bmb9k511e9JzohX1tcvtLzVK%2Bls4oXPWNakkrbSrrqElGOTFn96x4eWOX88Lr6FtxTW9ZgfydNPZnkjK1cT4ADDdJ2Xjjgp%2FzfgZYvJQDZX7ucqEf%2FsZ4VXHDIAApCH%2F44iCUH%2BQihjBuyUIL4jRJPdwwiCqJdwfyThqpi4Kfcfq%2F%2BlCgxlTdKQy5J12GFRX0A0KdigVACrIGPY%2BD56noAPluAadWujhx2quslwWTlZkApSbPFk4RREXC%2BA215Nkz5rlW11Vkpk9aJjdvcAfVX5K3qFSD046fbBR%2Fm6018sGEGt%2FfFPTDWnIzQBjqkASgmIxDKQbJ5KhkWLc5bvsrGC0SGBlrFJHNMPf0%2BvUw%2F1W40yQi6k%2BS6xhT84xby0T%2F9hb8BlR%2F%2FEO4Jbj4IwGs%2FnkZIBIW7MeM15565LnpSPJQg90fBnV5xfz9jXRY%2B4CP%2B8UCoRhUdN2EjuOiHxHeEgpt2gES3V94BddHVh1bdSdPFZwS9PoePvEUH4jCzm9JhEHfJXz8c0h0QQbuWHV6auu1Y&X-Amz-Signature=673332abf41ace7f45a21dd24d8fad5d9fba91cfce28fa30169fc5e9c747a0ae&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Grab the https address you, something like https://123123.ngrok.io, this is the base url that points back to your **Node-RED** instance.

The callback is

```bash
https://youraddress.ngrok.io/redbot/viber
```

A **Viber** bot needs at least the access token and a working web hook in order to work. Note that unless other platforms that requires a callback (like **Slack** or **Facebook Messenger**), the web hook is required in the **RedBot** configuration (in **Node-RED**) and not in the **Viber** backend. P.S. After a chatbot is created in the **Viber** platform, it will not be possible to send a message in any client until a valid web-hook is set in the configuration.
