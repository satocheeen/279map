const path = require('path')
const Dotenv = require('dotenv-webpack');
const enviroment = process.env.NODE_ENV || 'dev';
const webpack = require('webpack');

module.exports = {
    mode: 'development',
  
    entry: './src/index.ts',

    target: 'node',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'main.js'
    },
    
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
            },
        ],
    },
    resolve: {
        extensions: [
            '.ts', '.js',
        ],
        alias: {
            // 実行時エラーの対処
            // https://github.com/apollographql/apollo-server/issues/4637
            graphql$: path.resolve(__dirname, './node_modules/graphql/index.js'),
        }
    },
	plugins: [
        new Dotenv({
            path: path.resolve(__dirname, `.env.${enviroment}`),
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /canvas/,
            contextRegExp: /jsdom$/
        }),
        new webpack.NormalModuleReplacementPlugin(/^hexoid$/, require.resolve('hexoid/dist/index.js'))
    ],
    ignoreWarnings: [
        {
            module: /[log4js|express]/,
            message: /Critical dependency: the request of a dependency is an expression/,
        },
    ],
};