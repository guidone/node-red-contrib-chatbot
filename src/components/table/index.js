import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Table, Placeholder, Checkbox } from 'rsuite';
import _ from 'lodash';

const { Pagination, Column, HeaderCell, Cell } = Table;
const { Grid } = Placeholder;

import useRouterQuery from '../../../src/hooks/router-query';
import TableFilters from '../table-filters';
import ShowError from '../show-error';

import useTable from './hooks/table';
import './style.scss';

const LABELS = {
  empty: 'No Content'
};

const CheckCell = ({ rowData, onChange, checked, checkedKeys, dataKey, disabled = false, ...props }) => (
  <Cell {...props} style={{ padding: 0 }}>
    <div className="checkbox-cell">
      <Checkbox
        value={rowData[dataKey]}
        inline
        disabled={disabled}
        onChange={onChange}
        checked={checked || checkedKeys.some(item => item === rowData[dataKey])}
      />
    </div>
  </Cell>
);


const CustomTable = ({
  children,
  query,
  variables = {},
  initialSortField = 'createdAt',
  initialSortDirection = 'desc',
  labels,
  filtersSchema = [],
  toolbar,
  disabled = false,
  selectable = false,
  //selection = { ids: [], all: false },
  onFilters = () => {},
  filterEvaluateParams = ['data'],
  onData = () => {},
  onSelect = () => {},
  ...rest
}, ref) => {
  const filterKeys = (filtersSchema || []).map(item => item.name);
  // get all keys that are numeric and must be parsed to int
  const numericKeys = (filtersSchema || [])
    .filter(filter => filter.type === 'number')
    .map(filter => filter.name);
  const [loaded, setLoaded] = useState(false);
  const [ selection, setSelection] = useState({ all: false, ids: []});
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
    refetch: () => {
      setSelection({ all: false, ids: [] });
      onSelect({ all: false, ids: [] });
      refetch();
    }
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

  const { all: selectedAll = false, ids: checkedKeys = [] } = selection;
  return (
    <div className="ui-custom-table">
      {bootstrapping && <Grid columns={9} rows={3} />}
      {!bootstrapping && schema != null && (
        <div className="header">
          <div className="filters">
            <TableFilters
              filters={filters}
              disabled={disabled || error}
              onChange={filters => {
                setFilters(filters);
                setQuery(filters);
                onFilters(filters);
              }}
              schema={schema}
            />
          </div>
          {toolbar != null && _.isFunction(toolbar) && (
            <div className="toolbar">
              {toolbar({
                filters,
                count: !error && !bootstrapping ? data.counters.rows.count : 0,
                selection: { ids: checkedKeys, all: selectedAll },
                setSelection
              })}
            </div>
          )}
          {toolbar != null && !_.isFunction(toolbar) && (
            <div className="toolbar">
              {toolbar}
            </div>
          )}
        </div>
      )}
      {!bootstrapping && error && (
        <ShowError error={error} />
      )}
      {!bootstrapping && !error && (
        <Table
          data={data.rows || []}
          loading={loading}
          sortColumn={sortField}
          sortType={sortType}
          renderEmpty={() => <div style={{ textAlign: 'center', padding: 80}}>{labels.empty}</div>}
          onSortColumn={(sortField, sortType) => setCursor({ ...cursor, sortField, sortType })}
          {...rest}
        >
          {selectable && (
            <Column width={50} align="center" key="selector">
              <HeaderCell style={{ padding: 0 }}>
                <div style={{ marginTop: '-9px' }}>
                  <Checkbox
                    inline
                    disabled={disabled}
                    checked={selectedAll}
                    indeterminate={checkedKeys.length !== 0}
                    onChange={() => {
                      onSelect({ ids: [], all: !selectedAll });
                      setSelection({ ids: [], all: !selectedAll });
                    }}
                  />
                </div>
              </HeaderCell>
              <CheckCell
                dataKey="id"
                checkedKeys={checkedKeys}
                disabled={disabled}
                checked={selectedAll}
                onChange={(value, checked) => {
                  if (selectedAll) {
                    onSelect({ ids: [value], all: false });
                  } else {
                    const ids = checked
                      ? [...checkedKeys, value]
                      : checkedKeys.filter(item => item !== value);
                    onSelect({ ids, all: false });
                    setSelection({ ids, all: false });
                  }
                }}
              />
            </Column>
          )}
          {children}
        </Table>
      )}
      {!error && !bootstrapping && (
        <Pagination
          activePage={page}
          displayLength={limit}
          disabled={loading || disabled}
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