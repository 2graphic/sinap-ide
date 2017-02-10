// File: webpack.config.js
// Created by: Daniel James
// Date created: January 2, 2017
//
// Builds and bundles everything into the ./build directory.
//

// Lots of ideas taken from: https://angular.io/docs/ts/latest/guide/webpack.html

const webpack = require('webpack');
const CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
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
        devtool: 'source-map',
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
            'vendor': "./app/vendor.ts",
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
            new HtmlWebpackPlugin({
                template: './app/index.html',
                chunks: ['polyfills', 'vendor', 'main']
            }),
            new HtmlWebpackPlugin({
                template: './app/modal-windows/index.html',
                filename: 'modal.html',
                chunks: ['polyfills', 'vendor', 'modal']
            }),

            new webpack.optimize.CommonsChunkPlugin({
                name: ['vendor', 'polyfills']
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
     * Temporary target to build in a DFA Interpreter into the project.
     */
    var pluginTarget = webpackMerge(common, {
        target: 'web',

        entry: {
            'dfa-interpreter': './plugins/dfa-interpreter'
        },

        output: {
            path: './build/plugins',
            library: 'module'
        },

        resolve: {
            extensions: ['.ts']
        },

        module: {
            loaders: [
                {
                    test: /dfa-interpreter.ts$/,
                    loaders: ['ts-loader'],
                    exclude: [/node_modules/, /app/, /build/]
                }
            ]
        }
    });


    /**
     * Our webpack configuration
     */
    var config = [
        electronTarget,
        webTarget,
        pluginTarget,
    ];

    // Adjustments for production build.
    if (ENV == 'production') {
        config = Array.from(config, (target) => {
            return webpackMerge(target, productionTarget);
        });
    }

    return config;
};