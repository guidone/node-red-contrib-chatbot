export default class Plugin {

  className = 'plugin';

  constructor(props) {
    this._views = {};
  }

  register(region, view, props) {

    if (region == null || region === '') {
      throw new Error('Region is a required parameter');
    }

    if (arguments.length === 2) {
      props = view;
    } else if (arguments.length === 1) {
      view = null;
      props = {};
    }

    if (this._views[region] == null) {
      this._views[region] = [];
    }
    // todo do some checks
    this._views[region].push({ view, props });


    return this;
  }

  getViews(region) {
    const regions = Array.isArray(region) ? region : [region];
    return regions
      .reduce((acc, region) => this._views[region] != null ? [...acc, ...this._views[region]] : acc, [])
      .filter(Boolean); //compact
  }
}
