import React from 'react';
import { Link } from 'react-router-dom';

import ShowError from '../components/show-error';

const PageNotFound = () => {
  return (
    <div className="page page-not-found" style={{ paddingTop: '100px' }}>
      <ShowError
        title="Page not found"
        error={<div>This page doesn't exist, go back to the <Link to="/">dashboard</Link></div>}
      />
    </div>
  );
};

export default PageNotFound;
