
The `Invoice Shipping node` is required when an invoice is sent to the Telegram client with the flag _isFlexible_: that means that the shipping options need to be calculates based on the destination and/or the goods that are to be delivered.

When this happens a message type _invoice-shipping_ is received from the chatbot, at this point is mandatory to answer with a `Invoice Shipping node` with the proposed shipping options and related prices. The total amount charged to the user’s credit card will depend on the selected shipping option.

Use a [Rules node](https://www.notion.so/4113636f565d4ff4af08bc61a644206b)  to redirect the incoming messages with type _invoice-shipping_ to the subflow that handles the aswer. It’s also a common use case to calculate dinamically the shipping options in a `Function node`

![Shipping Options](./docs/assets/19ef373dfbca9416.png)

And in the upstream `Function node`

```javascript
msg.payload.shippingOptions = [
  { id: 'FEDEX', label: 'FedEx', amount: 9.99 },
  { id: 'DHL', label: 'DHL', amount: 11.99 },
];
return msg;
```

Available paramenters for payload in the upstream node

| Name            | Type                      | Description                                    |
| --------------- | ------------------------- | ---------------------------------------------- |
| shippingOptions | array of [shippingOption] | The shipping options available for the payment |

The shipping option

| Name   | Type   | Description                                 |
| ------ | ------ | ------------------------------------------- |
| id     | string | A unique identifier for the shipping option |
| label  | string | The name of the shipping option             |
| amount | number | The additional price for the shipping       |
