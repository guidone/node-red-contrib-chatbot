import gql from 'graphql-tag';
import { useQuery, useMutation } from 'react-apollo';

import useMCContext from './mc-context';

import { useNodeRedSocket } from './socket';

const GET_CONFIGURATION = gql`
query($namespace: String, $chatbotId: String) {
  configurations(namespace: $namespace, chatbotId: $chatbotId) {
    id
    namespace
    payload
  }
}
`;

const UPDATE_CONFIGURATION = gql`
mutation($configuration: InputConfiguration!) {
  createConfiguration(configuration: $configuration) {
    id,
    namespace,
    payload
  }
}
`;

const useConfiguration = ({
  namespace,
  onCompleted = () => {},
  onLoaded = () => {}
}) => {
  const { state } = useMCContext();
  const { loading, error, data } = useQuery(GET_CONFIGURATION, {
    variables: { namespace, chatbotId: state.chatbotId },
    onCompleted: data => {
      let configurationValue;
      if (data != null && data.configurations != null && data.configurations.length !== 0) {
        try {
        configurationValue = JSON.parse(data.configurations[0].payload);
        } catch(e) {
          // do nothing
        }
      }
      onLoaded(configurationValue);
    }
  });
  const { sendMessage } = useNodeRedSocket();

  let configurationValue;
  let parsingError;
  if (data != null && data.configurations != null && data.configurations.length !== 0) {
    try {
    configurationValue = JSON.parse(data.configurations[0].payload);
    } catch(e) {
      parsingError = `Invalid JSON in configuration "${namespace}"`;
    }
  }

  const [
    updateConfiguration,
    { loading: mutationLoading, error: mutationError },
  ] = useMutation(UPDATE_CONFIGURATION, { onCompleted });

  return {
    loading: loading,
    saving: mutationLoading,
    error: error || mutationError || parsingError,
    data: configurationValue,
    update: async configuration => {
      await updateConfiguration({
        variables: {
          configuration: {
            namespace,
            chatbotId: state.chatbotId,
            payload: JSON.stringify(configuration)
          }
        }
      });
      sendMessage('mc.configuration', {
        namespace,
        chatbotId: state.chatbotId,
        ...configuration
      });
    }
  };
};

export default useConfiguration;