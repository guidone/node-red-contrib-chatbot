import React, { useState, useRef } from 'react';
import gql from 'graphql-tag';
import _ from 'lodash';
import { Table, Icon, SelectPicker, ButtonGroup, Button, ButtonToolbar } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

import PageContainer from '../../../../src/components/page-container';
import Breadcrumbs from '../../../../src/components/breadcrumbs';
import SmartDate from '../../../../src/components/smart-date';
import Language from '../../../../src/components/language';
import CustomTable from '../../../../src/components/table';
import LanguagePicker from '../../../../src/components/language-picker';
import { Input } from '../../../../src/components/table-filters';
import ExportButton from '../../../../src/components/export-button';
import useMCContext from '../../../../src/hooks/mc-context';

import useContents from '../hooks/content';
import ModalContent from '../views/modal-content';
import hasField from '../helpers/has-field';


import { ContentsType } from '../prop-types';

const CONTENTS = gql`
query(
  $offset: Int,
  $limit: Int,
  $order: String,
  $categoryId: Int,
  $slug: String,
  $language: String,
  $namespace: String,
  $search: String,
  $chatbotId: String
) {
  counters {
    rows: contents {
     count(
       categoryId: $categoryId,
       slug: $slug,
       language: $language,
       namespace: $namespace,
       search: $search,
       chatbotId: $chatbotId
      )
    }
  }
  categories(namespace: $namespace, chatbotId: $chatbotId) {
    id,
    name
  }
  rows: contents(
    offset: $offset,
    limit: $limit,
    order: $order,
    categoryId: $categoryId,
    slug: $slug,
    language: $language,
    namespace: $namespace,
    search: $search,
    chatbotId: $chatbotId
  ) {
    id,
    slug,
    title,
    body,
    categoryId,
    language,
    createdAt,
    payload,
    namespace,
    chatbotId,
    category {
      id,
      name
    }

  }
}
`;

const LABELS = {
  createContent: 'Create content',
  emptyContent: 'No Content',
  saveContent: 'Save content',
  title: 'Title',
  slug: 'Slug'
};

const COLUMNS_SIZE = {
  date: 140,
  language: 50,
  slug: 80,
  categoryId: 80
};

const FILTERS_SCHEMA = [
  {
    name: 'search',
    label: 'Search',
    control: Input
  },
  {
    name: 'categoryId',
    placeholder: 'Filter by category',
    cleanable: true,
    block: true,
    data: data => data.categories.map(category => ({ value: category.id, label: category.name })),
    control: SelectPicker,
    type: 'number'
  },
  {
    name: 'slug',
    label: 'Slug',
    control: Input
  },
  {
    name: 'language',
    label: 'Language',
    control: LanguagePicker,
    block: true,
    cleanable: true
  }
];

const columnField = (columns = [], columnId, key, defaultValue) => {
  const column = columns.find(({ id }) => id === columnId);
  return column != null && !_.isEmpty(column[key]) ? column[key] : defaultValue;
}

const Contents = ({
  namespace,
  title,
  labels,
  breadcrumbs,
  customFieldsSchema,
  custom,
  fields,
  defaultContent,
  columns,
  plugins
 }) => {
  const { state } = useMCContext();
  const [filters, setFilters] = useState(null);
  const [content, setContent] = useState(null);
  const table = useRef();

  const {
    error,
    saving,
    deleteContent,
    editContent,
    createContent
  } = useContents();

  labels = { ...LABELS, ...labels };
  const columnsSize = {
    ...COLUMNS_SIZE,
    ...(columns || []).reduce((acc, { width, id }) => ({ ...acc, [id]: width }), {})
  };
  const disabled = saving;
  // remove unwanted column
  const filtersSchema = FILTERS_SCHEMA
    .filter(({ name }) => hasField(fields, name))
    .map(filter => ({ ...filter, label: columnField(columns, filter.name, 'label', filter.label)}))

  return (
    <PageContainer className="page-contents">
      <Breadcrumbs pages={breadcrumbs != null ? breadcrumbs : [title]}/>
      {content != null && (
        <ModalContent
          contentId={content.id}
          content={content}
          error={error}
          disabled={disabled}
          labels={labels}
          customFieldsSchema={customFieldsSchema}
          fields={fields}
          namespace={namespace}
          onCancel={() => setContent(null)}
          plugins={plugins}
          onSubmit={async content => {
            if (content.id != null) {
              await editContent({ variables: { id: content.id, content }})
            } else {
              await createContent({ variables: { content: { ...content, namespace, chatbotId: state.chatbotId } } });
            }
            setContent(null);
            table.current.refetch();
          }}
        />
      )}
      <CustomTable
        ref={table}
        query={CONTENTS}
        variables={{ namespace, chatbotId: state.chatbotId }}
        initialSortField="createdAt"
        initialSortDirection="desc"
        toolbar={(
          <ButtonToolbar>
            {_.isFunction(custom) ? custom({
              refetch: () => table.current.refetch(),
              disabled
            }) : custom}
            <Button
              appearance="primary"
              disabled={disabled}
              onClick={() => table.current.refetch()}>Refresh
            </Button>
            <Button
              appearance="primary"
              disabled={disabled}
              onClick={() => {
                const newContent = { title: '', body: '', fields: [], ...filters, namespace };
                setContent(_.isFunction(defaultContent) ? defaultContent(newContent) : newContent);
              }}>{labels.createContent}
            </Button>
            <ExportButton
              table="contents"
              namespace={namespace}
              disabled={disabled}
            />
          </ButtonToolbar>
        )}
        onFilters={setFilters}
        filtersSchema={filtersSchema}
        height={600}
        labels={{
          empty: labels.emptyContent
        }}
        autoHeight
      >
        <Column width={60} align="center">
          <HeaderCell>Id</HeaderCell>
          <Cell dataKey="id" />
        </Column>

        <Column width={columnsSize.date} resizable sortable>
          <HeaderCell>Date</HeaderCell>
          <Cell dataKey="createdAt">
            {({ createdAt }) => <SmartDate date={createdAt} />}
          </Cell>
        </Column>

        <Column width={260} align="left" sortable flexGrow={1}>
          <HeaderCell>{labels.title}</HeaderCell>
          <Cell dataKey="title" />
        </Column>

        {hasField(fields, 'slug') && (
          <Column width={columnsSize.slug} align="left" sortable resizable>
            <HeaderCell>{labels.slug}</HeaderCell>
            <Cell dataKey="slug" />
          </Column>
        )}

        {hasField(fields, 'language') && (
          <Column width={columnsSize.language} resizable>
            <HeaderCell>Language</HeaderCell>
            <Cell>
              {({ language }) => <Language>{language}</Language>}
            </Cell>
          </Column>
        )}

        {hasField(fields, 'categoryId') && (
          <Column width={columnsSize.categoryId} align="left" resizable>
            <HeaderCell>Category</HeaderCell>
            <Cell dataKey="category">
              {({ category }) => <span>{category != null ? category.name : ''}</span>}
            </Cell>
          </Column>
        )}

        {hasField(fields, 'body') && (
          <Column width={300} flexGrow={1}>
            <HeaderCell>Body</HeaderCell>
            <Cell dataKey="body" />
          </Column>
        )}

        {!_.isEmpty(columns) && (
          columns
            .filter(({ id }) => !['body', 'date', 'slug', 'category', 'language', 'title', 'createdAt'].includes(id))
            .map(({ label, id, width = undefined, flex = undefined, cell }) => (
              <Column
                key={id}
                width={width}
                flexGrow={flex}
              >
                <HeaderCell>{label}</HeaderCell>
                <Cell dataKey={id}>
                  {content => cell(content)}
                </Cell>
              </Column>
            ))
        )}

        <Column width={80} fixed>
          <HeaderCell>Action</HeaderCell>
          <Cell>
            {content => (
              <ButtonGroup>
                <Button
                  disabled={disabled}
                  size="xs"
                  onClick={async () => {
                    if (confirm(`Delete "${content.title}"?`)) {
                      await deleteContent({ variables: { id: content.id }})
                      table.current.refetch();
                    }
                  }}
                >
                  <Icon icon="trash" />
                </Button>
                <Button
                  disabled={disabled}
                  size="xs"
                  onClick={() => {
                    setContent(content)
                  }}
                >
                  <Icon icon="edit2" />
                </Button>
            </ButtonGroup>
            )}
          </Cell>
        </Column>
      </CustomTable>
    </PageContainer>
  );
};
Contents.propTypes = ContentsType;

export default Contents;
