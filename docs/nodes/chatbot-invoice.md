
This node creates an Invoice to trigger a payment in **Telegram**. To learn more about Telegram payments [read here](https://core.telegram.org/bots/payments).

In order to start a payment process a **providerToken** is needed: use @BotFather to get a providerToken for a supported payment platform (like Stripe) and set this in the chat bot config [Telegram Menu node](https://www.notion.so/d7159ae828804a8784a639e6cdbdb95d) .

The `payload` parameter is a unique identifier for the invoice being processed, tipically is your _order-id_ or _cart-id_ and it will be sent back by Telegram when the payment is completed (not to be confused by **Node-RED**’s `message.payload`).

All the elements of the `Invoice node` supports chat context templating, for example it’s possible to set the title of the invoice to `Invoice to {{firstName}} {{lastName}}` and the amount of an item to `{{currentPrice}}` (given that somewhere is defined in the chat context the key _currentPrice_) and the template tokens will be replaced by the actual values.

The _Flexible order_ means that the final prices depends on the shipping method choosen by the user. When this happens the chatbot receives a message with type `invoice-shipping` that should be followed by a response unsing [Telegram Invoice Shipping node](https://www.notion.so/60c4b7025cde40378e87e7c3113907ed) . If this doesn’t happen, then the order will not be finalized.

When the payment is complete, a message type `payment` is sent to the chatbot with all the information provided by the user (email, phone number, shipping address). At this point the chatbot generally uses the [Rules node](https://www.notion.so/4113636f565d4ff4af08bc61a644206b)  to redirect these type of messages to an appropriate flow that uses the `payload` attribute to lookup in the database and flag the order as _paid_.

The `payment` message payload

```javascript
{
  currency: 'EUR',
  total_amount: 1423,
  invoice_payload: 'MY_STRING_PAYLOAD',
  shipping_option_id: 'my_shipping_id',
  order_info: {
    name: 'Guido Bellomo',
    phone_number: 'a-cell-phone-number',
    shipping_address: {
      country_code: 'IT',
      state: 'Mi',
      city: 'Milano',
      street_line1: 'Via Di Qua, 12',
      street_line2: '',
      post_code: '20100'
    }
  },
  telegram_payment_charge_id: '_',
  provider_payment_charge_id: 'ch_xxxyyyyzzzz'
}
```

Available parameters for the `msg.payload`

| Name                | Type             | Description                                                                                                                                            |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| title               | string           | The title of the invoice                                                                                                                               |
| description         | string           | The description of the invoice                                                                                                                         |
| payload             | string           | A custom string that identifies the order or the cart in your system, it will be returned when the payment is confirmed                                |
| currency            | string           | Three letters [ISO code](https://www.wikiwand.com/en/ISO_4217) for the currency, for example _USD_, _EUR_, etc.                                        |
| needName            | boolean          | The user’s name is required to complete the payment                                                                                                    |
| needEmail           | boolean          | The user’s email is required to complete the payment                                                                                                   |
| needPhoneNumber     | boolean          | The user’s phone number is required to complete the payment                                                                                            |
| needShippingAddress | boolean          | The user’s shipping address is required to complete the payment                                                                                        |
| isFlexible          | boolean          | The total amount depends on the shipping method, a message type `invoice-shipping` will be sent to the chatbot that requires a [[Invoice Shipping node |
| prices              | array of [price] | Items of the invoice                                                                                                                                   |
| photoUrl            | string           | Url of the picture for the invoice                                                                                                                     |
| photoHeight         | integer          | Width of the invoice picture. Required with _photoUrl_                                                                                                 |
| photoWidth          | integer          | Height of the invoice picture. Required with _photoUrl_                                                                                                |

The `[price]` object

| Name   | Type   | Description                            |
| ------ | ------ | -------------------------------------- |
| label  | string | The description of the invoice item    |
| amount | number | The total amount for this invoice item |
