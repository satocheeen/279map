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
    externals: {
        'sharp': 'commonjs sharp'
    },
    resolve: {
        extensions: [
            '.ts', '.js',
        ],
    },
	plugins: [
        new Dotenv({
            path: path.resolve(__dirname, `.env.${enviroment}`),
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /canvas/,
            contextRegExp: /jsdom$/
        }),
    ],
    ignoreWarnings: [
        {
            module: /[log4js|express]/,
            message: /Critical dependency: the request of a dependency is an expression/,
        },
    ],
};