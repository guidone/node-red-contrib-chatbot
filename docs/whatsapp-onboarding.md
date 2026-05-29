# Onboard a WhatsApp chatbot in RedBot

WhatsApp Cloud API talks to RedBot through an HTTPS callback (a self-signed certificate is **not** accepted). For local development we expose Node-RED through an [ngrok](https://ngrok.com/) tunnel; for production you'll point Meta at your real HTTPS hostname.

---

## 1. Expose Node-RED over HTTPS with ngrok

Install ngrok and sign in (`ngrok config add-authtoken …`), then open a shell and run:

```bash
ngrok http 127.0.0.1:1880
```

ngrok prints a forwarding URL such as `https://abcd-1234.ngrok-free.app`. The full webhook RedBot listens on is:

```
https://<your-tunnel>.ngrok-free.app/redbot/whatsapp
```

Keep this terminal open while testing — every time you restart ngrok the URL changes (unless you have a reserved domain), and you'll have to update the webhook in Meta.

> Tip: a paid ngrok plan gives you a static domain (`--domain my-bot.ngrok.app`) so you don't have to reconfigure the webhook on every restart.

---

## 2. Create the Meta app and WhatsApp Business Account (WABA)

The Meta flow has been reorganised since the original guide. Two things must exist:

1. A **Meta Business Portfolio** (formerly "Business Manager") at <https://business.facebook.com/>. Create one if you don't have it — this is what owns the WABA, the app, and billing.
2. A **Meta for Developers app** at <https://developers.facebook.com/apps/create/>.

### 2.1 Create the app

- Go to <https://developers.facebook.com/apps/> → **Create app**.
- Use case: **Other** → app type: **Business**.
- Give it a name, attach the **Business Portfolio** from step 1.

### 2.2 Add the WhatsApp product

In the app dashboard sidebar choose **Add product → WhatsApp → Set up**.

This automatically provisions:

- A test **WhatsApp Business Account** (WABA)
- A **test phone number** (Meta-owned, you can use it free of charge to send messages to up to 5 verified recipients)
- A **temporary access token** valid for 24 hours

These three things are enough to get a "hello world" working. Production setup (real phone number + permanent token) is in [§6](#6-going-to-production).

### 2.3 Collect the IDs

Open **WhatsApp → API setup** in the app dashboard and copy:

| Field in Meta UI                | Field in RedBot               |
| ------------------------------- | ----------------------------- |
| Temporary access token          | **Token** (Access Token)      |
| Phone number ID                 | **Phone Number ID**           |
| WhatsApp Business Account ID    | **Business Account ID**       |

Also add your personal phone number to **To → Manage phone number list** so you can receive test messages.

---

## 3. Configure the webhook in Meta

In **WhatsApp → Configuration**:

1. Click **Edit** next to *Webhook*.
2. **Callback URL**: `https://<your-tunnel>.ngrok-free.app/redbot/whatsapp`
3. **Verify token**: any arbitrary string, e.g. `redbot-test`. Remember it — you'll paste the same string into the RedBot config.
4. Click **Verify and save**. Meta hits your callback with a `GET` to confirm the verify token; if ngrok is up and Node-RED is running, the check passes.
5. Click **Manage** under *Webhook fields* and **Subscribe** to at least the `messages` field. (You can add `message_template_status_update` later if you use templates.)

---

## 4. Configure the RedBot nodes

In Node-RED drop three nodes and wire them:

```
Whatsapp Receiver  →  Text  →  Whatsapp Sender
```

Set the **Text** node to something like `Hello world!`.

### 4.1 Whatsapp Receiver

Double-click and create a new configuration:

- **Bot Name**: any label
- **Token**: temporary access token from §2.3
- **Phone Number ID**: from §2.3
- **Business Account ID**: from §2.3
- **Verify token**: the exact string you typed in §3 step 3

### 4.2 Whatsapp Sender

Select the same bot configuration you just created.

Deploy the flow.

---

## 5. Test it

From the phone number you whitelisted in §2.3, send any text to the **test phone number** shown in the Meta dashboard. You should get `Hello world!` back, and the Receiver node should light up in the Node-RED debug panel.

If nothing happens:

- ngrok dashboard at <http://127.0.0.1:4040> shows incoming requests — useful to confirm Meta is calling you.
- `/redbot/whatsapp/test` returns `ok` if the route is mounted. Visit `https://<your-tunnel>.ngrok-free.app/redbot/whatsapp/test` in a browser.
- Check that your number is on the recipient allow-list — Meta silently drops messages to non-whitelisted numbers when using the test phone.

---

## 6. Going to production

The 24-hour temporary token and the Meta test phone number are fine for development, but for production you need:

### 6.1 A real phone number on the WABA

In the WhatsApp dashboard (or directly in Business Portfolio → **WhatsApp Accounts → Phone numbers**):

1. **Add phone number**. Use a number that is **not currently active on a personal/Business WhatsApp app** — if it is, fully delete the WhatsApp account on the device first.
2. Verify by SMS or voice.
3. Set the display name. The first display name goes through a Meta review (usually a few minutes to a day).

### 6.2 Business verification

For anything beyond the test sandbox (sending to numbers that aren't on your allow-list, increasing tier limits, using templates with media) the owning Business Portfolio must complete **Business Verification** under **Business Portfolio → Security Center**. Plan for a few business days; you'll need a company registration document.

### 6.3 A permanent access token via a System User

Temporary tokens expire after 24 hours and are not suitable for production. Generate a permanent one:

1. **Business Portfolio → Settings → Users → System users → Add**. Create a **System user** with role **Admin**.
2. **Assign assets**: add the WhatsApp app and the WABA, granting *Full control*.
3. Click **Generate new token**, pick the app, and select scopes **`whatsapp_business_messaging`** and **`whatsapp_business_management`**.
4. Copy the token (you won't see it again) and paste it into the **Token** field of the Whatsapp Receiver config in place of the temporary one.

### 6.4 Production webhook

Replace the ngrok URL with your real HTTPS endpoint in **WhatsApp → Configuration → Webhook**. The verify token can stay the same. Don't forget the path is still `/redbot/whatsapp`.

> If you run RedBot behind a reverse proxy, make sure the proxy forwards the raw request body — the receiver validates Meta's payload format before processing it.

### 6.5 App review (only if you let third parties install your bot)

If your app stays internal (one Business Portfolio, one WABA), you don't need App Review. If you're building a product that other businesses connect to via Embedded Signup, submit the `whatsapp_business_messaging` and `whatsapp_business_management` permissions for review.

---

## 7. Reference

- WhatsApp Cloud API version used by RedBot: `v22.0` (see [`lib/platforms/whatsapp/index.js`](../lib/platforms/whatsapp/index.js)).
- Callback path: `/redbot/whatsapp`
- Health check: `/redbot/whatsapp/test` returns `ok`
- Meta docs: <https://developers.facebook.com/docs/whatsapp/cloud-api>
