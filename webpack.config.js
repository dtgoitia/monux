const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const { root } = require('./tools/webpack-helpers')

const { ContextReplacementPlugin, optimize } = webpack
const { CommonsChunkPlugin } = optimize

module.exports = {
  entry: {
    app: './src/app/main.ts',
    polyfills: './src/app/polyfills.ts'
    // vendor: './src/app/vendor.js'
  },

  output: {
    path: root('dist', 'app'),
    // publicPath: '/',
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  resolve: {
    extensions: ['.ts', '.js', '.json']
  },

  devtool: 'inline-source-map',

  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          {
            loader: 'awesome-typescript-loader',
            options: { configFileName: './tsconfig.json' }
          },
          'angular2-template-loader'
        ]
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot|ico)$/,
        loader: 'file-loader?name=assets/[name].[hash].[ext]'
      },
      {
        test: /\.css$/,
        exclude: root('src', 'app'),
        loader: ExtractTextPlugin.extract({
          use: 'css-loader?sourceMap',
          fallback: 'style-loader'
        })
      },
      {
        test: /\.css$/,
        include: root('src', 'app'),
        loader: 'raw-loader'
      }
    ]
  },

  plugins: [
    new ContextReplacementPlugin(
      /angular(\\|\/)core(\\|\/)@angular/,
      './src/app',
      {}
    ),

    new CommonsChunkPlugin({
      name: ['app', 'polyfills']
    }),

    new HtmlWebpackPlugin({
      template: './src/app/index.html'
    }),

    new ExtractTextPlugin('[name].css')
  ]
}
