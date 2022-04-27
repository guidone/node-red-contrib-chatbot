export default (view, options) => {
  const id = options != null && options.id != null ? `-${options.id}` : '';
  if (view != null && view.displayName != null) {
    return `${view.displayName}${id}`;
  } else if (
    view != null &&
    view.prototype != null &&
    view.prototype.constructor != null &&
    view.prototype.constructor.displayName != null
  ) {
    return `${view.prototype.constructor.displayName}${id}`;
  } else if (view != null && view.prototype != null && view.prototype.namespace != null) {
    return `${view.prototype.namespace}${id}`;
  } else if (view != null && view.name != null) {
    return `${view.name}${id}`;
  } else if (id !== '') {
    return id;
  } else {
    console.log(
      `Both the "namespace" and "displayName" properties were missing from a registered view,
      it's needed to generate the correct key reference for child components in React`
    );
  }
};
