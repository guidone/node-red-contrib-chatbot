
The `Pop Message node` is useful with all the nodes (like [NLPjs Process](https://www.notion.so/bbc3deb2d39a4b338fc6515eee337cd4) , [MC GraphQL node](https://www.notion.so/0dc75116dee9458486e1a4f09fc3f44b) ) that overwrites the `msg.payload` of the **Node-RED** message, losing any reference with the original message from the chatbot user.

The `Pop Message node` restores the previous value of `msg.payload` overwritten by these nodes.

For example consider this flow when we want to query a database to check is the user is allowed to use the chatbot:

![Check user credentials](https://raw.githubusercontent.com/guidone/node-red-contrib-chatbot/master/docs/images/example-pop-node.png)

The node [MC GraphQL node](https://www.notion.so/0dc75116dee9458486e1a4f09fc3f44b)  is querying the database presenting the result in `msg.payload` overwriting the user’s message which is required in the rest of the flow. The `Function node` checks the result of the query and controls the flow: if the user is not allowed to use the chatbot the flow is redirected to the second pin and a _“Not allowed”_ message is answered. If the user has the right permission the flow is redirected to the first pin and the user’s message (the previous value of `msg.payload`) is restored to be used in the rest of the flow (for example a parse node).

It’s possible to store the current message (`msg.payload`) with the `Push message node`, this is useful in all situations where the downstream node is overwriting the `payload` of the **Node-RED** message.

**Warning:** it doesn’t work across **RedBot**’s senders and receivers
