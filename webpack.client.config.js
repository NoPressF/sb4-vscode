
const path = require('path');

module.exports = {
  target: 'node',
  entry: './client/src/extension.ts',
  output: {
    filename: 'extension.js',
    path: path.resolve(__dirname, 'dist', 'client'),
    libraryTarget: 'commonjs2',
    clean: true
  },
  ignoreWarnings: [
    {
      module: /[\\/]vscode-languageserver-types[\\/]lib[\\/]umd[\\/]main\.js$/,
      message: /Critical dependency: require function is used/
    }
  ],
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'shared/src')
    }
  },
  module: { rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }] },
  devtool: 'source-map'
};
