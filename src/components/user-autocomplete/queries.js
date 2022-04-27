import gql from 'graphql-tag';

const SEARCH = gql`
query($id: Int,$username: String, $search: String, $chatbotId: String) {
  users(id: $id,username: $username, search: $search, chatbotId: $chatbotId) {
    id,
    userId,
    chatbotId,
    username,
    language,
    first_name,
    last_name,
    chatIds {
      chatId,
      transport
    }
  }
}`;



export { SEARCH };