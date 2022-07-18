const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  // disabled source mapping on prod
  // devtool: 'source-map'
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Custom template',
      // Load a custom template (lodash by default)
      template: './src/index-html-plugin.html'
    })
  ]
});