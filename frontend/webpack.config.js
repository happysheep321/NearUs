const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  // 优化开发模式配置
  mode: 'development',
  devtool: 'eval-cheap-module-source-map', // 更快的source map
  cache: {
    type: 'filesystem', // 启用文件系统缓存
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    port: 3000,
    hot: true, // 启用热重载
    compress: true, // 启用gzip压缩
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    // 设置进程标题
    onListening: (devServer) => {
      if (devServer) {
        // 尝试设置进程标题
        try {
          process.title = 'NearUs - Frontend Service';
        } catch (e) {
          // 忽略错误
        }
      }
    },
    // 代理配置 - 将所有API请求代理到后端
    proxy: {
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/posts': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/groups': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/activities': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/tasks': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/announcements': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/points': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },

      '/demo': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/chat': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/friends': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },

      '/businesses': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/coupons': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/polls': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/photos': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/events': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/marketplace': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/skills': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/stats': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/games': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/lotteries': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/achievements': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/questions': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', 'ie >= 11']
                },
                useBuiltIns: 'usage',
                corejs: 3
              }],
              '@babel/preset-react'
            ],
            cacheDirectory: true, // 启用babel缓存
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[hash][ext]'
        }
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    // 添加模块解析优化
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  // 性能优化
  performance: {
    hints: false, // 关闭性能提示
  },
};

