const path = require('path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { AngularCompilerPlugin } = require('@ngtools/webpack')

const postcssPresetEnv = require('postcss-preset-env')
const postcssEasingGradients = require('postcss-easing-gradients')
const postcssColorGray = require('postcss-color-gray')

const { ProgressPlugin, NormalModuleReplacementPlugin } = webpack

const postCssPlugins = () => [
  postcssPresetEnv({
    stage: 0,
    browsers: 'Chrome 66'
  }),
  postcssEasingGradients,
  postcssColorGray
]

module.exports = (env, options) => {
  const devMode = options.mode !== 'production'

  return {
    entry: {
      app: './src/app/main.ts',
      polyfills: './src/app/polyfills.ts'
    },

    output: {
      path: path.resolve('dist', 'app'),
      filename: '[name].js',
      chunkFilename: '[id].chunk.js'
    },

    mode: 'development',

    target: 'electron-renderer',

    resolve: {
      extensions: ['.ts', '.js', '.json']
    },

    externals: {
      keytar: "require('keytar')"
    },

    devtool: devMode ? 'inline-source-map' : 'source-map',

    watchOptions: {
      aggregateTimeout: 1000,
      ignored: ['node_modules', 'dist', '.git']
    },

    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },

    module: {
      rules: [
        // html files
        {
          test: /\.html$/,
          loader: 'html-loader'
        },

        // asset files
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|[to]tf|eot|ico)$/,
          loaders: [
            {
              loader: 'file-loader',
              options: { name: 'assets/[name].[hash:8].[ext]' }
            }
          ]
        },

        // page css
        {
          test: /\.css$/,
          include: path.resolve('src', 'app', 'style'),
          loaders: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: { sourceMap: true, importLoaders: 1 }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: 'inline',
                ident: 'postcss',
                plugins: postCssPlugins
              }
            }
          ]
        },

        // angular component css
        {
          test: /\.css$/,
          exclude: path.resolve('src', 'app', 'style'),
          loaders: [
            'to-string-loader',
            {
              loader: 'css-loader',
              options: { sourceMap: true, importLoaders: 1 }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: 'inline',
                ident: 'postcss',
                plugins: postCssPlugins
              }
            }
          ]
        },

        // angular files
        {
          test: /\.ngfactory\.js|\.ngstyle\.js|\.ts$/,
          loader: '@ngtools/webpack'
        }
      ]
    },

    plugins: [
      new ProgressPlugin(),

      new NormalModuleReplacementPlugin(
        /environments\/environment$/,
        resource => {
          if (options.mode === 'production') resource.request += '.prod'
        }
      ),

      new CopyWebpackPlugin([
        // electron-level icons
        { from: './monux.*', context: './src', to: '../' },

        // app icons
        { from: './assets/', context: './src/app', to: './assets' }
      ]),

      new AngularCompilerPlugin({
        tsConfigPath: './tsconfig.webpack.json',
        mainPath: './src/app/main.ts',
        sourceMap: true,
        skipCodeGeneration: devMode,
        compilerOptions: {
          debug: devMode
        }
      }),

      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].chunk.css'
      }),

      new HtmlWebpackPlugin({
        template: './src/app/index.html',
        // baseHref: devMode ? '/' : './',
        chunksSortMode: (chunk1, chunk2) => {
          const orders = ['polyfills', 'vendor', 'app']
          return (
            orders.indexOf(chunk1.names[0]) - orders.indexOf(chunk2.names[0])
          )
        }
      })
    ]
  }
}
