const webpack = require('webpack');

const config = {
    entry:  __dirname + '/js/react.jsx',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.js', '.jsx', '.css']
    },

    module: {
      rules: [
        {
          test: /\.jsx?/,
          exclude: /node_modules/,
          use: 'babel-loader'
        }
      ]
    },

    watchOptions: {
      poll: true
    },

};

module.exports = config;