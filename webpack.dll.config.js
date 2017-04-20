var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: {
        'vendor': ["./app/vendor.ts"],
    },

    output: {
        filename: '[name].bundle.js',
        path: './build',
        library: '[name]_lib',
    },

    module: {
        exprContextCritical: false, //https://github.com/angular/angular/issues/11580
        loaders: [
            {
                test: /material-design-icons.css$/,
                loaders: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
            },
            {
                test: /\.(jpe?g|png|gif|jpg|eot|woff|ttf|svg|woff2)$/,
                loader: "file-loader?name=[name]-[hash].[ext]"
            }
        ]
    },

    plugins: [
        new webpack.DllPlugin({
            path: './dll/[name]-manifest.json',
            name: '[name]_lib'
        }),
        new webpack.optimize.UglifyJsPlugin({
            debug: false,
            minimize: true,
            output: {
                comments: false
            },
        }),
        new ExtractTextPlugin( {filename: "[name].css", allChunks: true }),
    ],
}