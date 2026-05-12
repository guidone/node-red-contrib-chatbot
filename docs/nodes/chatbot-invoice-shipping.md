
The `Invoice Shipping node` is required when an invoice is sent to the Telegram client with the flag _isFlexible_: that means that the shipping options need to be calculates based on the destination and/or the goods that are to be delivered.

When this happens a message type _invoice-shipping_ is received from the chatbot, at this point is mandatory to answer with a `Invoice Shipping node` with the proposed shipping options and related prices. The total amount charged to the user’s credit card will depend on the selected shipping option.

Use a [Rules node](https://www.notion.so/4113636f565d4ff4af08bc61a644206b)  to redirect the incoming messages with type _invoice-shipping_ to the subflow that handles the aswer. It’s also a common use case to calculate dinamically the shipping options in a `Function node`

![Shipping Options](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/52465df7-4094-4095-8934-f09ea2ac18f5/example-shipping-options.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SLBNDED3%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T123009Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIG1a3XMUDNSGC20R7FrWTng0Z6y5DX5OzgepjbI5wncOAiEAwoq9SePCHwbYhZoUSmkXP1Y%2FL3SMILQRFV0Cvuj%2Bq1gq%2FwMILBAAGgw2Mzc0MjMxODM4MDUiDPUYbZliPRz5NVYuTSrcA9d4M5NUDgNBsZKS9NEPzUxiUhqEIfdYEnQXkCd2LENoasweE1dAP2LYcei3s05PKQLi3dgUfnsx1cThTGe4bOkZsQ%2F8xcApQEjqUvuDTlfGFIA1bLL%2F1c1cFhik0cnd8pl0jOnhqdKaVpKvl%2FOsfXM76Y6frchYrQtFyWqDfyUn4ZuxElpeo3UuJfPVvkeDIsLtppK81ltEcynKBEeBBbjtlRLHLG%2B4ynuem1Q7na8szrrm9V%2FuJPLLI%2FL9wJHWnttcDDmZ1hfN0x3UyL3E0zipsN9uJxiGq77FfoVGgDfKIbkvFDBp6J4Vs%2FTehnOirohnh9SqXygf%2B7tKXVv%2ByPOqd7JdeyG23xrJQ78SWdSKtqTUVZ0CQGKz1fIFX%2F2DN6Fx233XFuvpzpjbAgxDTn2wLGlew%2Bqavu7megAjXsaUq6aJ2ZUutvxOPpehUA5CkKfgijw0Pg%2BGtZYImNPGzQqEk2RuWSQ5A9%2FBt%2BB0fQWSaI3pFlcU2MD5acU5fAbk%2BBQ4Zf1etKGKFzOEaTa7pAhqQ3%2FU0KPHw9AwSAPDo5VWYy3UaXyKFxZL2hFZAE7AdaOgCTQgCLpTS44UH9pKOcQ5sMJQPEyq9hSsjDD8GUVdXSgh%2Fxk6I7elO0r2MJ6djNAGOqUBczbPsCgkooM0Q4SPfL22TDSbcNUHiFySWwz9nA5MtH71M%2BxcoSTcPBlECU0kZNRM4yUoKA764z7a5UPTHCf44vTIdetlOQpK3%2FDcBoo1%2FG79ULnJV9FAOcdFIoqgn3PhxRDZZqOuW7AiorPvdwKxkHZjWgc9MZjR4HsaVKGTRo33tQ4vDDHX5jzMpqrX%2FxtWOcmMIPTK5jkr9qF9TlMFnmwOqXvI&X-Amz-Signature=91d17d0a954690033ba79df7e3efef9e27731b0ed0b75dbb2f6792285f537aa2&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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
