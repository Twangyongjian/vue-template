const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const createThemeColorReplacerPlugin = require('./config/plugin.config')
const CompressionWebpackPlugin = require('compression-webpack-plugin') //引入插件
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const productionGzipExtensions = ['html', 'js', 'css', 'TTF', 'ttf'] //压缩html, js, css, TTF, ttf文件
const isDevelopment = process.env.NODE_ENV === 'development'
const publicPath = process.env.NODE_ENV === 'development' ? '' : '././'

function resolve(dir) {
  return path.join(__dirname, dir)
}

// vue.config.js
const vueConfig = {
  configureWebpack: {
    // webpack plugins
    plugins: [
      // Ignore all locale files of moment.js
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // 配置compression-webpack-plugin压缩
      new CompressionWebpackPlugin({
        algorithm: 'gzip',
        test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
        threshold: 10240,
        minRatio: 0.8
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 5,
        minChunkSize: 100
      })
    ],
    externals: {
      vue: 'Vue',
      'vue-router': 'VueRouter',
      vuex: 'Vuex',
      axios: 'axios',
      wangeditor: 'wangeditor',
      'vue-video-player': 'VueVideoPlayer',
      BMap: 'BMap',
      BMap_Symbol_SHAPE_POINT: 'BMap_Symbol_SHAPE_POINT'
    }
  },

  chainWebpack: config => {
    config.resolve.alias.set('@$', resolve('src'))

    const svgRule = config.module.rule('svg')
    svgRule.uses.clear()
    svgRule
      .oneOf('inline')
      .resourceQuery(/inline/)
      .use('vue-svg-icon-loader')
      .loader('vue-svg-icon-loader')
      .end()
      .end()
      .oneOf('external')
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'assets/[name].[hash:8].[ext]'
      })
    config.plugin('html').tap(args => {
      args[0].title = '星辰计划'
      return args
    })
  },

  css: {
    loaderOptions: {
      less: {
        modifyVars: {
          // less vars，customize ant design theme
          // 'primary-color': '#F5222D',
          // 'link-color': '#F5222D',
          // 'border-radius-base': '4px'
        },
        // DO NOT REMOVE THIS LINE
        javascriptEnabled: true
      }
    }
  },

  devServer: {
    // 自动打开浏览器
    open: true,
    // development server port 8000
    port: 8000,
    // If you want to turn on the proxy, please remove the mockjs /src/main.js
    proxy: {
      '/api': {
        //target: 'http://localhost:8080', //本地
        changeOrigin: true,
        ws: false, // 是否启用websockets
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  publicPath: publicPath,
  outputDir: process.env.outputDir, //构建时的输出目录
  assetsDir: 'static', //放置静态资源的目录
  indexPath: 'index.html', //html 的输出路径
  // disable source map in production
  productionSourceMap: false,
  lintOnSave: false,
  // babel-loader no-ignore node_modules/*
  transpileDependencies: []
}

// add `ThemeColorReplacer` plugin to webpack plugins
vueConfig.configureWebpack.plugins.push(createThemeColorReplacerPlugin())
if (!isDevelopment) {
  // 依赖大小分析工具
  vueConfig.configureWebpack.plugins.push(new BundleAnalyzerPlugin())
  // 打包代码压缩
  vueConfig.configureWebpack.plugins.push(
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          //warnings: false, // 若打包错误，则注释这行
          drop_debugger: true,
          drop_console: true,
          pure_funcs: ['console.log']
        }
      },
      sourceMap: false,
      parallel: true
    })
  )
  vueConfig.configureWebpack.plugins.push(
    new AddAssetHtmlPlugin({
      // dll文件位置
      filepath: resolve('./public/vendor/*.js'),
      // dll 引用路径
      publicPath: './vendor',
      // dll最终输出的目录
      outputPath: './vendor'
    })
  )
  const files = fs.readdirSync(path.resolve(__dirname, './public/vendor'))
  files.forEach(file => {
    if (/.*\.manifest.json/.test(file)) {
      vueConfig.configureWebpack.plugins.push(
        new webpack.DllReferencePlugin({
          context: process.cwd(),
          manifest: require(`./public/vendor/${file}`)
        })
      )
    }
  })
}

module.exports = vueConfig
