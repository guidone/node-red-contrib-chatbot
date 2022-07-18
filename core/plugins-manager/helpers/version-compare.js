const fill = (a, length) => {
  while (a.length < length) {
    a.push(0);
  }
}

export default function versionCompare(v1, v2) {
  const v1s = v1.split('.').slice(0, 3).map(v => parseInt(v, 10));
  const v2s = v2.split('.').slice(0, 3).map(v => parseInt(v, 10));

  fill(v1s, 3);
  fill(v2s, 3);

  if (v1s[0] > v2s[0]) {
    return 1;
  } else if (v1s[0] < v2s[0]) {
    return -1;
  } else {
    if (v1s[1] > v2s[1]) {
      return 1;
    } else if (v1s[1] < v2s[1]) {
      return -1;
    } else {
      if (v1s[2] > v2s[2]) {
        return 1;
      } else if (v1s[2] < v2s[2]) {
        return -1;
      }
    }
  }

  return 0;
}
