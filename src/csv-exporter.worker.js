// top import to ensure a transparent communication channel
// eslint-disable-next-line
importScripts('https://unpkg.com/workway/worker.js');

const PAGE_SIZE = 10;
const CONTENTS_FIELDS = ['id', 'title', 'slug', 'body', 'payload'];
const CONTACTS_FIELDS = ['id', 'userId', 'email', 'first_name', 'last_name', 'language', 'payload'];

const fetchQL = ({ query, token, url }) => {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    })
      .then(r => r.json())
      .then(data => {
        resolve(data.data);
      })
      .catch(reject);
  });
};

const isObject = obj => obj === Object(obj);

const encodeValue = value => {
  if (value == null) {
    return '';
  } else if (isObject(value)) {
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  } else {
    const toEncode = String(value);
    if (toEncode.includes(',')) {
      return `"${toEncode.replace(/"/g, '""')}"`;
    } else {
      return toEncode;
    }
  }
};

const buildCSVRow = (row, fields, columns) => {
  const customFields = [...fields];
  const column = columns.map(field => encodeValue(row[field]));

  if (row.fields != null && row.fields.length !== 0) {
    const fields = row.fields.reduce((acc, { name, value }) => ({ ...acc, [name]: String(value) }), {});
    // put all values for fields already includes in the current list of custom fields
    customFields.forEach(fieldName => column.push(encodeValue(fields[fieldName])));
    // now add all fields not included in the current list of custom fields
    Object.keys(fields)
      .filter(key => !customFields.includes(key))
      .forEach(key => {
        column.push(encodeValue(fields[key]));
        // and then also add the new field to the list of custom fields, must be in the
        // same order for next lines
        customFields.push(key);
      });
  }

  return {
    row: column.join(',') + '\r\n',
    customFields
  };
};

const fetchContents = async ({ namespace, offset, token, urlGraphQL, chatbotId }) => {
  const res = await fetchQL({
    query: `
      query{
        contents(namespace: "${namespace}", limit: ${PAGE_SIZE}, offset: ${offset}, chatbotId:"${chatbotId}") {
          id,
          title,
          slug,
          payload,
          category {
            name
          },
          fields {
            name,
            value
          },
        }
      }
    `,
    token,
    url: urlGraphQL
  });
  return res;
};

const fetchUsers = async ({ offset, token, urlGraphQL, chatbotId }) => {
  const res = await fetchQL({
    query: `
      query{
        users(limit: ${PAGE_SIZE}, offset: ${offset}, chatbotId:"${chatbotId}"){
          id,
          userId,
          email,
          first_name,
          last_name,
          language,
          payload
        }
      }
    `,
    token,
    url: urlGraphQL
  });
  return res;
};

// eslint-disable-next-line
workway({

  exportContentCSV: async ({ namespace, token, urlGraphQL, chatbotId }) => {
    postMessage({ current: 0, pages: 0, total: 0 });
    // get number of records
    const counters = await fetchQL({
      query: `query{
        counters{
          contents{
            count(namespace: "${namespace}", chatbotId: "${chatbotId}")
          }
        }
      }`,
      token,
      url: urlGraphQL
    });
    const total = counters.counters.contents.count;
    const pages = Math.ceil(total / PAGE_SIZE);

    postMessage({ current: 0, pages, total });

    const lines = [];
    let customFields = [];
    for(let currentPage = 0; currentPage <= pages; currentPage++) {
      const data = await fetchContents({ namespace, offset: currentPage*PAGE_SIZE, token, urlGraphQL, chatbotId });
      data.contents.forEach(content => {
        const { row, customFields: newFields } = buildCSVRow(content, customFields, CONTENTS_FIELDS);
        lines.push(row);
        customFields = newFields;
      });
      postMessage({ current: currentPage, pages, total });
    }

    // add headers
    lines.unshift(
      CONTENTS_FIELDS.join(',') +
      (customFields.length !== 0 ? ',' : '') +
      customFields.join(',') +
      '\r\n'
    );

    // finally build the blob and the download url for it
    const blob = new Blob(lines, { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    return url;
  },

  exportUsersCSV: async ({ token, urlGraphQL, chatbotId }) => {
    // get number of records
    const counters = await fetchQL({
      query: `query {
        counters{
          users{
            count(chatbotId: "${chatbotId}")
          }
        }
      }`,
      token,
      url: urlGraphQL
    });
    const total = counters.counters.users.count;
    const pages = Math.ceil(total / PAGE_SIZE);

    postMessage({ current: 0, pages, total });

    const lines = [];
    for(let currentPage = 0; currentPage <= pages; currentPage++) {
      const data = await fetchUsers({ offset: currentPage*PAGE_SIZE, token, urlGraphQL, chatbotId });
      data.users.forEach(contact => {
        const { row } = buildCSVRow(contact, [], CONTACTS_FIELDS);
        lines.push(row);
      });
      postMessage({ current: currentPage, pages, total });
    }

    // add headers
    lines.unshift(
      CONTACTS_FIELDS.join(',') +
      '\r\n'
    );

    // finally build the blob and the download url for it
    const blob = new Blob(lines, { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    return url;
  },
});
