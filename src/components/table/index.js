import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Table, Placeholder, FlexboxGrid } from 'rsuite';
import PropTypes from 'prop-types';

const { Pagination } = Table;
const { Grid } = Placeholder;

import useRouterQuery from '../../../src/hooks/router-query';
import TableFilters from '../table-filters';
import useTable from './hooks/table';
import './style.scss';

const LABELS = {
  empty: 'No Content'
};

const CustomTable = ({
  children,
  query,
  variables = {},
  initialSortField = 'createdAt',
  initialSortDirection = 'desc',
  labels,
  filtersSchema = [],
  toolbar,
  onFilters = () => {},
  filterEvaluateParams = ['data'],
  onData = () => {},
  ...rest
}, ref) => {
  let filterKeys = (filtersSchema || []).map(item => item.name);
  // get all keys that are numeric and must be parsed to int
  const numericKeys = (filtersSchema || [])
    .filter(filter => filter.type === 'number')
    .map(filter => filter.name);
  const [loaded, setLoaded] = useState(false);
  const { query: urlQuery, setQuery } = useRouterQuery({
    numericKeys,
    onChangeQuery: query => {
      setFilters(_.pick(query, filterKeys));
      // if query changes, then reload the query, but don't do at startup
      if (loaded) {
        refetch();
      }
    }
  });

  const [ filters, setFilters ] = useState(_.pick(urlQuery, filterKeys));
  const [ cursor, setCursor ] = useState({
    page: 1,
    limit: 10,
    sortField: initialSortField,
    sortType: initialSortDirection
  });
  const { limit, page, sortField, sortType } = cursor;

  useEffect(() => {
    // reset cursor everytime filter changes
    setCursor({ ...cursor, page: 1, limit: 10 });
  }, [filters, sortField, sortType ]);

  const {
    bootstrapping,
    loading,
    error,
    data,
    refetch
  } = useTable({
    query,
    limit,
    page,
    sortField,
    sortType,
    filters,
    variables,
    onCompleted: rows => {
      onData(rows);
      setLoaded(true);
    }
  });

  useImperativeHandle(ref, () => ({
    refetch: () => refetch()
  }));

  labels = { ...LABELS, ...labels };

  const schema = filtersSchema.map(filter => {
    const evaluated = { ...filter };
    // iterate over params to be evaluated
    filterEvaluateParams.forEach(param => {
      if (_.isFunction(evaluated[param])) {
        if (bootstrapping) {
          evaluated[param] = [];
        } else {
          evaluated[param] = evaluated[param](data);
        }
      }
    });
    return evaluated;
  });

  return (
    <div className="ui-custom-table">
      {bootstrapping && <Grid columns={9} rows={3} />}
      {!bootstrapping && schema != null && (
        <div className="header">
          <div className="filters">
            <TableFilters
              filters={filters}
              onChange={filters => {
                setFilters(filters);
                setQuery(filters);
                onFilters(filters);
              }}
              schema={schema}
            />
          </div>
          {toolbar != null &&(
            <div className="toolbar">
              {toolbar}
            </div>
          )}
        </div>
      )}
      {!bootstrapping && (
        <Table
          data={data.rows || []}
          loading={loading}
          sortColumn={sortField}
          sortType={sortType}
          renderEmpty={() => <div style={{ textAlign: 'center', padding: 80}}>{labels.empty}</div>}
          onSortColumn={(sortField, sortType) => setCursor({ ...cursor, sortField, sortType })}
          {...rest}
        >
          {children}
        </Table>
      )}
      {!error && !bootstrapping && (
        <Pagination
          activePage={page}
          displayLength={limit}
          disabled={loading}
          onChangePage={page => setCursor({ ...cursor, page })}
          lengthMenu={[{ label: '10', value: 10 }, { label: '20', value: 20 }, { label: '30', value: 30 } ]}
          onChangeLength={limit => setCursor({ ...cursor, limit, page: 1 })}
          total={data.counters.rows.count}
      />
      )}
    </div>
  );
}
/*CustomTable.propTypes = {
  query: PropTypes.string,
  // the subset of content to display
  namespace: PropTypes.string,
  initialSortField: PropTypes.string,
  initialSortDirection: PropTypes.oneOf(['desc', 'asc']),
  // string labels of the component
  labels: PropTypes.shape({
    empty: PropTypes.string
  }),
  filtersSchema: PropTypes.arrayOf(PropTypes.oneOf([
    PropTypes.func,
    PropTypes.shape({
      name: PropTypes.string,
      label: PropTypes.string,
      control: PropTypes.any
    })
  ])),
  // callback when filters changes
  onFilters: PropTypes.func
};*/

export default forwardRef(CustomTable);