var WebpackDevServer = require('webpack-dev-server');
var webpack = require('webpack');
var config = require('./webpack.config.js');
var path = require('path');

var compiler = webpack(config);
var server = new WebpackDevServer(compiler, {
    hot: true,
    filename: config.output.filename,
    publicPath: config.output.publicPath,
    stats: {
        colors: true
    },
    watchOptions: {
    poll: true
    }
});
server.listen(64000, '0.0.0.0', function() {});