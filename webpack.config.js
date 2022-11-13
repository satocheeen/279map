const path = require('path')

module.exports = {
    // モード値を production に設定すると最適化された状態で、
    // development に設定するとソースマップ有効でJSファイルが出力される
    mode: 'development',
  
    // メインとなるJavaScriptファイル（エントリーポイント）
    entry: './src/index.ts',

    target: 'node',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'index.js'
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
      // 拡張子を配列で指定
      extensions: [
        '.ts', '.js',
      ],
    },
  };