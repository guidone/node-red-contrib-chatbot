import React, { useState, useEffect, Fragment, useRef } from 'react';
import gql from 'graphql-tag';
import { useQuery, useApolloClient } from 'react-apollo';
import _ from 'lodash';
import {
  Modal,
  Button,
  Form,
  FormGroup,
  ControlLabel,
  FormControl,
  FlexboxGrid,
  SelectPicker,
  HelpBlock,
  Nav
} from 'rsuite';
import { Views } from 'code-plug';

import FieldsEditor from '../../../../src/components/fields-editor';
import MarkdownEditor from '../../../../src/components/markdown-editor';
import ShowError from '../../../../src/components/show-error';
import LanguagePicker from '../../../../src/components/language-picker';
import JSONEditor from '../../../../src/components/json-editor';
import LoaderModal from '../../../../src/components/loader-modal';
import useCanCloseModal from '../../../../src/hooks/modal-can-close';
import useCurrentUser from '../../../../src/hooks/current-user';

import { content as contentModel } from '../models';
import '../styles/modal-content.scss';
import { ModalContentType, ContentViewType } from '../prop-types';
import hasField from '../helpers/has-field';

const LABELS = {
  saveContent: 'Save content',
  deleteContent: 'Delete',
  customFields: 'Custom Fields',
  payload: 'Content payload',
  title: 'Title',
  content: 'Content',
  createContent: 'Create content',
  editContent: 'Edit content',
  slug: 'Slug',
  category: 'Category',
  tabPayload: 'Payload',
  tooltipSlug: `is a shortcut for a content or a group of contents
   (for example the same article translated in different languages)`
};

const CATEGORIES = gql`
query($namespace: String) {
  categories(namespace: $namespace) {
    id,
    name
  }
}
`;

const GET_CONTENT = gql`
query($id: Int!) {
  content(id: $id) {
    id,
    slug,
    title,
    body,
    categoryId,
    language,
    createdAt,
    payload,
    namespace,
    category {
      id,
      name
    }
    fields {
      id,
      name,
      value,
      type
    }
  }
}
`;

const hasPlugin = (plugins, plugin) => plugins == null || plugins.includes(plugin);

const ContentView = ({
  content,
  onCancel = () => {},
  onSubmit = () => {},
  onDelete = () => {},
  onChange = () => {},
  disabled = false,
  hasDelete = false,
  error,
  fields,
  labels = {},
  disabledLanguages,
  customFieldsSchema,
  namespace,
  categories,
  plugins
}) => {
  const { can } = useCurrentUser();
  const [formValue, setFormValue] = useState(content);
  const [formError, setFormError] = useState(null);
  const [jsonValue, setJsonValue] = useState({
    json: !_.isEmpty(content.payload) ? JSON.stringify(content.payload, null, 2) : ''
  });
  const [tab, setTab] = useState('content');

  const form = useRef(null);
  const isNew = content.id == null;

  labels = { ...LABELS, ...labels };

  return (
    <Fragment>
      <Modal.Header>
        <Modal.Title>{isNew ? labels.createContent : `${labels.editContent} "${content.title}"`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error != null && <ShowError error={error}/>}
        <Nav
          appearance="tabs"
          active={tab}
          onSelect={tab => {
            // tab is switched to manual edit of payload, make sure the current payload field is serialized
            // in serialized payload in order to show the updated one
            if (tab === 'content-payload') {
              setJsonValue({
                json: !_.isEmpty(formValue.payload) ? JSON.stringify(formValue.payload, null, 2) : ''
              });
            }
            setTab(tab);
          }}
          activeKey={tab}
        >
          <Nav.Item eventKey="content">{labels.content}</Nav.Item>
          {hasField(fields, 'custom_fields') && <Nav.Item eventKey="custom_fields">{labels.customFields}</Nav.Item>}
          <Views region="content-tabs">
            {(View, { label, id, permission }) => {
              if ((_.isEmpty(permission) || can(permission)) && hasPlugin(plugins, id)) {
                return (
                  <Nav.Item key={id} active={id === tab} eventKey={id} onSelect={() => setTab(id)}>{label}</Nav.Item>
                );
              }
            }}
          </Views>
          {hasField(fields, 'payload') && <Nav.Item eventKey="content-payload">{labels.payload}</Nav.Item>}
        </Nav>
        <Form
          model={contentModel}
          ref={form}
          checkTrigger="none"
          formValue={formValue}
          formError={formError}
          onChange={formValue => {
            onChange(formValue);
            setFormValue(formValue);
            setFormError(null);
          }}
          onCheck={errors => {
            setFormError(errors);
            setTab(errors.fields != null ? 'custom_fields' : 'content');
          }}
          fluid autoComplete="off"
        >
          {tab === 'content' && (
            <Fragment>
              <FormGroup>
                <ControlLabel>{labels.title}</ControlLabel>
                <FormControl name="title"/>
              </FormGroup>
              {hasField(fields, 'slug', 'categoryId', 'language') && (
                <FlexboxGrid justify="space-between" style={{ marginBottom: '20px' }}>
                  {hasField(fields, 'slug') && (
                    <FlexboxGrid.Item colspan={7}>
                      <FormGroup>
                        <ControlLabel>
                          {labels.slug}
                          <HelpBlock tooltip>
                            <em>{labels.slug}</em> {labels.tooltipSlug}
                          </HelpBlock>
                        </ControlLabel>
                        <FormControl autoComplete="off" readOnly={disabled} name="slug" />
                      </FormGroup>
                    </FlexboxGrid.Item>
                  )}
                  {hasField(fields, 'categoryId') && (
                    <FlexboxGrid.Item colspan={7}>
                      <FormGroup>
                        <ControlLabel>{labels.category}</ControlLabel>
                        <FormControl
                          autoComplete="off"
                          readOnly={disabled}
                          name="categoryId"
                          block
                          cleanable={false}
                          data={categories.map(category => ({ value: category.id, label: category.name }))}
                          accepter={SelectPicker}
                        />
                      </FormGroup>
                    </FlexboxGrid.Item>
                  )}
                  {hasField(fields, 'language') && (
                    <FlexboxGrid.Item colspan={7}>
                      <FormGroup>
                        <ControlLabel>Language</ControlLabel>
                        <FormControl
                          readOnly={disabled}
                          name="language"
                          disabledItemValues={disabledLanguages}
                          cleanable={false}
                          block
                          accepter={LanguagePicker}
                        />
                      </FormGroup>
                    </FlexboxGrid.Item>
                  )}
                </FlexboxGrid>
              )}
              {hasField(fields, 'body') && (
                <FormGroup>
                  <FormControl readOnly={disabled} name="body" accepter={MarkdownEditor}/>
                </FormGroup>
              )}
              <Views region="content-body">
                {(View, { id, namespace: pluginNamespace }) => {
                  if (namespace === pluginNamespace) {
                    return (
                      <View
                        key={id}
                        formValue={formValue.payload}
                        onChange={payload => {
                          onChange({ ...formValue, payload });
                          setFormValue({ ...formValue, payload });
                        }}
                      />
                    );
                  }
                }}
              </Views>
            </Fragment>
          )}
          {tab === 'custom_fields' && (
            <FormGroup>
              <FormControl
                readOnly={disabled}
                name="fields"
                accepter={FieldsEditor}
                labels={{ addField: labels.addField, availableFields: labels.availableFields }}
                schema={customFieldsSchema}
              />
            </FormGroup>
          )}
          <Views region="content-tabs">
            {(View, { id }) => {
              if (id === tab) {
                return (
                  <View
                    key={id}
                    formValue={formValue.payload}
                    onChange={payload => {
                      onChange({ ...formValue, payload });
                      setFormValue({ ...formValue, payload });
                    }}
                  />
                );
              }
              return <div key={id}/>;
            }}
          </Views>
          {tab === 'content-payload' && (
          <Form
            formValue={jsonValue}
            formError={formError}
            fluid
            autoComplete="off"
          >
            <FormGroup>
              <FormControl
                readOnly={disabled}
                name="json"
                style={{ marginBottom: '20px' }}
                accepter={JSONEditor}
                onChange={json => {
                  if (!_.isEmpty(json)) {
                    let payload;
                    setJsonValue({ json });
                    try {
                      payload = JSON.parse(json);
                    } catch(e) {
                      // error do nothing
                      return;
                    }
                    onChange({ ...formValue, payload });
                    setFormValue({ ...formValue, payload });
                  }
                }}
              />
            </FormGroup>
          </Form>
        )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        {hasDelete && (
          <Button
            className="btn-delete"
            appearance="default"
            color="orange"
            disabled={disabled}
            onClick={() => {
              if (confirm(`Delete "${formValue.title}" ?`)) {
                onDelete(formValue)
              }
            }}
          >
            {labels.deleteContent}
          </Button>
        )}
        <Button onClick={onCancel} appearance="ghost">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled}
          onClick={() => {
            if (!form.current.check()) {
              return;
            }
            onSubmit(formValue);
          }}
        >
          {labels.saveContent}
        </Button>
      </Modal.Footer>
    </Fragment>
  );
};
ContentView.propTypes = ContentViewType;

const ModalContent = props => {
  const [state, setState] = useState({
    loading: props.contentId != null,
    content: null,
    error: null
  });
  const client = useApolloClient();
  const { setIsChanged, handleCancel } = useCanCloseModal({ onCancel: props.onCancel });
  const { namespace } = props;
  const { loading: loadingCategories, data } = useQuery(CATEGORIES, {
    fetchPolicy: 'network-only',
    variables: { namespace }
  });
  useEffect(() => {
    if (props.contentId != null) {
      client.query({ query: GET_CONTENT, fetchPolicy: 'network-only', variables: { id: props.contentId } })
        .then(response => setState({ loading: false, content: response.data.content }))
        .catch(error => setState({ loading: false, error }));
    }
  }, []);
  const loading = loadingCategories || state.loading;

  let inner;
  if (state.error != null) {
    inner = (
      <div style={{ padding: '80px 10px' }}>
        <ShowError error={state.error}/>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button onClick={props.onCancel} appearance="ghost">
            Close
          </Button>
        </div>
      </div>
    );
  } else if (!loading) {
    inner = (
      <ContentView
        {...props}
        content={props.contentId != null ? state.content : props.content}
        onChange={() => setIsChanged(true)}
        onCancel={handleCancel}
        categories={data.categories}
      />
    );
  } else {
    inner = (
      <div style={{ padding: '80px 10px' }}>
        <LoaderModal/>
      </div>
    );
  }

  return (
    <Modal backdrop show onHide={handleCancel} className="modal-content" overflow={false} size="md">
      {inner}
    </Modal>
  );
};
ModalContent.propTypes = ModalContentType;

export default ModalContent;
