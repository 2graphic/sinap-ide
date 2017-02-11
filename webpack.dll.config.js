var webpack = require('webpack')

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
    ],
}