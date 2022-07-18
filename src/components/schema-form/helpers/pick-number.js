export default function() {
  const list = Array.from(arguments);
  return list.find(_.isNumber);
};