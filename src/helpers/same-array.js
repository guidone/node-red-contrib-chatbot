const sameArray = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  const cmp = arr2.sort();
  return arr1
    .sort()
    .every((item, idx) => item === cmp[idx]);
};

export default sameArray;
