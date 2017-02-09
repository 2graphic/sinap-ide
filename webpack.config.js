// File: webpack.config.js
// Created by: Daniel James
// Date created: January 2, 2017
//
// Builds and bundles everything into the ./build directory.
//

// Lots of ideas taken from: https://angular.io/docs/ts/latest/guide/webpack.html

var webpack = require('webpack');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var HtmlWebpackPlugin = require('html-webpack-plugin');

// TODO: Split this up into a general, development, and production configuration
const ENV = process.env.NODE_ENV = process.env.ENV = 'development';

module.exports = [

    // electron target
    {
        devtool: 'source-map',
        target: 'electron',

        node: {
            __dirname: false,
            __filename: false
        },

        entry: {
            'index': './app/index',
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
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    exclude: [/node_modules/, /plugins/]
                },
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    loader: "file-loader?name=[name]-[hash].[ext]"
                }
            ]
        }
    },

    // web target
    {
        devtool: 'source-map',
        target: 'web',

        node: {
            fs: false
        },

        entry: {
            'polyfills': "./app/polyfills.ts",
            'vendor': "./app/vendor.ts",
            'main': './app/main',
            'modal': './app/modal-windows/main'
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
                },
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    loader: "file-loader?name=[name]-[hash].[ext]"
                },
                {
                    test: /\.json$/,
                    loader: "file-loader?name=[path][name].[ext]"
                }
            ]
        },

        plugins: [
            new webpack.NoEmitOnErrorsPlugin(),
            // new webpack.optimize.UglifyJsPlugin({
            //     debug: false,
            //     minimize: true,
            //     sourceMap: false,
            //     output: {
            //         comments: false
            //     },
            // }),
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

            new webpack.DefinePlugin({
                'process.env': {
                    'ENV': JSON.stringify(ENV)
                }
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
    },

    // plugin target.
    {
        target: 'web',
        node: {
            fs: false
        },
        entry: {
            'dfa-interpreter': './plugins/dfa-interpreter'
        },
        output: {
            path: './build/plugins',
            filename: '[name].js',
            sourceMapFilename: '[name].js.map',
            chunkFilename: '[id].chunk.js',
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
    }];