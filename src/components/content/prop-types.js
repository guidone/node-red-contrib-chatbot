import PropTypes from 'prop-types';

const FieldsType = PropTypes.shape({
  slug: PropTypes.bool,
  categoryId: PropTypes.bool,
  language: PropTypes.bool,
  body: PropTypes.bool,
  custom_fields: PropTypes.bool,
  payload: PropTypes.bool
});

const LabelsType = PropTypes.shape({
  saveContent: PropTypes.string,
  deleteContent: PropTypes.string,
  createContent: PropTypes.string,
  emptyContent: PropTypes.string,
  payload: PropTypes.string,
  addField: PropTypes.string,
  availableFields: PropTypes.string,
  title: PropTypes.string,
  editContent: PropTypes.string,
  slug: PropTypes.string,
  tooltipSlug: PropTypes.string
});

const CustomFieldsSchemaType = PropTypes.arrayOf(PropTypes.shape({
  key: PropTypes.string,
  type: PropTypes.oneOf(['string', 'boolean', 'date', 'datetime', 'number', 'tags']),
  description: PropTypes.string,
  defaultValue: PropTypes.string,
  color: PropTypes.oneOf(['red','orange', 'yellow', 'green', 'cyan', 'blue', 'violet'])
}));

const ContentsType = {
  namespace: PropTypes.string,
  title: PropTypes.string,
  labels: LabelsType,
  breadcrumbs: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string, // the title of the page or the id of the page
    PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string
    })
  ])),
  fields: FieldsType,
  customFieldsSchema: CustomFieldsSchemaType
};

const ContentViewType = {
  error: PropTypes.object,
  category: PropTypes.array,
  onCancel: PropTypes.func,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  onDelete: PropTypes.func,
  disabled: PropTypes.bool,
  hasDelete: PropTypes.bool,
  content: PropTypes.shape({
    title: PropTypes.string,
    language: PropTypes.string,
    slug: PropTypes.string,
    categoryId: PropTypes.number,
    fields: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      type: PropTypes.string,
      value: PropTypes.any
    }))
  }),
  labels: LabelsType,
  fields: FieldsType,
  customFieldsSchema: CustomFieldsSchemaType,
  // only load these plugins, if null loads every content-tabs plugins
  plugins: PropTypes.arrayOf(PropTypes.string)
};

const ModalContentType = {
  contentId: PropTypes.number, // load the content if just the id provided
  ...ContentViewType
};

export { ContentsType, ModalContentType, ContentViewType };