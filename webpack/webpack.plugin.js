const merge = require('webpack-merge');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');


module.exports = (env = {}) => {
  let { plugin, filename } = env;
  console.log(`Building plugin ${plugin}`);
  if (_.isEmpty(filename)) {
    filename = plugin + '.js';
  }
  const packageFile = path.resolve(__dirname, `../mc_plugins/${plugin}/package.json`);
  if (!fs.existsSync(packageFile)) {
    console.error(`Missing package.json file (${packageFile})`);
  }

  const packageRaw = fs.readFileSync(packageFile);
  const package = JSON.parse(String(packageRaw));

  // TODO check if name starts with .replace('red-bot', '')

  return {
    //mode: 'production',
    //devtool: 'eval-source-map',
    mode: 'production',
    entry: `./mc_plugins/${plugin}/index.js`,
    output: {
      filename,
      path: path.resolve(__dirname, `../mc_plugins/${plugin}/dist`),
      libraryTarget: 'amd'
    },
    externals : [
      {
        rsuite: 'amd rsuite',
        react: 'amd react',
        'react-dom': 'amd react-dom',
        lodash: 'amd lodash',
        classnames: 'amd classnames',
        moment: 'amd moment',
        'prop-types': 'amd prop-types',
        'code-plug': 'amd code-plug',
        'react-apollo': 'amd react-apollo',
        'graphql-tag': 'amd graphql-tag',
        'react-router-dom': "amd react-router-dom",
        "react-sortable-hoc": "amd react-sortable-hoc",
        'ace-builds': 'amd ace-builds',
        'codemirror': 'amd codemirror',
        'marked': 'amd marked',
        'react-ace': 'amd react-ace',
        'use-http': 'amd use-http'
      },
      /hooks\/socket/,
      /components/i // mark components as external
    ],
    plugins: [
      new webpack.BannerPlugin({
        banner: `Name: ${package.name.replace('red-bot-', '')}
Id: ${package.name.replace('red-bot-', '')}
Version: ${package.version}
Description: ${package.description}
Author: ${package.author.name} (${package.author.url})
Repository: ${package.homepage}`,
        entryOnly: true
      })
    ],
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({
        extractComments: false,
      })],
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react'],
              plugins: [
                '@babel/plugin-proposal-class-properties'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
          ]
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          use: [
            'file-loader'
          ]
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader'
          ]
        },
        {
          test: require.resolve('../src/components/index.js'),
          use: 'exports-loader?CollectionEditor,HelpElements,withConfigurationPage,ContentAutocomplete',
        }
      ]
    }
  };
};