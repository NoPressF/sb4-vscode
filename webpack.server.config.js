
const path = require('path');

module.exports = {
  target: 'node',
  entry: './server/src/server.ts',
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist', 'server'),
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
