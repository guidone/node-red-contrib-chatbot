import gql from 'graphql-tag';

const INSTALL_PLUGIN = gql`
mutation (
  $plugin: String!,
  $url: String!,
  $version: String!,
  $initialConfiguration: String,
  $initialContent: InputContent,
  $chatbotId: String,
  $pluginId: String
  ) {
  installPlugin(
    plugin: $plugin,
    url: $url,
    version: $version,
    initialConfiguration: $initialConfiguration,
    initialContent: $initialContent,
    chatbotId: $chatbotId,
    pluginId: $pluginId
  ) {
    id,
    plugin,
    filename,
    version
  }
}`;

const UPDATE_PLUGIN = gql`
mutation (
  $plugin: String!,
  $url: String!,
  $version: String!,
  $initialConfiguration: String,
  $chatbotId: String
  ) {
  updatePlugin(
    plugin: $plugin,
    url: $url,
    version: $version,
    initialConfiguration: $initialConfiguration,
    chatbotId: $chatbotId
  ) {
    id,
    plugin,
    filename,
    version
  }
}`;

const UNISTALL_PLUGIN = gql`
mutation($plugin: String!, $chatbotId: String) {
  uninstallPlugin(plugin: $plugin, chatbotId: $chatbotId) {
    id
  }
}`;

const CHATBOT = gql`
query($chatbotId: String) {
  chatbot(chatbotId: $chatbotId) {
    id,
    name,
    description,
    plugins {
      id,
      plugin,
      filename,
      version
    }
  }
}`;

const GET_CHATBOT = gql`
query($chatbotId: String) {
  chatbot(chatbotId: $chatbotId) {
   	id,
    name,
    description,
    guid,
    chatbotId,
    plugins {
      id,
      plugin,
      version,
      filename
    }
  }
}`;

export { INSTALL_PLUGIN, CHATBOT, UNISTALL_PLUGIN, UPDATE_PLUGIN, GET_CHATBOT };