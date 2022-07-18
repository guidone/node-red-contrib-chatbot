import gql from 'graphql-tag';

const SEARCH = gql`
query (
  $title: String,
  $id: Int,
  $slug: String,
  $namespace: String,
  $search: String,
  $chatbotId: String
) {
	contents(
    title: $title,
    id: $id,
    slug: $slug,
    namespace: $namespace,
    search: $search,
    chatbotId: $chatbotId
  ) {
    id,
    title,
    language,
    slug
  }
}`;

const CONTENT = gql`
query($id: Int) {
  categories {
    id,
    name
  }
  content(id: $id) {
    id,
    slug,
    title,
    body,
    categoryId,
    language,
    createdAt,
    payload,
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

const EDIT_CONTENT = gql`
mutation($id: Int!, $content: InputContent!) {
  editContent(id: $id, content: $content) {
    id,
    slug,
    title,
    body,
    language,
    payload,
    fields {
      id,
      name,
      value,
      type
    }
  }
}
`;

const CREATE_CONTENT = gql`
mutation($content: InputContent!) {
  createContent(content: $content) {
    id,
    slug,
    title,
    body,
    language,
    payload,
    fields {
      id,
      name,
      value,
      type
    }
  }
}
`;

const CATEGORIES = gql`
query($offset: Int, $limit: Int, $order: String, $namespace: String) {
  categories(offset: $offset, limit: $limit, order: $order, namespace: $namespace) {
    id,
    name,
    createdAt
  }
}
`;

const DELETE_CONTENT = gql`
mutation($id: Int!) {
  deleteContent(id: $id) {
    id
  }
}`;


export { SEARCH, CONTENT, EDIT_CONTENT, CREATE_CONTENT, CATEGORIES, DELETE_CONTENT };