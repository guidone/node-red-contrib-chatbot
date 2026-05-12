
With the `MC GraphQL node` it’s possible to query the database entity Mission Control is based on.

The endpoint is `http://localhost:1880/graphql` and with a [GraphQL client](https://altair.sirmuel.design/) it’s possible to explore queries and mutations.

There are several entities

| Entity   | Description                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| contents | A generic blog-post like table (i.e. title, body, date, category) with unlimited types custom fields and a generic JSON payload |
| users    | Chatbot users with all all contact details filled automatically and with a generic JSON payload and chat context                |
| admins   | Mission Control administrators with role based permissions                                                                      |
| messages | Message store                                                                                                                   |
| records  | General records related to user (i.e. an invoice, an order)                                                                     |

For example, to fetch the latest context from namespace “content” (including custom fields)

```graphql
query {
  contents(
    limit: 1,
    order: "reverse:createdAt",
    namespace: "content"
  ) {
    id,
    title,
    body,
    createdAt,
    fields {
      name,
      value
    }
  }
}
```

## Creating a token

In order to access and explore the GraphQL server with clients like [Altair](https://altair.sirmuel.design/) is necessary to create an access token and use it with basic authentication

- Go to Mission Control ➡️ Configuration ➡️ Access token and create an access token

- Copy the access token

- Open the _“Headers”_ section in Altair client (left toolbar) and create and header named _“Authorization”_ with value _“Bearer”_

## Content entity

**Contents** is a blog-post-like table with some fields like title, body, language, category and some custom multi-purpose fields (like custom fields and JSON payload) that can be used in multiple situations.

![](https://raw.githubusercontent.com/guidone/node-red-contrib-chatbot/master/docs/images/content.gif)

Contents section in MissionControl

| Field      | Type          | Description                                                                                                                                                                                                                                                 |
| ---------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id         | number        | Unique id for the content                                                                                                                                                                                                                                   |
| title      | string        | The title of the content                                                                                                                                                                                                                                    |
| language   | string        | Language of the content (ISO)                                                                                                                                                                                                                               |
| namespace  | string        | A string defining the namespace this content belongs to. Default is “content” and can be anything, only contents with namespace “content” will be listed in the content post section. In order to show different namespaces a dedicated plugin is required. |
| body       | string        | The body of the content                                                                                                                                                                                                                                     |
| id         | number        | Unique id for the content                                                                                                                                                                                                                                   |
| slug       | string        | It’s the unique identifier for this content, a kind of external and readable primary key. Can be used, for example, for multi language support                                                                                                              |
| payload    | string / json | A generic JSON payload, can contain anything                                                                                                                                                                                                                |
| chatbotId  | string        | The unique identifier of the chatbot this content belongs to. By default the `MC Content node` only searches for contents within the same chatbot (Mission Control can handle multiple bots)                                                                |
| cratedAt   | date          | Creation date                                                                                                                                                                                                                                               |
| modifiedAt | date          | Modification date                                                                                                                                                                                                                                           |
| categoryId | number        | Id of the category                                                                                                                                                                                                                                          |

The `namespace` field is used to create multiple sections re-using the content components and table, only contents with the namespace “content” will be shown in the Content ➡️ Posts section, to handle multiple namespace a dedicated plugin is required (i.e. the Access tokens section is storing the token in the `payload` field of a content with `namespace` set to _tokens_, the plugin is defined in _/core/access_token.js_.

The `slug` field is using to create and reference a content with a user-defined primary key (and not an incremental value for the `id` field). Possible use cases:

- create a _“Terms of Conditions”_ content and assign it the slug _“toc”_. The this _“toc”_ reference can be used in a `MC Content node` to fetch the content and show it in a message for a user. If a new version of the _“Terms of Conditions”_ is required, it’s possible to create a new content for it and then assign the slug _“toc”_ only when it’s ready.

- handle multi-language contents: contents with the same `slug` are basically the same entity written in different languages. If a slug is specified in `MC Content node` it tries to fetch the content given the slug and language of the current user (see the `MC Content node` for more details)

## Users

Here are stored the chatbot users. When Mission Control is enabled for a specific chatbot and the Store Messages is enabled, the user is automatically created when a message is received, it includes some basic information (if available in the specific platform).

![](https://raw.githubusercontent.com/guidone/node-red-contrib-chatbot/master/docs/images/user.gif)

Users section in MissionControl

| Field      | Type                           | Description                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id         | number                         | Unique id for the content                                                                                                                                                                                                                                                                                                                                                                                                    |
| userId     | string                         | The unique identifier of the user within the chatbot. A user can interact with the bot with multiple platforms (_chatId_), the _chatId_ is the unique identifier for a user in a specific platform. A user can interact with the same chatbot with multiple platforms, there’s a one-to-many relation between the _userId_ and _chatId_. Generally it defaults to the _chatId_ of the first platform the user interacts with |
| context    | json                           | The chat context of the user                                                                                                                                                                                                                                                                                                                                                                                                 |
| email      | string                         |                                                                                                                                                                                                                                                                                                                                                                                                                              |
| first_name | string                         |                                                                                                                                                                                                                                                                                                                                                                                                                              |
| last_name  | string                         |                                                                                                                                                                                                                                                                                                                                                                                                                              |
| username   | string                         |                                                                                                                                                                                                                                                                                                                                                                                                                              |
| language   | string                         | Language of the user (ISO)                                                                                                                                                                                                                                                                                                                                                                                                   |
| payload    | string / json                  | A generic JSON payload, can contain anything                                                                                                                                                                                                                                                                                                                                                                                 |
| chatbotId  | string                         | The unique identifier of the chatbot this user belongs to                                                                                                                                                                                                                                                                                                                                                                    |
| chatIds    | [ChatId]                       | List of chatIds / platforms pairs. The _chatId_ is the unique identifier for a user in a specific platform. A user can interact with the same chatbot with multiple platforms, there’s a one-to-many relation between the _userId_ and _chatId_                                                                                                                                                                              |
| messages   | [Message]                      | Messages sent and received by the user                                                                                                                                                                                                                                                                                                                                                                                       |
| records    | [Records](about:blank#records) | Generic records related to the user                                                                                                                                                                                                                                                                                                                                                                                          |
| createdAt  | date                           | Creation date                                                                                                                                                                                                                                                                                                                                                                                                                |
| updatedAt  | date                           | Modify date                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Messages

tbd

## Records

tbd
