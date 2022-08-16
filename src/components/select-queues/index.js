import React from 'react'
import _ from 'lodash';
import PropTypes from 'prop-types';
import { SelectPicker } from 'rsuite';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';

const GET_QUEUES = gql`
query {
  queues {
    name,
    label
  }
}`;

const SelectQueues = ({ disabled = false, children, ...props }) => {
  const { loading, error: loadError, data } = useQuery(GET_QUEUES, { fetchPolicy: 'network-only' });

  return (
    <SelectPicker
      {...props}
      searchable={false}
      placeholder="Select queue"
      disabled={disabled || loading}
      cleanable={false}
      data={(data?.queues ?? []).map(queue => ({ value: queue.name, label: queue.label }))}
    />
  );
};
SelectQueues.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool
};

export default SelectQueues;