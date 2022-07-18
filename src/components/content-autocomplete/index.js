import React, { useState } from 'react';
import { AutoComplete, InputGroup, Button, FlexboxGrid, ButtonGroup, IconButton, Icon, Tooltip, Whisper } from 'rsuite';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useQuery } from 'react-apollo';

import Language from '../../components/language';
import useMCContext from '../../hooks/mc-context';

import ContentPreview from './views/content-preview';
import ContentIcon from './views/content-icon';
import useCreateContent from './hooks/create-content';
import { SEARCH } from './queries';
import './style.scss';

const withTooltip = Component => {
  return ({ children, tooltip, ...rest }) => (
    <Whisper
      placement="top"
      trigger="hover"
      speaker={<Tooltip>{tooltip}</Tooltip>}
    >
      <Component {...rest}>{children}</Component>
    </Whisper>
  )
};

const IconButtonTooltip = withTooltip(IconButton);

const ContentAutocomplete = ({
  value,
  onChange = () => {},
  style,
  useSlug = false,
  canCreate = true,
  fluid = false,
  namespace = 'content',
  customFieldsSchema,
  disabled: componentDisabled = false
}) => {
  const { state } = useMCContext();
  const [search, setSearch] = useState(null);
  const [items, setItems] = useState(null);
  const [content, setContent] = useState(null);
  const { createContent, modal } = useCreateContent({
    onComplete: async content => {
      onChange(useSlug ? content.slug : content.id);
      const result = await refetch();
      setItems(result.data.contents);
    }
  });

  const variables = {
    search: search != null ? search : undefined,
    id: search == null && !useSlug ? value || 0 : undefined,
    slug: search == null && useSlug ? value || 'invalid-slug' : undefined,
    namespace,
    chatbotId: state.chatbotId
  };
  const { client, refetch } = useQuery(SEARCH, {
    fetchPolicy: 'network-only',
    variables,
    onCompleted: data => setItems(data.contents)
  });

  const disabled = componentDisabled;

  let current;
  if (search != null) {
    current = search;
  } else {
    if (!_.isEmpty(items)) {
      current = useSlug ? `slug: ${items[0].slug}` : items[0].title;
    } else {
      current = '';
    }
  }

  return (
    <div className={classNames('ui-content-autocomplete', { fluid })}>
      <div className="autocomplete">
        <InputGroup inside style={style}>
          <AutoComplete
            value={current}
            className="autocomplete-box with-buttons"
            disabled={disabled}
            renderItem={({ label, slug, title, language }) => {
              return useSlug ?
                <div><em>({slug})</em>: {title} <Language>{language}</Language></div>
                :
                <div>{title} <em>({slug})</em> <Language>{language}</Language></div>;
            }}
            onChange={(current, event) => {
              const isBackspace = event.nativeEvent != null && event.nativeEvent.inputType === 'deleteContentBackward';
              if (event.keyCode === 13) {
                const found = items.find(item => item.id === current);
                if (found != null) {
                  setSearch(null);
                  onChange(useSlug ? found.slug : found.id);
                }
              } else if (isBackspace) {
                if (search != null) {
                  setSearch(current);
                }
                setItems(null);
                onChange(null);
              } else if (useSlug && event.nativeEvent != null && event.nativeEvent.inputType === 'insertText' && current.startsWith('slug: ')) {
                setSearch(event.nativeEvent.data);
              } else if (event.nativeEvent != null && event.nativeEvent.inputType === 'insertText') {
                setSearch(String(current));
              }
            }}
            onSelect={item => {
              if (item != null) {
                setSearch(null);
                onChange(useSlug ? item.slug : item.id);
              }
            }}
            data={(items || []).map(item => ({
              key: item.id,
              value: item.id,
              label: item.slug + ' ' + item.title,
              ...item
              }))}
          />
          {search == null && items != null && (
            <InputGroup.Addon  style={{ marginTop: '-2px', marginRight: '-2px' }}>
              {items.map(item => (
                <ContentIcon
                  key={item.id}
                  disabled={item.id === content || disabled}
                  {...item}
                  onClick={() => setContent(item.id)}
                />
              ))}
            </InputGroup.Addon>
          )}
        </InputGroup>
      </div>
      <ButtonGroup className="content-buttons">
        {canCreate && (
          <IconButtonTooltip
            tooltip={useSlug && !_.isEmpty(value) ? `Create content for slug "${value}"`: 'Create content'}
            appearance="default"
            icon={<Icon icon="plus-square"/>}
            size="md"
            disabled={disabled}
            onClick={() => createContent({
              namespace,
              slug: useSlug && value != null ? value : undefined,
              chatbotId: state.chatbotId
            }, {
              disabledLanguages: (items || []).map(item => item.language),
              customFieldsSchema
            })}
          />
        )}
        <IconButtonTooltip
          tooltip="Remove all"
          appearance="default"
          size="md"
          icon={<Icon icon="close"/>}
          onClick={() => onChange(null)}
          disabled={disabled || value == null}
        />
      </ButtonGroup>
      {modal}
      {content != null && (
        <ContentPreview
          contentId={content}
          onCancel={() => setContent(null)}
          customFieldsSchema={customFieldsSchema}
          onDelete={async () => {
            setContent(null);
            const { data } = await client.query({ query: SEARCH, fetchPolicy: 'network-only', variables });
            setItems(data.contents);
          }}
          onSubmit={async () => {
            setContent(null);
            const { data } = await client.query({ query: SEARCH, fetchPolicy: 'network-only', variables });
            setItems(data.contents);
          }}
        />
      )}
    </div>
  );
};
ContentAutocomplete.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  // select content using the slug and not the id (slug could include a group of posts)
  useSlug: PropTypes.bool,
  // add can create button
  canCreate: PropTypes.bool,
  // component takes all the width
  fluid: PropTypes.bool,
  onChange: PropTypes.func,
  style: PropTypes.object,
  // restrict autocomplete and creation to this namespace
  namespace: PropTypes.string,
  // the schema for custom fields (suggest a limited set of custom field name)
  customFieldsSchema: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    defaultValue: PropTypes.string,
    color: PropTypes.oneOf(['red','orange', 'yellow', 'green', 'cyan', 'blue', 'violet'])
  }))
};


export default ContentAutocomplete;