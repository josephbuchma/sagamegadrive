module.exports = {
  context: __dirname,
  entry: ['babel-polyfill', './index.js'],
  output: {
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [__dirname + '/node_modules/babel-preset-react',
            __dirname + '/node_modules/babel-preset-es2015']
        }
      }
    ]
  }
}
