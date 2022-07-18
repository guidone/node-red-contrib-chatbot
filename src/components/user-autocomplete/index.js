import React, { useState } from 'react';
import { AutoComplete, InputGroup } from 'rsuite';
import PropTypes from 'prop-types';
import { useQuery } from 'react-apollo';
import _ from 'lodash';

import useMCContext from '../../../src/hooks/mc-context';

import { SEARCH } from './queries';
import renderItem from './views/render-item';
import renderUserAsString from './views/render-user-as-string';
import './style.scss';

const UserAutocomplete = ({
  value,
  onChange = () => {},
  style,
  excludeIds = null,
  placeholder = null
}) => {
  const { state } = useMCContext();
  const [search, setSearch] = useState(null);
  const [items, setItems] = useState(null);

  const variables = {
    search: search != null ? search : undefined,
    id: search == null ? (value != null ? value.id : 0) : undefined,
    chatbotId: state.chatbotId
  };
  const { client } = useQuery(SEARCH, {
    fetchPolicy: 'network-only',
    variables,
    onCompleted: data => setItems(data.users)
  });

  let current;
  if (search != null) {
    current = search;
  } else {
    if (!_.isEmpty(items)) {
      current = renderUserAsString(items[0]);
    } else {
      current = '';
    }
  }

  return (
    <div className="ui-user-autocomplete">
      <InputGroup inside style={style}>
        <AutoComplete
          value={current}
          placeholder={placeholder}
          renderItem={renderItem}
          onChange={(current, event) => {
            const isBackspace = event.nativeEvent != null && event.nativeEvent.inputType === 'deleteContentBackward';
            if (event.keyCode === 13) {
              const found = items.find(item => item.id === current);
              if (found != null) {
                setSearch(null);
                onChange(found);
              }
            } else if (isBackspace) {
              if (search != null) {
                setSearch(current);
              }
              setItems(null);
              onChange(null);
            } else if (event.nativeEvent != null && event.nativeEvent.inputType === 'insertText') {
              setSearch(String(current));
            }
          }}
          onSelect={item => {
            if (item != null) {
              setSearch(null);
              onChange(item);
            }
          }}
          data={(items || [])
            .filter(item => excludeIds == null || !excludeIds.includes(item.id))
            .map(item => ({
              key: item.id,
              value: item.id,
              label: `${item.username} ${item.first_name} ${item.last_name}`,
              ...item
              }))
          }
        />
      </InputGroup>
    </div>
  );
};
UserAutocomplete.propTypes = {
  value: PropTypes.shape({
    id: PropTypes.number,
    userId: PropTypes.string,
    username: PropTypes.string
  }),
  onChange: PropTypes.func,
  style: PropTypes.object,
  // exclude some user id from the drop down
  excludeIds: PropTypes.arrayOf(PropTypes.number)
};

export default UserAutocomplete;