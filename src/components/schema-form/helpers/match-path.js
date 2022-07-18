import _ from 'lodash';


const matchPath = (path1, path2) => {

  const a1 = path1.split('/');
  if (a1[0] === '') {
    a1.shift();
  }
  const a2 = path2.split('/');
  if (a2[0] === '') {
    a2.shift();
  }

  //console.log('--', a1, a2)

  let result = true;
  let idx;
  for(idx = 0; idx < Math.min(a1.length, a2.length); idx++) {
    const matchIndex1 = a1[idx].match(/\[([0-9])*\]/);
    const idx1 = matchIndex1 != null ? parseInt(matchIndex1[1], 10) : null;
    const matchIndex2 = a2[idx].match(/\[([0-9])*\]/);
    const idx2 = matchIndex2 != null ? parseInt(matchIndex2[1], 10) : null;
    const base1 = a1[idx].replace(/\[([0-9])*\]/, '');
    const base2 = a2[idx].replace(/\[([0-9])*\]/, '');

    if (base1 === base2 && (idx1 === idx2 || idx2 == null || idx1 == null)) {
      // same dir

    } else if (base2 === '*') {
      // wildcard

    } else {
      result = false;
    }
  }


  return result;
}


export default (path, paths) => {
  if (_.isEmpty(paths) || !_.isArray(paths)) {
    return true;
  }

  return paths.some(test => matchPath(path, test));
}