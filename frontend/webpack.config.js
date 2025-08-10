const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    port: 3000,
    proxy: {
      '/auth/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/users/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/posts/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/groups/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/activities/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/tasks/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/announcements/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/points/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/demo/**': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/leaderboard': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
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
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};

