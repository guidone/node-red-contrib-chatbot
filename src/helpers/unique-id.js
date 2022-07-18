import _ from 'lodash';

export default prefix => _.uniqueId(prefix) + '_' + Math.round(Math.random()*10000);