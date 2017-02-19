// File: webpack.config.js
// Created by: Daniel James
// Date created: January 2, 2017
//
// Builds and bundles everything into the ./build directory.
//

// Lots of ideas taken from: https://angular.io/docs/ts/latest/guide/webpack.html

const webpack = require('webpack');
const CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
const webpackMerge = require('webpack-merge');

module.exports = (env = {}) => { // pass command line arguments like `webpack ... --env.arg=value`
    const ENV = env.ENV ? env.ENV : 'development';

    /**
     * Common configuration for all targets
     */
    let common = {
        devtool: 'cheap-module-eval-source-map', // There's faster/slower options depending on the quality of source map you want.

        node: {
            __dirname: false,
            __filename: false,
            fs: false,
        },

        output: {
            path: './build',
            filename: '[name].js',
            sourceMapFilename: '[name].js.map',
            chunkFilename: '[id].chunk.js'
        },

        resolve: {
            extensions: ['.ts', '.js', '.json', '.css', '.html']
        },

        module: {
            loaders: [
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    loader: "file-loader?name=[name]-[hash].[ext]"
                }
            ]
        },

        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'ENV': JSON.stringify(ENV)
                }
            }),
        ]
    }

    /**
     * Configurations to use specifically for ENV == 'production'
     */
    var productionTarget = {
        devtool: 'none',

        plugins: [
            new webpack.NoEmitOnErrorsPlugin(),

            // Note because our project is ES6, we're using the harmony branch of uglifyjs
            new webpack.optimize.UglifyJsPlugin({
                debug: false,
                minimize: true,
                output: {
                    comments: false
                },
            }),
        ]
    };



    /**
     * Target configuration for our electron bootstrap project
     */
    var electronTarget = webpackMerge(common, {
        target: 'electron',

        entry: {
            'index': './app/index',
        },

        module: {
            loaders: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                }
            ]
        }
    });

    /**
     * Target for the main sinap-ide project
     */
    var webTarget = webpackMerge(common, {
        target: 'web',

        entry: {
            'polyfills': "./app/polyfills.ts",
            'main': './app/main',
            'modal': './app/modal-windows/main'
        },

        module: {
            exprContextCritical: false, //https://github.com/angular/angular/issues/11580
            loaders: [
                {
                    test: /\.ts$/,
                    loaders: ['ts-loader', 'angular2-template-loader']
                },
                {
                    test: /\.html$/,
                    loader: "html-loader?interpolate&attrs[]=img:src&attrs[]=link:href"
                },
                {
                    test: /\.css$/,
                    loaders: ["to-string-loader", "css-loader"]
                }
            ]
        },

        plugins: [
            // Make sure to run `npm run build:dll` everytime you update angular
            new webpack.DllReferencePlugin({
                context: '.',
                manifest: require('./dll/vendor-manifest.json'),
            }),
        ],

        externals: {
            // Electron has its own syntax for requiring that conflicts with Webpack
            'electron': 'require("electron")',
            'net': 'require("net")',
            'remote': 'require("remote")',
            'shell': 'require("shell")',
            'app': 'require("app")',
            'ipc': 'require("ipc")',
            'fs': 'require("fs")',
            'buffer': 'require("buffer")',
            'system': '{}',
            'file': '{}'
        }
    });


    /**
     * Our webpack configuration
     */
    var config = [
        electronTarget,
        webTarget,
    ];

    // Adjustments for production build.
    if (ENV == 'production') {
        config = Array.from(config, (target) => {
            return webpackMerge(target, productionTarget);
        });
    }

    return config;
};