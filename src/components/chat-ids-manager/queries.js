import { gql } from '@apollo/client';

const DELETE_CHAT_ID = gql`
mutation($id: Int!) {
  user: deleteChatId(id: $id) {
    id,
    chatIds {
      id,
      transport,
      chatId
    }
  }
}`;

export { DELETE_CHAT_ID };