const _views = {};

function plug(region, view, props = {}) {

    if (region == null || region === '') {
      throw new Error('Region is a required parameter');
    }

    if (_views[region] == null) {
      _views[region] = [];
    }
    // todo do some checks
    _views[region].push({ view, props });

    return this;
  }

  export { plug as default, _views as anonymousViews };

